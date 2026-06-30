from io import BytesIO
from typing import Any, Dict, List, Tuple

import pandas as pd

from app.services.parser import parse_excel

SUSPENSE_ACCOUNT = {
    "Account_No": "99999",
    "Account_Name": "Unallocated / Suspense",
    "Account_Type": "Liability",
    "Account_Group": "Current Liability",
    "Normal_Balance": "Credit",
    "Report": "Balance Sheet",
}


def consolidate(
    entity_files: List[Tuple[str, bytes]],  # [(entity_code, file_bytes), ...]  first = parent
    mapping_bytes: bytes,
) -> Dict[str, Any]:
    """
    Merge multiple entity Excel files into a single consolidated raw dict.

    entity_files: list of (entity_code, file_bytes); first element is the parent (no remapping).
    mapping_bytes: Excel file with sheet COA_Mapping and columns
                   Entity_Code, Sub_Account_No, Parent_Account_No.

    Returns: {"coa": [...], "je": [...]} — same shape as parse_excel() output.
    """
    mapping = _load_mapping(mapping_bytes)

    parent_code, parent_bytes = entity_files[0]
    parent_raw = parse_excel(parent_bytes)
    parent_coa = {str(row["Account_No"]): row for row in parent_raw["coa"]}

    all_je: List[Dict] = []
    suspense_needed = False

    # Parent JEs — kept as-is, prefix JE_IDs
    for row in parent_raw["je"]:
        r = dict(row)
        r["JE_ID"] = f"{parent_code}-{r['JE_ID']}" if r.get("JE_ID") else r.get("JE_ID")
        r["Original_Account_No"] = r.get("Account_No")
        r["Original_Account_Name"] = r.get("Account_Name")
        all_je.append(r)

    # Subsidiary JEs — remap accounts
    for entity_code, file_bytes in entity_files[1:]:
        sub_raw = parse_excel(file_bytes)
        for row in sub_raw["je"]:
            r = dict(row)
            sub_acct = str(r.get("Account_No", ""))
            sub_name = r.get("Account_Name")
            parent_acct = mapping.get((entity_code, sub_acct))

            r["Original_Account_No"] = sub_acct
            r["Original_Account_Name"] = sub_name

            if parent_acct and parent_acct in parent_coa:
                r["Account_No"] = parent_acct
                r["Account_Name"] = parent_coa[parent_acct]["Account_Name"]
            else:
                # Unmapped — route to suspense
                r["Account_No"] = SUSPENSE_ACCOUNT["Account_No"]
                r["Account_Name"] = SUSPENSE_ACCOUNT["Account_Name"]
                suspense_needed = True

            r["JE_ID"] = f"{entity_code}-{r['JE_ID']}" if r.get("JE_ID") else r.get("JE_ID")
            all_je.append(r)

    # Build consolidated COA from parent + suspense if needed
    consolidated_coa = list(parent_raw["coa"])
    if suspense_needed:
        existing_nos = {str(row["Account_No"]) for row in consolidated_coa}
        if SUSPENSE_ACCOUNT["Account_No"] not in existing_nos:
            consolidated_coa.append(dict(SUSPENSE_ACCOUNT))

    return {"coa": consolidated_coa, "je": all_je}


def _load_mapping(mapping_bytes: bytes) -> Dict[Tuple[str, str], str]:
    """
    Returns {(entity_code, sub_account_no_str): parent_account_no_str}
    """
    xf = pd.ExcelFile(BytesIO(mapping_bytes))
    df = pd.read_excel(xf, sheet_name="COA_Mapping", dtype=str)
    df.columns = df.columns.str.strip()

    result: Dict[Tuple[str, str], str] = {}
    for _, row in df.iterrows():
        entity = str(row.get("Entity_Code", "")).strip()
        sub_no = str(row.get("Sub_Account_No", "")).strip()
        parent_no = str(row.get("Parent_Account_No", "")).strip()
        if entity and sub_no and parent_no and parent_no.lower() not in ("nan", "", "none"):
            result[(entity, sub_no)] = parent_no
    return result
