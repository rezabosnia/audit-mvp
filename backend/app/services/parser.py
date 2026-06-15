from io import BytesIO
from typing import Any, Dict, List

import pandas as pd


def parse_excel(file_bytes: bytes) -> Dict[str, List[Any]]:
    xf = pd.ExcelFile(BytesIO(file_bytes))

    coa = pd.read_excel(xf, sheet_name="Chart_of_Accounts", dtype=str)
    coa.columns = coa.columns.str.strip()
    coa = coa.where(coa.notna(), None)

    je = pd.read_excel(xf, sheet_name="Journal_Entries")
    je.columns = je.columns.str.strip()

    je["Debit_IDR"] = pd.to_numeric(je.get("Debit_IDR", 0), errors="coerce").fillna(0)
    je["Credit_IDR"] = pd.to_numeric(je.get("Credit_IDR", 0), errors="coerce").fillna(0)

    je["Document_Date"] = pd.to_datetime(je["Document_Date"], errors="coerce")
    je["Posting_DateTime"] = pd.to_datetime(je["Posting_DateTime"], errors="coerce")

    je["Document_Date"] = je["Document_Date"].dt.strftime("%Y-%m-%d")
    je["Posting_DateTime"] = je["Posting_DateTime"].dt.strftime("%Y-%m-%dT%H:%M:%S")

    str_cols = [
        "JE_ID", "Account_No", "Account_Name", "Description",
        "Counterparty", "Created_By", "Approved_By", "Entry_Type", "Source_Module",
    ]
    for col in str_cols:
        if col in je.columns:
            je[col] = je[col].astype(str).where(je[col].notna(), None)

    return {
        "coa": coa.to_dict(orient="records"),
        "je": je.to_dict(orient="records"),
    }
