"use client";

import { use, useEffect, useState } from "react";
import { AlertCircle, Search, ChevronRight, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTrialBalance,
  getAccountEntries,
  getMetadata,
  type TrialBalanceAccount,
  type AccountEntries,
  type Metadata,
} from "@/lib/api";
import { formatIDR } from "@/lib/format";

const TYPE_ORDER = ["Asset", "Contra Asset", "Liability", "Equity", "Revenue", "Expense"];

const TYPE_COLOR: Record<string, string> = {
  Asset:         "text-blue-700 bg-blue-50 border-blue-200",
  "Contra Asset":"text-cyan-700 bg-cyan-50 border-cyan-200",
  Liability:     "text-orange-700 bg-orange-50 border-orange-200",
  Equity:        "text-purple-700 bg-purple-50 border-purple-200",
  Revenue:       "text-emerald-700 bg-emerald-50 border-emerald-200",
  Expense:       "text-red-700 bg-red-50 border-red-200",
};

const TYPE_HEADER: Record<string, string> = {
  Asset:         "text-blue-600",
  "Contra Asset":"text-cyan-600",
  Liability:     "text-orange-600",
  Equity:        "text-purple-600",
  Revenue:       "text-emerald-600",
  Expense:       "text-red-600",
};

const ENTITY_COLORS: Record<string, string> = {
  HOLDING: "bg-blue-100 text-blue-700",
  INFRA:   "bg-emerald-100 text-emerald-700",
  DIGIT:   "bg-purple-100 text-purple-700",
};

function entityColor(entity: string): string {
  return ENTITY_COLORS[entity] ?? "bg-slate-100 text-slate-600";
}

export default function AccountsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  const [accounts, setAccounts] = useState<TrialBalanceAccount[] | null>(null);
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [entries, setEntries] = useState<AccountEntries | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const isConsolidated = meta?.status === "consolidated";

  useEffect(() => {
    Promise.all([getTrialBalance(sessionId), getMetadata(sessionId)])
      .then(([tb, m]) => {
        setAccounts(tb.accounts);
        setMeta(m);
        if (tb.accounts.length > 0) setSelected(tb.accounts[0].account_no);
      })
      .catch((e) => setError(e.message));
  }, [sessionId]);

  useEffect(() => {
    if (!selected) return;
    setEntries(null);
    setEntriesLoading(true);
    getAccountEntries(sessionId, selected)
      .then((d) => setEntries(d))
      .catch(() => setEntries(null))
      .finally(() => setEntriesLoading(false));
  }, [sessionId, selected]);

  if (error) {
    return (
      <div className="p-8 flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  const filtered = accounts
    ? accounts.filter(
        (a) =>
          a.account_no.includes(search) ||
          a.account_name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const grouped = TYPE_ORDER.reduce<Record<string, TrialBalanceAccount[]>>(
    (acc, type) => {
      acc[type] = filtered.filter((a) => a.account_type === type);
      return acc;
    },
    {}
  );

  const selectedAccount = accounts?.find((a) => a.account_no === selected) ?? null;

  return (
    <div className="flex h-full min-h-screen">
      {/* Left panel — account list */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">Account Explorer</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {accounts ? `${accounts.length} accounts` : "loading…"}
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts…"
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {!accounts ? (
            <div className="px-3 space-y-2 py-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            TYPE_ORDER.map((type) => {
              const group = grouped[type];
              if (!group || group.length === 0) return null;
              return (
                <div key={type} className="mb-1">
                  <p className={`px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest ${TYPE_HEADER[type] ?? "text-slate-500"}`}>
                    {type}
                  </p>
                  {group.map((acct) => {
                    const isActive = acct.account_no === selected;
                    const net = acct.debit_balance - acct.credit_balance;
                    return (
                      <button
                        key={acct.account_no}
                        onClick={() => setSelected(acct.account_no)}
                        className={`w-full text-left px-3 py-2 mx-1 rounded-md transition-colors flex items-center justify-between gap-2 ${
                          isActive
                            ? "bg-white border border-slate-200 shadow-sm"
                            : "hover:bg-white/70"
                        }`}
                        style={{ width: "calc(100% - 8px)" }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-mono text-slate-400 leading-none">{acct.account_no}</p>
                          <p className="text-xs font-medium text-slate-700 leading-tight mt-0.5 truncate">{acct.account_name}</p>
                        </div>
                        <ChevronRight className={`w-3 h-3 shrink-0 transition-opacity ${isActive ? "text-slate-400 opacity-100" : "opacity-0"}`} />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* Right panel — entry detail */}
      <main className="flex-1 overflow-y-auto p-8 bg-white">
        {!accounts ? (
          <DetailSkeleton />
        ) : selectedAccount ? (
          <AccountDetail
            account={selectedAccount}
            entries={entries}
            loading={entriesLoading}
            isConsolidated={isConsolidated}
          />
        ) : (
          <p className="text-slate-400 text-sm">Select an account to view its journal entries.</p>
        )}
      </main>
    </div>
  );
}

function AccountDetail({
  account,
  entries,
  loading,
  isConsolidated,
}: {
  account: TrialBalanceAccount;
  entries: AccountEntries | null;
  loading: boolean;
  isConsolidated: boolean;
}) {
  const net = account.debit_balance - account.credit_balance;
  const typeBadge = TYPE_COLOR[account.account_type] ?? "bg-slate-100 text-slate-600 border-slate-200";

  const entities = entries
    ? [...new Set(entries.entries.map((e) => e.entity).filter(Boolean) as string[])]
    : [];

  const entityTotals = entities.reduce<Record<string, { debit: number; credit: number; lines: number }>>(
    (acc, ent) => {
      const rows = entries!.entries.filter((e) => e.entity === ent);
      acc[ent] = {
        debit: rows.reduce((s, r) => s + (r.Debit_IDR ?? 0), 0),
        credit: rows.reduce((s, r) => s + (r.Credit_IDR ?? 0), 0),
        lines: rows.length,
      };
      return acc;
    },
    {}
  );

  const totalDebitAcrossEntities = entities.reduce((s, e) => s + entityTotals[e].debit, 0);

  return (
    <div className="max-w-5xl">
      {/* Account header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-slate-400">{account.account_no}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadge}`}>
              {account.account_type}
            </span>
            <span className="text-[10px] text-slate-400 border border-slate-200 rounded px-2 py-0.5">
              {account.account_group}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">{account.account_name}</h2>
        </div>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Debit</p>
          <p className="text-base font-semibold text-slate-800">{formatIDR(account.debit_total)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Total Credit</p>
          <p className="text-base font-semibold text-slate-800">{formatIDR(account.credit_total)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Net Balance</p>
          <p className={`text-base font-semibold ${net >= 0 ? "text-slate-800" : "text-red-600"}`}>
            {formatIDR(net)}
          </p>
        </div>
      </div>

      {/* Entity breakdown — consolidated sessions only */}
      {isConsolidated && (
        <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Entity Breakdown</p>
            <span className="text-xs text-slate-400">— which company contributed to this account</span>
          </div>

          {loading || !entries ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
            </div>
          ) : entities.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">No journal entries found for this account.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Entity</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Debit</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Credit</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 w-12">Lines</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 w-40">Share of debit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entities.map((ent) => {
                  const t = entityTotals[ent];
                  const pct = totalDebitAcrossEntities > 0 ? (t.debit / totalDebitAcrossEntities) * 100 : 0;
                  return (
                    <tr key={ent} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded ${entityColor(ent)}`}>
                          {ent}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 tabular-nums">
                        {formatIDR(t.debit)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                        {formatIDR(t.credit)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 tabular-nums text-xs">{t.lines}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{Math.round(pct)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Journal entries table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Journal Entries
          </p>
          {entries && (
            <span className="text-xs text-slate-400">{entries.entries.length} lines</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : !entries || entries.entries.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm border border-slate-200 rounded-lg bg-slate-50">
            No journal entries for this account.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500 w-24">Date</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500 w-36">JE ID</th>
                  {isConsolidated && (
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-500 w-20">Entity</th>
                  )}
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Description</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-500 w-32">Debit</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-500 w-32">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.entries.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-slate-500 font-mono">{row.Document_Date}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono">{row.JE_ID}</td>
                    {isConsolidated && (
                      <td className="px-3 py-2">
                        {row.entity ? (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${entityColor(row.entity)}`}>
                            {row.entity}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2 text-slate-700 max-w-xs truncate" title={row.Description}>
                      {row.Description}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                      {row.Debit_IDR > 0 ? formatIDR(row.Debit_IDR) : ""}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 tabular-nums">
                      {row.Credit_IDR > 0 ? formatIDR(row.Credit_IDR) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200 font-semibold">
                  <td colSpan={isConsolidated ? 4 : 3} className="px-3 py-2 text-right text-slate-500 text-[11px] uppercase tracking-wide">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right text-slate-800 tabular-nums">{formatIDR(entries.total_debit)}</td>
                  <td className="px-3 py-2 text-right text-slate-800 tabular-nums">{formatIDR(entries.total_credit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-5xl space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
