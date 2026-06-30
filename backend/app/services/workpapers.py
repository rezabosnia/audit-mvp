from typing import Any, Dict, List

import pandas as pd

# Rules that are cross-cutting (JE controls) — assigned to WP-006
_CROSS_CUTTING = {
    "Unbalanced Journal Entry",
    "Duplicate Transaction",
    "Same Preparer and Approver",
    "Year-End Manual Adjustment",
    "Late-Night Posting",
    "Weekend Posting",
    "Large Round-Number Transaction",
}

_WP_CONFIGS = [
    {
        "workpaper_id": "WP-001",
        "audit_area": "Cash & Current Assets",
        "account_types": ["Asset"],
        "account_groups": ["Current Asset"],
        "objective": (
            "Verify that current asset balances are accurately stated, properly authorized, "
            "and supported by valid journal entries."
        ),
        "scope": (
            "All journal entries posted to current asset accounts — including cash, accounts receivable, "
            "prepayments, and other short-term assets — during the audit period."
        ),
        "procedures_performed": [
            "Recalculated trial balance totals for all current asset accounts.",
            "Identified and reviewed all journal entries posted to current asset accounts.",
            "Applied automated testing for dormant accounts with no journal activity.",
            "Assessed completeness of cash and receivable balances against the trial balance.",
        ],
        "fs_impact_no_findings": (
            "Current asset balances appear accurately stated. No exceptions noted that would affect "
            "the reported total assets on the balance sheet."
        ),
        "recommended_query_no_findings": (
            "No additional procedures required for current assets at this stage. "
            "Continue with standard confirmation procedures for significant receivable balances."
        ),
    },
    {
        "workpaper_id": "WP-002",
        "audit_area": "Fixed Assets & Depreciation",
        "account_types": ["Asset", "Contra Asset"],
        "account_groups": ["Non-current Asset", "Property, Plant & Equipment"],
        "objective": (
            "Verify the completeness and accuracy of fixed asset additions, disposals, "
            "and accumulated depreciation charges."
        ),
        "scope": (
            "All journal entries posted to non-current asset, property, plant & equipment, "
            "and accumulated depreciation accounts during the audit period."
        ),
        "procedures_performed": [
            "Recalculated net book value for all fixed asset and accumulated depreciation accounts.",
            "Reviewed journal entries to PPE and contra asset accounts for unusual postings.",
            "Applied automated testing for unsupported or round-number postings to fixed asset accounts.",
            "Assessed whether depreciation charges appear consistent with the fixed asset base.",
        ],
        "fs_impact_no_findings": (
            "Fixed asset and depreciation balances appear accurately stated. Net book value reconciles "
            "to the balance sheet without exception."
        ),
        "recommended_query_no_findings": (
            "No additional procedures required for fixed assets at this stage. "
            "Consider obtaining the fixed asset register to verify additions and disposals."
        ),
    },
    {
        "workpaper_id": "WP-003",
        "audit_area": "Liabilities & Payables",
        "account_types": ["Liability"],
        "account_groups": ["Current Liability", "Non-current Liability"],
        "objective": (
            "Confirm that all liabilities are completely and accurately recorded "
            "as of the balance sheet date."
        ),
        "scope": (
            "All journal entries posted to current and non-current liability accounts, "
            "including trade payables, accruals, loans, and other obligations."
        ),
        "procedures_performed": [
            "Recalculated trial balance totals for all liability accounts.",
            "Identified all journal entries posted to liability accounts during the period.",
            "Reviewed for completeness of year-end accruals and payable balances.",
            "Applied automated testing for dormant or unused liability accounts.",
        ],
        "fs_impact_no_findings": (
            "Liability balances appear completely and accurately recorded. No understatement risk "
            "identified from the journal entry review."
        ),
        "recommended_query_no_findings": (
            "No additional procedures required for liabilities at this stage. "
            "Perform standard creditor confirmation for material payable balances."
        ),
    },
    {
        "workpaper_id": "WP-004",
        "audit_area": "Revenue Recognition",
        "account_types": ["Revenue"],
        "account_groups": ["Operating Revenue", "Other Income"],
        "objective": (
            "Assess whether revenue is recognized completely, accurately, and in accordance with "
            "applicable accounting standards and the company's revenue recognition policy."
        ),
        "scope": (
            "All journal entries posted to operating revenue and other income accounts, "
            "with particular focus on reversals, credit notes, and unusual adjustments."
        ),
        "procedures_performed": [
            "Recalculated total revenue per account from the trial balance.",
            "Identified and reviewed all debit postings to revenue accounts (potential reversals).",
            "Performed monthly trend analysis to identify unusual revenue patterns.",
            "Applied automated testing for negative revenue postings and round-number entries.",
        ],
        "fs_impact_no_findings": (
            "Revenue balances appear accurately stated with no unusual reversals or adjustments detected. "
            "No impact on reported top-line results identified."
        ),
        "recommended_query_no_findings": (
            "No additional procedures required for revenue at this stage. "
            "Perform standard cut-off testing around period end."
        ),
    },
    {
        "workpaper_id": "WP-005",
        "audit_area": "Operating Expenses",
        "account_types": ["Expense"],
        "account_groups": ["Operating Expense", "Finance Cost", "Other Expense"],
        "objective": (
            "Verify that expenses are completely and accurately recorded in the correct period "
            "and adequately supported by documentation."
        ),
        "scope": (
            "All journal entries posted to operating expense, finance cost, and other expense accounts, "
            "with focus on unusual spikes, period-end accruals, and dormant accounts."
        ),
        "procedures_performed": [
            "Recalculated total expenses per account from the trial balance.",
            "Performed monthly analytical procedures to identify unusual expense spikes (>200% of monthly average).",
            "Reviewed expense accounts for dormant accounts with no activity.",
            "Applied automated testing for round-number and unusual-timing expense postings.",
        ],
        "fs_impact_no_findings": (
            "Expense balances appear accurately stated and recorded in the correct period. "
            "No material misstatement risk identified from the analytical review."
        ),
        "recommended_query_no_findings": (
            "No additional procedures required for operating expenses at this stage. "
            "Perform standard accrual completeness testing at period end."
        ),
    },
    {
        "workpaper_id": "WP-006",
        "audit_area": "Journal Entry Controls",
        "account_types": [],
        "account_groups": [],
        "objective": (
            "Assess the design and operating effectiveness of journal entry controls, including "
            "posting authorization, segregation of duties, and timing of entries."
        ),
        "scope": (
            "All journal entries in the audit period, tested for unbalanced postings, duplicate transactions, "
            "segregation of duties violations, year-end manual adjustments, late-night and weekend activity, "
            "and large round-number entries."
        ),
        "procedures_performed": [
            "Tested all journal entries for arithmetic balance (debit = credit for each JE_ID).",
            "Identified duplicate transactions based on date, account, amount, and counterparty.",
            "Reviewed segregation of duties by comparing preparer and approver for each journal entry.",
            "Flagged manual entries posted on 31 December for elevated scrutiny.",
            "Identified entries posted outside normal business hours (after 22:00).",
            "Identified entries posted on weekends (Saturday or Sunday).",
            "Tested for large round-number entries (≥ IDR 50,000,000 rounded to IDR 10,000,000).",
        ],
        "fs_impact_no_findings": (
            "Journal entry controls appear effective. No control exceptions detected across all tested rules. "
            "This reduces the risk of unauthorized or erroneous postings affecting the financial statements."
        ),
        "recommended_query_no_findings": (
            "No control exceptions noted. Continue with planned substantive procedures. "
            "Consider relying on controls for selected financial statement areas."
        ),
    },
]


def compute_workpapers(raw: Dict, findings_result: Dict) -> Dict:
    coa_df = pd.DataFrame(raw["coa"])
    je_df = pd.DataFrame(raw["je"])
    findings = findings_result["findings"]

    je_grouped = (
        je_df.groupby("Account_No")
        .agg(debit=("Debit_IDR", "sum"), credit=("Credit_IDR", "sum"))
        .reset_index()
    )

    workpapers = [
        _build_workpaper(cfg, coa_df, je_grouped, findings)
        for cfg in _WP_CONFIGS
    ]

    return {"workpapers": workpapers, "total": len(workpapers)}


# ─── Internal builders ─────────────────────────────────────────────────────────

def _build_workpaper(
    cfg: Dict,
    coa_df: pd.DataFrame,
    je_grouped: pd.DataFrame,
    all_findings: List[Dict],
) -> Dict:
    is_controls = cfg["workpaper_id"] == "WP-006"

    # Accounts in scope for this area
    if is_controls:
        area_accounts: set = set()
    else:
        mask = coa_df["Account_Type"].isin(cfg["account_types"]) & \
               coa_df["Account_Group"].isin(cfg["account_groups"])
        area_accounts = set(coa_df[mask]["Account_No"].astype(str).tolist())

    # Filter findings
    if is_controls:
        wp_findings = [f for f in all_findings if f["rule_name"] in _CROSS_CUTTING]
    else:
        wp_findings = [
            f for f in all_findings
            if f["account_no"] in area_accounts and f["rule_name"] not in _CROSS_CUTTING
        ]

    # Key balances (account-specific workpapers only)
    key_balances = _key_balances(coa_df, je_grouped, area_accounts) if not is_controls else []

    # Risk rating
    risk_rating = _risk_rating(wp_findings)

    # Highlighted JEs
    highlighted_je_ids = sorted({f["je_id"] for f in wp_findings if f["je_id"]})

    conclusion = _conclusion(cfg["audit_area"], wp_findings, risk_rating)
    fs_impact = _fs_impact(cfg, wp_findings)
    recommended_query = _recommended_query(cfg, wp_findings)

    return {
        "workpaper_id": cfg["workpaper_id"],
        "audit_area": cfg["audit_area"],
        "objective": cfg["objective"],
        "scope": cfg["scope"],
        "procedures_performed": cfg["procedures_performed"],
        "key_balances": key_balances,
        "findings": wp_findings,
        "highlighted_je_ids": highlighted_je_ids,
        "risk_rating": risk_rating,
        "financial_statement_impact": fs_impact,
        "recommended_audit_query": recommended_query,
        "conclusion": conclusion,
    }


def _key_balances(
    coa_df: pd.DataFrame,
    je_grouped: pd.DataFrame,
    area_accounts: set,
) -> List[Dict]:
    rows = []
    subset = coa_df[coa_df["Account_No"].astype(str).isin(area_accounts)]
    for _, row in subset.iterrows():
        acct = str(row["Account_No"])
        match = je_grouped[je_grouped["Account_No"].astype(str) == acct]
        if not match.empty:
            debit = round(float(match.iloc[0]["debit"]), 0)
            credit = round(float(match.iloc[0]["credit"]), 0)
        else:
            debit, credit = 0.0, 0.0
        rows.append({
            "account_no": acct,
            "account_name": str(row["Account_Name"]),
            "account_type": str(row["Account_Type"]),
            "debit": debit,
            "credit": credit,
            "net_balance": round(debit - credit, 0),
        })
    return sorted(rows, key=lambda x: x["account_no"])


def _risk_rating(findings: List[Dict]) -> str:
    if any(f["risk_level"] == "High" for f in findings):
        return "High"
    if any(f["risk_level"] == "Medium" for f in findings):
        return "Medium"
    if any(f["risk_level"] == "Low" for f in findings):
        return "Low"
    return "No Issues"


def _conclusion(area: str, findings: List[Dict], risk_rating: str) -> str:
    n = len(findings)
    high = sum(1 for f in findings if f["risk_level"] == "High")
    medium = sum(1 for f in findings if f["risk_level"] == "Medium")

    if n == 0:
        return (
            f"No exceptions were noted in the {area} area. Automated testing found no anomalies "
            f"in the journal entries reviewed. The balances appear accurately stated and adequately controlled. "
            f"No further procedures are required at this stage based on automated analysis."
        )
    if risk_rating == "High":
        return (
            f"Based on procedures performed, {n} finding(s) were identified in the {area} area, "
            f"including {high} high-risk item(s) requiring immediate attention. "
            f"The identified exceptions indicate control weaknesses that may have a material impact on the financial statements. "
            f"Management should be notified and additional substantive procedures are recommended before the audit opinion is finalized."
        )
    if risk_rating == "Medium":
        return (
            f"Based on procedures performed, {n} finding(s) were identified in the {area} area, "
            f"including {medium} medium-risk item(s). "
            f"No high-risk exceptions were noted; however, the findings indicate areas where controls could be strengthened. "
            f"Management should review the flagged items and provide explanations. Targeted additional testing is recommended."
        )
    return (
        f"Based on procedures performed, {n} low-risk finding(s) were identified in the {area} area. "
        f"No material exceptions were noted. The findings are informational and primarily relate to chart of accounts maintenance. "
        f"The auditor should note these items and follow up with management as part of the closing procedures."
    )


def _fs_impact(cfg: Dict, findings: List[Dict]) -> str:
    if not findings:
        return cfg["fs_impact_no_findings"]
    area = cfg["audit_area"]
    high = sum(1 for f in findings if f["risk_level"] == "High")
    medium = sum(1 for f in findings if f["risk_level"] == "Medium")
    if high > 0:
        return (
            f"{high} high-risk finding(s) in {area} may have a material impact on the financial statements. "
            f"Affected accounts should be investigated and any required adjustments recorded before the financial statements are finalized."
        )
    if medium > 0:
        return (
            f"{medium} medium-risk finding(s) in {area} may affect reported balances. "
            f"While not necessarily material individually, these items should be assessed in aggregate and management explanations obtained."
        )
    return (
        f"Low-risk findings in {area} are unlikely to have a material impact on the financial statements. "
        f"These items should be noted in the audit file and communicated to management for remediation."
    )


def _recommended_query(cfg: Dict, findings: List[Dict]) -> str:
    if not findings:
        return cfg["recommended_query_no_findings"]
    area = cfg["audit_area"]
    rules = sorted({f["rule_name"] for f in findings})
    rule_list = "; ".join(rules)
    je_ids = sorted({f["je_id"] for f in findings if f["je_id"]})
    je_sample = ", ".join(je_ids[:5]) + ("..." if len(je_ids) > 5 else "")
    return (
        f"For the {area} area, obtain supporting documentation for the following flagged items: {rule_list}. "
        + (f"Key journal entries to review: {je_sample}. " if je_sample else "")
        + "Inquire with management about the business rationale for each flagged item and assess whether "
        "correcting entries or additional disclosures are required."
    )
