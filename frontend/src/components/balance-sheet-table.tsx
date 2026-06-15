import { formatIDR } from "@/lib/format";
import type { BalanceSheet, AccountLine } from "@/lib/api";

export function BalanceSheetTable({ data }: { data: BalanceSheet }) {
  return (
    <div className="font-sans text-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ASSETS */}
        <div>
          <SectionHeader>ASSETS</SectionHeader>

          <SubSection label="Current Assets">
            {data.assets.current_assets.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            <SubtotalRow label="Total Current Assets" value={data.assets.total_current_assets} />
          </SubSection>

          <SubSection label="Non-Current Assets">
            {data.assets.noncurrent_assets.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            <SubtotalRow label="Total Non-Current Assets" value={data.assets.total_noncurrent_assets} />
          </SubSection>

          <SubSection label="Property, Plant & Equipment">
            {data.assets.ppe_gross.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            {data.assets.accumulated_depreciation.map((a) => (
              <AccountRow key={a.account_no} account={{ ...a, balance: -a.balance }} label="(Accumulated Depreciation)" />
            ))}
            <SubtotalRow label="Net PPE" value={data.assets.net_ppe} />
          </SubSection>

          <TotalRow label="TOTAL ASSETS" value={data.assets.total_assets} />
        </div>

        {/* LIABILITIES & EQUITY */}
        <div>
          <SectionHeader>LIABILITIES &amp; EQUITY</SectionHeader>

          <SubSection label="Current Liabilities">
            {data.liabilities.current_liabilities.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            <SubtotalRow label="Total Current Liabilities" value={data.liabilities.total_current_liabilities} />
          </SubSection>

          <SubSection label="Non-Current Liabilities">
            {data.liabilities.noncurrent_liabilities.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            <SubtotalRow label="Total Non-Current Liabilities" value={data.liabilities.total_noncurrent_liabilities} />
          </SubSection>

          <SubtotalRow label="TOTAL LIABILITIES" value={data.liabilities.total_liabilities} bold />

          <SubSection label="Equity">
            {data.equity.items.map((a) => (
              <AccountRow key={a.account_no} account={a} />
            ))}
            <AccountRow
              account={{ account_no: "net_income", account_name: "Net Income (Current Year)", balance: data.equity.net_income }}
              accent
            />
            <SubtotalRow label="TOTAL EQUITY" value={data.equity.total_equity} bold />
          </SubSection>

          <TotalRow label="TOTAL LIABILITIES & EQUITY" value={data.total_liabilities_and_equity} />

          {/* Balance check */}
          <div className="mt-4 px-3 py-2 rounded border border-slate-200 bg-slate-50 text-xs text-slate-500">
            Balance check:{" "}
            <span className={Math.abs(data.assets.total_assets - data.total_liabilities_and_equity) < 1 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
              {Math.abs(data.assets.total_assets - data.total_liabilities_and_equity) < 1 ? "✓ Balanced" : "✗ Out of balance"}
            </span>
          </div>
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

function AccountRow({
  account,
  label,
  accent,
}: {
  account: AccountLine;
  label?: string;
  accent?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 text-sm ${accent ? "italic" : ""}`}>
      <span className="text-slate-600">{label ?? account.account_name}</span>
      <span className={`font-mono tabular-nums ${account.balance < 0 ? "text-red-600" : "text-slate-800"}`}>
        {account.balance < 0 ? `(${formatIDR(-account.balance)})` : formatIDR(account.balance)}
      </span>
    </div>
  );
}

function SubtotalRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-1.5 border-t border-slate-200 ${bold ? "bg-slate-50" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold text-slate-700" : "text-slate-600 italic"}`}>{label}</span>
      <span className={`font-mono tabular-nums text-sm ${bold ? "font-semibold text-slate-800" : "text-slate-700"}`}>
        {formatIDR(value)}
      </span>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-t-2 border-b-2 border-slate-800 bg-slate-100 mt-2">
      <span className="text-sm font-bold text-slate-800 uppercase tracking-wide">{label}</span>
      <span className="font-mono tabular-nums font-bold text-slate-900">{formatIDR(value)}</span>
    </div>
  );
}
