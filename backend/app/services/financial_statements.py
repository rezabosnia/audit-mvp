from typing import Any, Dict, List

import pandas as pd


def compute_all(raw: Dict) -> Dict:
    coa_df = pd.DataFrame(raw["coa"])
    je_df = pd.DataFrame(raw["je"])

    balances = _compute_balances(coa_df, je_df)
    pl = _pl(balances)
    balance_sheet = _balance_sheet(balances, net_income=pl["net_income"])
    trial_balance = _trial_balance(balances)
    metrics = _metrics(balance_sheet, pl, len(raw["je"]), len(raw["coa"]))

    return {
        "trial_balance": trial_balance,
        "balance_sheet": balance_sheet,
        "pl": pl,
        "metrics": metrics,
    }


def _compute_balances(coa_df: pd.DataFrame, je_df: pd.DataFrame) -> pd.DataFrame:
    grouped = (
        je_df.groupby("Account_No")
        .agg(debit_total=("Debit_IDR", "sum"), credit_total=("Credit_IDR", "sum"))
        .reset_index()
    )
    merged = coa_df.merge(grouped, on="Account_No", how="left")
    merged["debit_total"] = merged["debit_total"].fillna(0)
    merged["credit_total"] = merged["credit_total"].fillna(0)
    merged["net_balance"] = merged["debit_total"] - merged["credit_total"]
    return merged


def _signed_balance(row: Any) -> float:
    """Signed balance from the account's own perspective (positive = natural balance)."""
    net = row["net_balance"]
    if row["Account_Type"] in ("Asset", "Expense"):
        return float(net)
    if row["Account_Type"] == "Contra Asset":
        return float(-net)
    return float(-net)  # Liability, Equity, Revenue


def _section(df: pd.DataFrame, account_types: List[str], group: str) -> List[Dict]:
    sub = df[(df["Account_Type"].isin(account_types)) & (df["Account_Group"] == group)]
    return [
        {
            "account_no": str(r["Account_No"]),
            "account_name": str(r["Account_Name"]),
            "balance": round(float(r["balance"]), 0),
        }
        for _, r in sub.iterrows()
    ]


def _trial_balance(balances: pd.DataFrame) -> Dict:
    rows = []
    for _, r in balances.iterrows():
        net = float(r["net_balance"])
        rows.append(
            {
                "account_no": str(r["Account_No"]),
                "account_name": str(r["Account_Name"]),
                "account_type": str(r["Account_Type"]),
                "account_group": str(r["Account_Group"]),
                "normal_balance": str(r["Normal_Balance"]),
                "debit_total": round(float(r["debit_total"]), 0),
                "credit_total": round(float(r["credit_total"]), 0),
                "debit_balance": round(max(net, 0), 0),
                "credit_balance": round(max(-net, 0), 0),
            }
        )
    return {
        "accounts": rows,
        "total_debit": round(sum(r["debit_balance"] for r in rows), 0),
        "total_credit": round(sum(r["credit_balance"] for r in rows), 0),
    }


def _balance_sheet(balances: pd.DataFrame, net_income: float) -> Dict:
    bs = balances[balances["Report"] == "Balance Sheet"].copy()
    bs["balance"] = bs.apply(_signed_balance, axis=1)

    current_assets = _section(bs, ["Asset"], "Current Asset")
    total_current_assets = sum(a["balance"] for a in current_assets)

    noncurrent_assets = _section(bs, ["Asset"], "Non-current Asset")
    total_noncurrent_assets = sum(a["balance"] for a in noncurrent_assets)

    ppe_gross = _section(bs, ["Asset"], "Property, Plant & Equipment")
    ppe_gross_total = sum(a["balance"] for a in ppe_gross)
    accum_dep = _section(bs, ["Contra Asset"], "Property, Plant & Equipment")
    accum_dep_total = sum(a["balance"] for a in accum_dep)
    net_ppe = ppe_gross_total - accum_dep_total

    total_assets = total_current_assets + total_noncurrent_assets + net_ppe

    current_liabilities = _section(bs, ["Liability"], "Current Liability")
    total_current_liabilities = sum(a["balance"] for a in current_liabilities)
    noncurrent_liabilities = _section(bs, ["Liability"], "Non-current Liability")
    total_noncurrent_liabilities = sum(a["balance"] for a in noncurrent_liabilities)
    total_liabilities = total_current_liabilities + total_noncurrent_liabilities

    equity_items = _section(bs, ["Equity"], "Equity")
    total_equity_opening = sum(a["balance"] for a in equity_items)
    total_equity = total_equity_opening + net_income

    return {
        "assets": {
            "current_assets": current_assets,
            "total_current_assets": total_current_assets,
            "noncurrent_assets": noncurrent_assets,
            "total_noncurrent_assets": total_noncurrent_assets,
            "ppe_gross": ppe_gross,
            "ppe_gross_total": ppe_gross_total,
            "accumulated_depreciation": accum_dep,
            "accumulated_depreciation_total": accum_dep_total,
            "net_ppe": net_ppe,
            "total_assets": total_assets,
        },
        "liabilities": {
            "current_liabilities": current_liabilities,
            "total_current_liabilities": total_current_liabilities,
            "noncurrent_liabilities": noncurrent_liabilities,
            "total_noncurrent_liabilities": total_noncurrent_liabilities,
            "total_liabilities": total_liabilities,
        },
        "equity": {
            "items": equity_items,
            "total_equity_opening": total_equity_opening,
            "net_income": net_income,
            "total_equity": total_equity,
        },
        "total_liabilities_and_equity": total_liabilities + total_equity,
    }


def _pl(balances: pd.DataFrame) -> Dict:
    pl_df = balances[balances["Report"] == "Income Statement"].copy()
    pl_df["balance"] = pl_df.apply(_signed_balance, axis=1)

    operating_revenue = _section(pl_df, ["Revenue"], "Operating Revenue")
    other_income = _section(pl_df, ["Revenue"], "Other Income")
    total_operating_revenue = sum(a["balance"] for a in operating_revenue)
    total_other_income = sum(a["balance"] for a in other_income)
    total_revenue = total_operating_revenue + total_other_income

    operating_expenses = _section(pl_df, ["Expense"], "Operating Expense")
    finance_costs = _section(pl_df, ["Expense"], "Finance Cost")
    other_expenses = _section(pl_df, ["Expense"], "Other Expense")
    total_operating_expenses = sum(a["balance"] for a in operating_expenses)
    total_finance_costs = sum(a["balance"] for a in finance_costs)
    total_other_expenses = sum(a["balance"] for a in other_expenses)
    total_expenses = total_operating_expenses + total_finance_costs + total_other_expenses

    net_income = total_revenue - total_expenses

    return {
        "revenue": {
            "operating_revenue": operating_revenue,
            "total_operating_revenue": total_operating_revenue,
            "other_income": other_income,
            "total_other_income": total_other_income,
            "total_revenue": total_revenue,
        },
        "expenses": {
            "operating_expenses": operating_expenses,
            "total_operating_expenses": total_operating_expenses,
            "finance_costs": finance_costs,
            "total_finance_costs": total_finance_costs,
            "other_expenses": other_expenses,
            "total_other_expenses": total_other_expenses,
            "total_expenses": total_expenses,
        },
        "net_income": net_income,
    }


def _metrics(
    balance_sheet: Dict, pl: Dict, je_count: int, account_count: int
) -> Dict:
    total_assets = balance_sheet["assets"]["total_assets"]
    total_liabilities = balance_sheet["liabilities"]["total_liabilities"]
    total_equity = balance_sheet["equity"]["total_equity"]
    total_revenue = pl["revenue"]["total_revenue"]
    net_income = pl["net_income"]
    current_assets = balance_sheet["assets"]["total_current_assets"]
    current_liabilities = balance_sheet["liabilities"]["total_current_liabilities"]

    current_ratio = (current_assets / current_liabilities) if current_liabilities else None
    debt_to_equity = (total_liabilities / total_equity) if total_equity else None
    net_profit_margin = (net_income / total_revenue * 100) if total_revenue else None

    return {
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "total_equity": total_equity,
        "revenue": total_revenue,
        "net_income": net_income,
        "current_ratio": round(current_ratio, 2) if current_ratio is not None else None,
        "debt_to_equity": round(debt_to_equity, 2) if debt_to_equity is not None else None,
        "net_profit_margin": round(net_profit_margin, 2) if net_profit_margin is not None else None,
        "je_count": je_count,
        "account_count": account_count,
        "findings_count": None,  # filled in by upload.py after findings are computed
        "high_risk_count": None,
    }
