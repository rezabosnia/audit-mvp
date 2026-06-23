const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UploadResponse {
  session_id: string;
  filename: string;
}

export interface Metadata {
  session_id: string;
  filename: string;
  je_count: number;
  account_count: number;
  status: string;
}

export interface Metrics {
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  revenue: number;
  net_income: number;
  current_ratio: number | null;
  debt_to_equity: number | null;
  net_profit_margin: number | null;
  je_count: number;
  account_count: number;
  findings_count: number;
  high_risk_count: number;
}

export interface TrialBalanceAccount {
  account_no: string;
  account_name: string;
  account_type: string;
  account_group: string;
  normal_balance: string;
  debit_total: number;
  credit_total: number;
  debit_balance: number;
  credit_balance: number;
}

export interface TrialBalance {
  accounts: TrialBalanceAccount[];
  total_debit: number;
  total_credit: number;
}

export interface AccountLine {
  account_no: string;
  account_name: string;
  balance: number;
}

export interface BalanceSheet {
  assets: {
    current_assets: AccountLine[];
    total_current_assets: number;
    noncurrent_assets: AccountLine[];
    total_noncurrent_assets: number;
    ppe_gross: AccountLine[];
    ppe_gross_total: number;
    accumulated_depreciation: AccountLine[];
    accumulated_depreciation_total: number;
    net_ppe: number;
    total_assets: number;
  };
  liabilities: {
    current_liabilities: AccountLine[];
    total_current_liabilities: number;
    noncurrent_liabilities: AccountLine[];
    total_noncurrent_liabilities: number;
    total_liabilities: number;
  };
  equity: {
    items: AccountLine[];
    total_equity_opening: number;
    net_income: number;
    total_equity: number;
  };
  total_liabilities_and_equity: number;
}

export interface PL {
  revenue: {
    operating_revenue: AccountLine[];
    total_operating_revenue: number;
    other_income: AccountLine[];
    total_other_income: number;
    total_revenue: number;
  };
  expenses: {
    operating_expenses: AccountLine[];
    total_operating_expenses: number;
    finance_costs: AccountLine[];
    total_finance_costs: number;
    other_expenses: AccountLine[];
    total_other_expenses: number;
    total_expenses: number;
  };
  net_income: number;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail: string }).detail ?? "Upload failed");
  }
  return res.json() as Promise<UploadResponse>;
}

export const getMetadata = (id: string) =>
  fetchJSON<Metadata>(`${API_BASE}/reports/${id}/metadata`);

export const getMetrics = (id: string) =>
  fetchJSON<Metrics>(`${API_BASE}/reports/${id}/metrics`);

export const getTrialBalance = (id: string) =>
  fetchJSON<TrialBalance>(`${API_BASE}/reports/${id}/trial-balance`);

export const getBalanceSheet = (id: string) =>
  fetchJSON<BalanceSheet>(`${API_BASE}/reports/${id}/balance-sheet`);

export const getPL = (id: string) =>
  fetchJSON<PL>(`${API_BASE}/reports/${id}/pl`);

export interface Finding {
  finding_id: string;
  rule_name: string;
  risk_level: "High" | "Medium" | "Low";
  je_id: string;
  date: string;
  account_no: string;
  account_name: string;
  amount: number;
  description: string;
  reason_flagged: string;
  financial_statement_impact: string;
  recommended_audit_query: string;
}

export interface FindingsReport {
  findings: Finding[];
  total: number;
  high: number;
  medium: number;
  low: number;
}

export const getFindings = (id: string) =>
  fetchJSON<FindingsReport>(`${API_BASE}/reports/${id}/findings`);

export interface KeyBalance {
  account_no: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  net_balance: number;
}

export interface Workpaper {
  workpaper_id: string;
  audit_area: string;
  objective: string;
  scope: string;
  procedures_performed: string[];
  key_balances: KeyBalance[];
  findings: Finding[];
  highlighted_je_ids: string[];
  risk_rating: "High" | "Medium" | "Low" | "No Issues";
  financial_statement_impact: string;
  recommended_audit_query: string;
  conclusion: string;
}

export interface WorkpapersReport {
  workpapers: Workpaper[];
  total: number;
}

export const getWorkpapers = (id: string) =>
  fetchJSON<WorkpapersReport>(`${API_BASE}/reports/${id}/workpapers`);
