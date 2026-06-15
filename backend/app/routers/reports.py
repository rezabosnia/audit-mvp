from fastapi import APIRouter, HTTPException

from app.services.storage import load_report

router = APIRouter()

VALID_REPORTS = {"metadata", "trial_balance", "balance_sheet", "pl", "metrics", "findings"}


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
