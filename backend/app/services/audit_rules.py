from typing import Any, Dict, List

import pandas as pd


def compute_findings(raw: Dict) -> Dict:
    coa_df = pd.DataFrame(raw["coa"])
    je_df = pd.DataFrame(raw["je"]).copy()

    je_df["_doc_date"] = pd.to_datetime(je_df["Document_Date"], errors="coerce")
    je_df["_posting_dt"] = pd.to_datetime(je_df["Posting_DateTime"], errors="coerce")

    findings: List[Dict] = []
    findings += _rule1_unbalanced_je(je_df, coa_df)
    findings += _rule2_duplicates(je_df, coa_df)
    findings += _rule3_same_preparer_approver(je_df, coa_df)
    findings += _rule4_year_end_manual(je_df, coa_df)
    findings += _rule5_late_night(je_df, coa_df)
    findings += _rule6_weekend(je_df, coa_df)
    findings += _rule7_large_round_number(je_df, coa_df)
    findings += _rule8_revenue_reversal(je_df, coa_df)
    findings += _rule9_unused_accounts(je_df, coa_df)
    findings += _rule10_expense_spike(je_df, coa_df)

    for i, f in enumerate(findings, 1):
        f["finding_id"] = f"F{i:03d}"

    high = sum(1 for f in findings if f["risk_level"] == "High")
    medium = sum(1 for f in findings if f["risk_level"] == "Medium")
    low = sum(1 for f in findings if f["risk_level"] == "Low")

    return {"findings": findings, "total": len(findings), "high": high, "medium": medium, "low": low}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _name(coa_df: pd.DataFrame, account_no: str) -> str:
    m = coa_df[coa_df["Account_No"] == account_no]
    return str(m.iloc[0]["Account_Name"]) if not m.empty else "Unknown"


def _f(
    rule_name: str,
    risk_level: str,
    je_id: Any,
    date: Any,
    account_no: Any,
    account_name: Any,
    amount: float,
    description: str,
    reason_flagged: str,
    financial_statement_impact: str,
    recommended_audit_query: str,
) -> Dict:
    return {
        "rule_name": rule_name,
        "risk_level": risk_level,
        "je_id": str(je_id) if je_id else "",
        "date": str(date) if date else "",
        "account_no": str(account_no) if account_no else "",
        "account_name": str(account_name) if account_name else "",
        "amount": round(float(amount), 0),
        "description": description,
        "reason_flagged": reason_flagged,
        "financial_statement_impact": financial_statement_impact,
        "recommended_audit_query": recommended_audit_query,
    }


# ─── Rule 1: Unbalanced Journal Entry ─────────────────────────────────────────

def _rule1_unbalanced_je(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    grouped = (
        je_df.groupby("JE_ID")
        .agg(
            total_debit=("Debit_IDR", "sum"),
            total_credit=("Credit_IDR", "sum"),
            date=("Document_Date", "first"),
            account_no=("Account_No", "first"),
        )
        .reset_index()
    )
    flagged = grouped[abs(grouped["total_debit"] - grouped["total_credit"]) > 0.01]

    out = []
    for _, row in flagged.iterrows():
        diff = float(row["total_debit"]) - float(row["total_credit"])
        acct = str(row["account_no"])
        out.append(_f(
            "Unbalanced Journal Entry", "High",
            row["JE_ID"], row["date"], acct, _name(coa_df, acct),
            abs(diff),
            f"JE {row['JE_ID']} is unbalanced by IDR {abs(diff):,.0f}",
            f"Total debit ({float(row['total_debit']):,.0f}) ≠ total credit ({float(row['total_credit']):,.0f}). Difference: {diff:,.0f}.",
            "May result in incorrect account balances across the trial balance and financial statements.",
            f"Obtain the original source document for JE {row['JE_ID']}. Verify the posting is complete and all lines are recorded. Determine whether a correcting entry was made and confirm the final posted balance.",
        ))
    return out


# ─── Rule 2: Duplicate Transaction ────────────────────────────────────────────

def _rule2_duplicates(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    dup_cols = [c for c in ["Document_Date", "Account_No", "Debit_IDR", "Credit_IDR", "Counterparty"] if c in je_df.columns]
    duped = je_df[je_df.duplicated(subset=dup_cols, keep=False)].copy()

    out = []
    for _, row in duped.iterrows():
        amt = float(row["Debit_IDR"]) if float(row["Debit_IDR"]) > 0 else float(row["Credit_IDR"])
        acct = str(row["Account_No"])
        counterparty = str(row.get("Counterparty", "N/A"))
        je_id = str(row.get("JE_ID", ""))
        out.append(_f(
            "Duplicate Transaction", "High",
            je_id, row["Document_Date"], acct, _name(coa_df, acct),
            amt,
            f"Duplicate posting of IDR {amt:,.0f} to {acct} — Counterparty: {counterparty}",
            f"Same date, account, amount, and counterparty as one or more other entries. Counterparty: {counterparty}.",
            "If a duplicate payment or accrual, this may overstate expenses, liabilities, or assets on the financial statements.",
            f"Obtain supporting documentation for JE {je_id} and all matching duplicates. Confirm whether both postings represent legitimate transactions or if one requires reversal.",
        ))
    return out


# ─── Rule 3: Same Preparer and Approver ───────────────────────────────────────

def _rule3_same_preparer_approver(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    if "Created_By" not in je_df.columns or "Approved_By" not in je_df.columns:
        return []

    mask = (
        je_df["Created_By"].notna()
        & je_df["Approved_By"].notna()
        & (je_df["Created_By"] != "None")
        & (je_df["Approved_By"] != "None")
        & (je_df["Created_By"] == je_df["Approved_By"])
    )
    flagged = je_df[mask]

    seen: set = set()
    out = []
    for _, row in flagged.iterrows():
        je_id = str(row.get("JE_ID", ""))
        if je_id in seen:
            continue
        seen.add(je_id)
        acct = str(row["Account_No"])
        amt = float(row["Debit_IDR"]) if float(row["Debit_IDR"]) > 0 else float(row["Credit_IDR"])
        user = str(row["Created_By"])
        out.append(_f(
            "Same Preparer and Approver", "High",
            je_id, row["Document_Date"], acct, _name(coa_df, acct),
            amt,
            f"Prepared and approved by the same user: {user}",
            f"JE {je_id} was created and approved by {user}. This bypasses the segregation of duties control.",
            "Increased risk of unauthorized or fictitious journal entries affecting any financial statement line.",
            f"Review all entries created and approved by {user}. Confirm whether a compensating control exists. Obtain management explanation for the segregation of duties override and assess whether similar entries exist in prior periods.",
        ))
    return out


# ─── Rule 4: Year-End Manual Adjustment ───────────────────────────────────────

def _rule4_year_end_manual(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    flagged = je_df[je_df["Document_Date"].str.endswith("-12-31", na=False)]

    seen: set = set()
    out = []
    for _, row in flagged.iterrows():
        je_id = str(row.get("JE_ID", ""))
        if je_id in seen:
            continue
        seen.add(je_id)
        acct = str(row["Account_No"])
        amt = float(row["Debit_IDR"]) if float(row["Debit_IDR"]) > 0 else float(row["Credit_IDR"])
        out.append(_f(
            "Year-End Manual Adjustment", "High",
            je_id, row["Document_Date"], acct, _name(coa_df, acct),
            amt,
            f"Manual entry on 31 December by {row.get('Created_By', 'N/A')}",
            "Entry was posted on 31 December, a high-risk period for management override and earnings management.",
            "Year-end adjustments directly affect reported financial position and results. Unsupported entries may misstate key financial statement lines.",
            f"Obtain supporting documentation for JE {je_id}. Verify the business purpose and whether appropriate authorization was obtained. Assess for management bias and compare with year-end adjustments in prior periods.",
        ))
    return out


# ─── Rule 5: Late-Night Posting ───────────────────────────────────────────────

def _rule5_late_night(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    flagged = je_df[je_df["_posting_dt"].dt.hour >= 22]

    out = []
    for _, row in flagged.iterrows():
        acct = str(row["Account_No"])
        amt = float(row["Debit_IDR"]) if float(row["Debit_IDR"]) > 0 else float(row["Credit_IDR"])
        posting_str = str(row.get("Posting_DateTime", ""))
        time_str = posting_str[11:16] if len(posting_str) > 16 else posting_str
        user = str(row.get("Created_By", "N/A"))
        je_id = str(row.get("JE_ID", ""))
        out.append(_f(
            "Late-Night Posting", "Medium",
            je_id, row["Document_Date"], acct, _name(coa_df, acct),
            amt,
            f"Posted at {time_str} by {user}",
            f"Entry posted at {time_str}, outside normal business hours (after 22:00).",
            "Unusual posting times may indicate unauthorized access or processing outside normal system controls.",
            f"Confirm that {user} had legitimate business reasons for posting at {time_str}. Review system access logs for JE {je_id}. Obtain supporting documentation and assess whether similar after-hours postings form a pattern.",
        ))
    return out


# ─── Rule 6: Weekend Posting ──────────────────────────────────────────────────

def _rule6_weekend(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    flagged = je_df[je_df["_posting_dt"].dt.weekday >= 5]

    out = []
    for _, row in flagged.iterrows():
        acct = str(row["Account_No"])
        amt = float(row["Debit_IDR"]) if float(row["Debit_IDR"]) > 0 else float(row["Credit_IDR"])
        dt = row["_posting_dt"]
        day_name = dt.strftime("%A") if pd.notna(dt) else "weekend day"
        user = str(row.get("Created_By", "N/A"))
        je_id = str(row.get("JE_ID", ""))
        out.append(_f(
            "Weekend Posting", "Medium",
            je_id, row["Document_Date"], acct, _name(coa_df, acct),
            amt,
            f"Posted on {day_name} by {user}",
            f"Entry was posted on a {day_name}, outside normal business days.",
            "Weekend postings may indicate manual processing outside standard approval workflows.",
            f"Confirm the business necessity for this {day_name} posting by {user}. Verify appropriate authorization was obtained. Review whether weekend postings are a recurring pattern for this user.",
        ))
    return out


# ─── Rule 7: Large Round-Number Transaction ────────────────────────────────────

def _rule7_large_round_number(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    THRESHOLD = 50_000_000.0
    DIVISOR = 10_000_000.0

    out = []
    for _, row in je_df.iterrows():
        acct = str(row["Account_No"])
        je_id = str(row.get("JE_ID", ""))
        for col, label in [("Debit_IDR", "Debit"), ("Credit_IDR", "Credit")]:
            amt = float(row[col])
            if amt >= THRESHOLD and (amt % DIVISOR) < 0.01:
                out.append(_f(
                    "Large Round-Number Transaction", "Medium",
                    je_id, row["Document_Date"], acct, _name(coa_df, acct),
                    amt,
                    f"{label} of IDR {amt:,.0f} — rounded to nearest IDR 10,000,000",
                    f"Transaction amount of IDR {amt:,.0f} is ≥ IDR 50,000,000 and rounded to the nearest IDR 10,000,000, suggesting an estimate or manual adjustment.",
                    "Large round-number entries may represent unsupported estimates that could affect account balances and reported financial results.",
                    f"Obtain the original source document supporting the round-number amount of IDR {amt:,.0f} in JE {je_id}. Confirm the amount reflects a precise transaction and is not an estimate or plug figure.",
                ))
                break  # Only flag once per row
    return out


# ─── Rule 8: Negative Revenue / Revenue Reversal ──────────────────────────────

def _rule8_revenue_reversal(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    revenue_accts = set(coa_df[coa_df["Account_Type"] == "Revenue"]["Account_No"].tolist())
    flagged = je_df[(je_df["Account_No"].isin(revenue_accts)) & (je_df["Debit_IDR"] > 0)]

    out = []
    for _, row in flagged.iterrows():
        acct = str(row["Account_No"])
        acct_name = _name(coa_df, acct)
        amt = float(row["Debit_IDR"])
        je_id = str(row.get("JE_ID", ""))
        out.append(_f(
            "Negative Revenue / Revenue Reversal", "Medium",
            je_id, row["Document_Date"], acct, acct_name,
            amt,
            f"Debit of IDR {amt:,.0f} to revenue account {acct}",
            f"A debit was posted to revenue account {acct} ({acct_name}), which reduces recognized revenue.",
            "Reduces reported revenue in the Income Statement. May indicate a revenue reversal, credit note, or unusual adjustment affecting top-line results.",
            f"Obtain documentation supporting the debit to revenue account {acct} in JE {je_id}. Confirm whether this is a valid credit note, sales return, or reversal entry. Assess the impact on revenue recognition and whether disclosure is required.",
        ))
    return out


# ─── Rule 9: Unused Account ───────────────────────────────────────────────────

def _rule9_unused_accounts(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    used = set(je_df["Account_No"].dropna().astype(str).unique())

    out = []
    for _, row in coa_df.iterrows():
        acct = str(row["Account_No"])
        if acct not in used:
            acct_name = str(row.get("Account_Name", "Unknown"))
            out.append(_f(
                "Unused Account", "Low",
                "", "", acct, acct_name,
                0.0,
                f"Account {acct} has no journal activity in the period",
                f"Account {acct} ({acct_name}) exists in the Chart of Accounts but has no associated journal entries in the period under review.",
                "Unused accounts may represent outdated or redundant items that could cause confusion. No direct financial statement impact unless they should carry a balance.",
                f"Confirm whether account {acct} is still operationally required. If no longer in use, recommend deactivation or removal from the chart of accounts to maintain a clean and auditable account structure.",
            ))
    return out


# ─── Rule 10: Unusual Expense Spike ───────────────────────────────────────────

def _rule10_expense_spike(je_df: pd.DataFrame, coa_df: pd.DataFrame) -> List[Dict]:
    expense_accts = set(coa_df[coa_df["Account_Type"] == "Expense"]["Account_No"].tolist())
    expense_je = je_df[je_df["Account_No"].isin(expense_accts)].copy()

    if expense_je.empty:
        return []

    expense_je["_month"] = expense_je["_doc_date"].dt.to_period("M")
    expense_je["_amount"] = expense_je["Debit_IDR"] + expense_je["Credit_IDR"]

    monthly = (
        expense_je.groupby(["Account_No", "_month"])["_amount"]
        .sum()
        .reset_index()
    )
    avg = monthly.groupby("Account_No")["_amount"].mean().rename("avg_amount").reset_index()
    monthly = monthly.merge(avg, on="Account_No")

    spikes = monthly[monthly["_amount"] > 2.0 * monthly["avg_amount"]]

    out = []
    for _, row in spikes.iterrows():
        acct = str(row["Account_No"])
        acct_name = _name(coa_df, acct)
        amt = float(row["_amount"])
        avg_amt = float(row["avg_amount"])
        month_str = str(row["_month"])
        ratio = amt / avg_amt if avg_amt > 0 else 0
        out.append(_f(
            "Unusual Expense Spike", "Medium",
            "", month_str, acct, acct_name,
            amt,
            f"{month_str}: IDR {amt:,.0f} ({ratio:.1f}x monthly average of IDR {avg_amt:,.0f})",
            f"Account {acct} posted IDR {amt:,.0f} in {month_str}, which is {ratio:.1f}x the monthly average of IDR {avg_amt:,.0f}.",
            "Unusual expense spikes may overstate operating expenses in the affected period and require additional audit scrutiny.",
            f"Obtain all journal entries for account {acct} in {month_str}. Identify the nature of the spike, obtain supporting documentation, and compare with prior periods. Inquire with management about the business reason for the increase.",
        ))
    return out
