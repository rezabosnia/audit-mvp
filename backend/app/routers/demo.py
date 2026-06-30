import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.audit_rules import compute_findings
from app.services.consolidation import consolidate
from app.services.financial_statements import compute_all
from app.services.storage import save_session
from app.services.workpapers import compute_workpapers

router = APIRouter()

# Sample files live two levels up from this file: repo_root/nusantara_*.xlsx
_REPO_ROOT = Path(__file__).parent.parent.parent.parent

SAMPLE_FILES = {
    "holding": _REPO_ROOT / "nusantara_holding.xlsx",
    "infra": _REPO_ROOT / "nusantara_infra.xlsx",
    "digit": _REPO_ROOT / "nusantara_digit.xlsx",
    "mapping": _REPO_ROOT / "nusantara_coa_mapping.xlsx",
}

SAMPLE_META = {
    "holding": {"label": "Parent Company Ledger", "description": "Nusantara Holding — parent entity with Chart_of_Accounts and Journal_Entries sheets"},
    "infra": {"label": "Subsidiary Ledger (Infrastructure)", "description": "Nusantara Infrastructure — tower and network operations subsidiary"},
    "digit": {"label": "Subsidiary Ledger (Digital)", "description": "Nusantara Digital — IT and digital services subsidiary"},
    "mapping": {"label": "COA Mapping File", "description": "Maps subsidiary account numbers to parent accounts. Columns: Entity_Code, Sub_Account_No, Parent_Account_No"},
}


@router.get("/demo/files")
def list_sample_files():
    return [
        {"key": k, **SAMPLE_META[k], "filename": SAMPLE_FILES[k].name}
        for k in SAMPLE_FILES
    ]


@router.get("/demo/download/{key}")
def download_sample_file(key: str):
    if key not in SAMPLE_FILES:
        raise HTTPException(404, f"Unknown sample file: {key}")
    path = SAMPLE_FILES[key]
    if not path.exists():
        raise HTTPException(404, f"Sample file not found on disk: {path.name}")
    return FileResponse(
        path=str(path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=path.name,
    )


@router.post("/demo/run")
def run_demo():
    for key, path in SAMPLE_FILES.items():
        if not path.exists():
            raise HTTPException(500, f"Sample file missing: {path.name}. Ensure Nusantara Excel files are in the repo root.")

    entity_files = [
        ("HOLDING", SAMPLE_FILES["holding"].read_bytes()),
        ("INFRA", SAMPLE_FILES["infra"].read_bytes()),
        ("DIGIT", SAMPLE_FILES["digit"].read_bytes()),
    ]
    mapping_bytes = SAMPLE_FILES["mapping"].read_bytes()

    try:
        consolidated_raw = consolidate(entity_files, mapping_bytes)
    except Exception as e:
        raise HTTPException(422, f"Consolidation failed: {e}")

    try:
        reports = compute_all(consolidated_raw)
    except Exception as e:
        raise HTTPException(500, f"Financial statements failed: {e}")

    try:
        findings = compute_findings(consolidated_raw)
    except Exception:
        findings = {"findings": [], "total": 0, "high": 0, "medium": 0, "low": 0}

    reports["findings"] = findings
    reports["metrics"]["findings_count"] = findings["total"]
    reports["metrics"]["high_risk_count"] = findings["high"]

    try:
        reports["workpapers"] = compute_workpapers(consolidated_raw, findings)
    except Exception:
        reports["workpapers"] = {"workpapers": [], "total": 0}

    session_id = str(uuid.uuid4())
    reports["je"] = consolidated_raw["je"]
    reports["metadata"] = {
        "session_id": session_id,
        "filename": "Consolidated — 3 entities (Demo)",
        "je_count": len(consolidated_raw["je"]),
        "account_count": len(consolidated_raw["coa"]),
        "status": "consolidated",
        "entity_count": 3,
        "entity_names": ["nusantara_holding.xlsx", "nusantara_infra.xlsx", "nusantara_digit.xlsx"],
    }

    save_session(session_id, reports)

    return {"session_id": session_id, "je_count": len(consolidated_raw["je"]), "entity_count": 3}
