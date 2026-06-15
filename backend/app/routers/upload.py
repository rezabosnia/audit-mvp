import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.financial_statements import compute_all
from app.services.parser import parse_excel
from app.services.storage import save_session

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Only Excel files (.xlsx, .xls) are supported")

    content = await file.read()

    try:
        raw = parse_excel(content)
    except Exception as e:
        raise HTTPException(422, f"Failed to parse Excel file: {e}")

    try:
        reports = compute_all(raw)
    except Exception as e:
        raise HTTPException(500, f"Failed to compute financial statements: {e}")

    session_id = str(uuid.uuid4())
    reports["metadata"] = {
        "session_id": session_id,
        "filename": file.filename,
        "je_count": len(raw["je"]),
        "account_count": len(raw["coa"]),
        "status": "processed",
    }

    save_session(session_id, reports)

    return {"session_id": session_id, "filename": file.filename}
