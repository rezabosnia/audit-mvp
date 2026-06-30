import math
import re

from fastapi import APIRouter, HTTPException

from app.services.storage import load_report

router = APIRouter()

VALID_REPORTS = {"metadata", "trial_balance", "balance_sheet", "pl", "metrics", "findings", "workpapers"}

_ENTITY_PREFIX_RE = re.compile(r"^([A-Z]{3,8})-")


def _get(session_id: str, report_name: str):
    data = load_report(session_id, report_name)
    if data is None:
        raise HTTPException(404, f"Report '{report_name}' not found for session {session_id}")
    return data


@router.get("/reports/{session_id}/metadata")
def get_metadata(session_id: str):
    return _get(session_id, "metadata")


@router.get("/reports/{session_id}/trial-balance")
def get_trial_balance(session_id: str):
    return _get(session_id, "trial_balance")


@router.get("/reports/{session_id}/balance-sheet")
def get_balance_sheet(session_id: str):
    return _get(session_id, "balance_sheet")


@router.get("/reports/{session_id}/pl")
def get_pl(session_id: str):
    return _get(session_id, "pl")


@router.get("/reports/{session_id}/metrics")
def get_metrics(session_id: str):
    return _get(session_id, "metrics")


@router.get("/reports/{session_id}/findings")
def get_findings(session_id: str):
    return _get(session_id, "findings")


@router.get("/reports/{session_id}/workpapers")
def get_workpapers(session_id: str):
    return _get(session_id, "workpapers")


@router.get("/reports/{session_id}/account-entries/{account_no}")
def get_account_entries(session_id: str, account_no: str):
    je_data = load_report(session_id, "je")
    if je_data is None:
        raise HTTPException(404, f"Journal entry data not found for session {session_id}")

    entries = [row for row in je_data if str(row.get("Account_No", "")) == account_no]

    result = []
    for entry in entries:
        row = {
            k: (None if isinstance(v, float) and math.isnan(v) else v)
            for k, v in entry.items()
        }
        je_id = str(row.get("JE_ID", "") or "")
        m = _ENTITY_PREFIX_RE.match(je_id)
        row["entity"] = m.group(1) if m else None
        result.append(row)

    result.sort(key=lambda r: (r.get("Document_Date", "") or "", r.get("JE_ID", "") or ""))

    total_debit = sum(float(r.get("Debit_IDR", 0) or 0) for r in result)
    total_credit = sum(float(r.get("Credit_IDR", 0) or 0) for r in result)

    return {
        "account_no": account_no,
        "entries": result,
        "total_debit": total_debit,
        "total_credit": total_credit,
    }
