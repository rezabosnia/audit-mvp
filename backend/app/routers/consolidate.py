import json
import re
import uuid
from pathlib import Path
from typing import List, Optional, Set

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.audit_rules import compute_findings
from app.services.consolidation import consolidate, _load_mapping
from app.services.financial_statements import compute_all
from app.services.storage import save_session
from app.services.workpapers import compute_workpapers

router = APIRouter()


def _detect_entity_code(filename: str, mapping_codes: Set[str], fallback: str) -> str:
    """Detect entity code by matching filename against known codes from the mapping."""
    name_upper = Path(filename).stem.upper()
    # Check if any known mapping code appears in the filename
    for code in sorted(mapping_codes):
        if code in name_upper:
            return code
    # Fallback: first alphanumeric segment of the filename
    match = re.match(r"[A-Z0-9]+", name_upper)
    return match.group(0)[:8] if match else fallback


@router.post("/consolidate")
async def consolidate_upload(
    parent_file: UploadFile = File(...),
    subsidiary_files: List[UploadFile] = File(...),
    mapping_file: UploadFile = File(...),
    entity_codes: str = Form("[]"),
):
    def _is_excel(f: UploadFile) -> bool:
        return (f.filename or "").lower().endswith((".xlsx", ".xls"))

    if not _is_excel(parent_file):
        raise HTTPException(400, "Parent file must be an Excel file (.xlsx or .xls)")
    if not _is_excel(mapping_file):
        raise HTTPException(400, "Mapping file must be an Excel file (.xlsx or .xls)")
    for sf in subsidiary_files:
        if not _is_excel(sf):
            raise HTTPException(400, f"Subsidiary file '{sf.filename}' must be an Excel file")

    parent_bytes = await parent_file.read()
    mapping_bytes = await mapping_file.read()

    try:
        codes: List[str] = json.loads(entity_codes)
    except Exception:
        codes = []

    # Extract all entity codes declared in the mapping file so we can detect them from filenames
    try:
        mapping = _load_mapping(mapping_bytes)
        mapping_codes: Set[str] = {k[0] for k in mapping.keys()}
    except Exception:
        mapping_codes = set()

    entity_files = [("HOLDING", parent_bytes)]
    entity_names = [parent_file.filename or "Parent"]

    for i, sf in enumerate(subsidiary_files):
        content = await sf.read()
        provided = codes[i].strip() if i < len(codes) else ""
        if provided:
            code = provided.upper()
        else:
            code = _detect_entity_code(
                sf.filename or f"sub{i+1}",
                mapping_codes,
                fallback=f"SUB{i+1:02d}",
            )
        entity_files.append((code, content))
        entity_names.append(sf.filename or f"Subsidiary {i+1}")

    try:
        consolidated_raw = consolidate(entity_files, mapping_bytes)
    except Exception as e:
        raise HTTPException(422, f"Consolidation failed: {e}")

    try:
        reports = compute_all(consolidated_raw)
    except Exception as e:
        raise HTTPException(500, f"Failed to compute financial statements: {e}")

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
        "filename": f"Consolidated — {len(entity_files)} entities",
        "je_count": len(consolidated_raw["je"]),
        "account_count": len(consolidated_raw["coa"]),
        "status": "consolidated",
        "entity_count": len(entity_files),
        "entity_names": entity_names,
    }

    save_session(session_id, reports)

    return {
        "session_id": session_id,
        "entity_count": len(entity_files),
        "je_count": len(consolidated_raw["je"]),
    }
