"use client";

import { use, useEffect, useState, useMemo } from "react";
import { AlertTriangle, ShieldAlert, AlertCircle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getFindings, type FindingsReport } from "@/lib/api";
import { FindingsTable } from "@/components/findings-table";

const ALL_RULES = [
  "Unbalanced Journal Entry",
  "Duplicate Transaction",
  "Same Preparer and Approver",
  "Year-End Manual Adjustment",
  "Late-Night Posting",
  "Weekend Posting",
  "Large Round-Number Transaction",
  "Negative Revenue / Revenue Reversal",
  "Unused Account",
  "Unusual Expense Spike",
];

export default function FindingsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  const [data, setData] = useState<FindingsReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [riskFilter, setRiskFilter] = useState("All");
  const [ruleFilter, setRuleFilter] = useState("All");

  useEffect(() => {
    getFindings(sessionId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [sessionId]);

  const activeRules = useMemo(() => {
    if (!data) return ALL_RULES;
    return [...new Set(data.findings.map((f) => f.rule_name))].sort();
  }, [data]);

  if (error) {
    return (
      <div className="p-8 flex items-center gap-2 text-red-600">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Audit Findings</h2>
        <p className="text-slate-500 text-sm mt-1">
          Automated risk indicators derived from journal entry analysis. {data && `${data.total} finding${data.total !== 1 ? "s" : ""} identified.`}
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard
          label="High Risk"
          count={data?.high ?? null}
          icon={ShieldAlert}
          colorClass="text-red-600"
          bgClass="bg-red-50 border-red-200"
          iconBg="bg-red-100"
        />
        <SummaryCard
          label="Medium Risk"
          count={data?.medium ?? null}
          icon={AlertTriangle}
          colorClass="text-amber-600"
          bgClass="bg-amber-50 border-amber-200"
          iconBg="bg-amber-100"
        />
        <SummaryCard
          label="Low Risk"
          count={data?.low ?? null}
          icon={Info}
          colorClass="text-slate-600"
          bgClass="bg-slate-50 border-slate-200"
          iconBg="bg-slate-100"
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Filter:
        </label>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          disabled={!data}
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
        >
          <option value="All">All Risk Levels</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={ruleFilter}
          onChange={(e) => setRuleFilter(e.target.value)}
          disabled={!data}
          className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 max-w-xs"
        >
          <option value="All">All Rules</option>
          {activeRules.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {!data ? (
        <LoadingSkeleton />
      ) : data.total === 0 ? (
        <EmptyState />
      ) : (
        <FindingsTable
          findings={data.findings}
          riskFilter={riskFilter}
          ruleFilter={ruleFilter}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  icon: Icon,
  colorClass,
  bgClass,
  iconBg,
}: {
  label: string;
  count: number | null;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  iconBg: string;
}) {
  return (
    <div className={`rounded-lg border p-4 flex items-center gap-4 ${bgClass}`}>
      <div className={`rounded-full p-2.5 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {count === null ? (
          <Skeleton className="h-7 w-12 mt-1" />
        ) : (
          <p className={`text-2xl font-bold ${colorClass}`}>{count}</p>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
      <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">No findings detected</p>
      <p className="text-slate-400 text-sm mt-1">
        The uploaded journal entries passed all 10 audit rules.
      </p>
    </div>
  );
}
