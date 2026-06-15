import { formatIDR } from "@/lib/format";
import type { PL, AccountLine } from "@/lib/api";

export function PLTable({ data }: { data: PL }) {
  return (
    <div className="font-sans text-sm max-w-2xl">
      {/* REVENUE */}
      <SectionHeader>REVENUE</SectionHeader>

      <SubSection label="Operating Revenue">
        {data.revenue.operating_revenue.map((a) => (
          <AccountRow key={a.account_no} account={a} />
        ))}
        <SubtotalRow label="Total Operating Revenue" value={data.revenue.total_operating_revenue} />
      </SubSection>

      {data.revenue.other_income.length > 0 && (
        <SubSection label="Other Income">
          {data.revenue.other_income.map((a) => (
            <AccountRow key={a.account_no} account={a} />
          ))}
          <SubtotalRow label="Total Other Income" value={data.revenue.total_other_income} />
        </SubSection>
      )}

      <TotalRow label="TOTAL REVENUE" value={data.revenue.total_revenue} />

      {/* EXPENSES */}
      <div className="mt-6">
        <SectionHeader>EXPENSES</SectionHeader>

        <SubSection label="Operating Expenses">
          {data.expenses.operating_expenses.map((a) => (
            <AccountRow key={a.account_no} account={a} />
          ))}
          <SubtotalRow label="Total Operating Expenses" value={data.expenses.total_operating_expenses} />
        </SubSection>

        {data.expenses.finance_costs.length > 0 && (
          <SubSection label="Finance Costs">
            {data.expenses.finance_costs.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            <SubtotalRow label="Total Finance Costs" value={data.expenses.total_finance_costs} />
          </SubSection>
        )}

        {data.expenses.other_expenses.length > 0 && (
          <SubSection label="Other Expenses">
            {data.expenses.other_expenses.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            <SubtotalRow label="Total Other Expenses" value={data.expenses.total_other_expenses} />
          </SubSection>
        )}

        <TotalRow label="TOTAL EXPENSES" value={data.expenses.total_expenses} />
      </div>

      {/* NET INCOME */}
      <div className="mt-6">
        <div className={`flex items-center justify-between px-4 py-3 border-2 rounded-lg ${data.net_income >= 0 ? "border-emerald-400 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
          <span className={`font-bold text-base uppercase tracking-wide ${data.net_income >= 0 ? "text-emerald-800" : "text-red-700"}`}>
            NET INCOME
          </span>
          <span className={`font-mono font-bold text-base ${data.net_income >= 0 ? "text-emerald-800" : "text-red-700"}`}>
            {data.net_income < 0
              ? `(${formatIDR(-data.net_income)})`
              : formatIDR(data.net_income)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 mb-3 rounded">
      {children}
    </div>
  );
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-1">{label}</p>
      {children}
    </div>
  );
}

function AccountRow({ account }: { account: AccountLine }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-sm">
      <span className="text-slate-600">{account.account_name}</span>
      <span className="font-mono tabular-nums text-slate-800">{formatIDR(account.balance)}</span>
    </div>
  );
}

function SubtotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-200">
      <span className="text-sm italic text-slate-600">{label}</span>
      <span className="font-mono tabular-nums text-sm text-slate-700">{formatIDR(value)}</span>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-t-2 border-b-2 border-slate-800 bg-slate-100 mt-1">
      <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">{label}</span>
      <span className="font-mono tabular-nums font-bold text-slate-900">{formatIDR(value)}</span>
    </div>
  );
}
