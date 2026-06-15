"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Finding } from "@/lib/api";
import { formatNumber } from "@/lib/format";

const RISK_STYLES: Record<string, string> = {
  High: "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-amber-100 text-amber-700 border border-amber-200",
  Low: "bg-slate-100 text-slate-600 border border-slate-200",
};

interface Props {
  findings: Finding[];
  riskFilter: string;
  ruleFilter: string;
}

export function FindingsTable({ findings, riskFilter, ruleFilter }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      if (riskFilter !== "All" && f.risk_level !== riskFilter) return false;
      if (ruleFilter !== "All" && f.rule_name !== ruleFilter) return false;
      return true;
    });
  }, [findings, riskFilter, ruleFilter]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exportCSV() {
    const headers = [
      "Finding ID", "Rule Name", "Risk Level", "JE ID", "Date",
      "Account No", "Account Name", "Amount (IDR)", "Description",
      "Reason Flagged", "Financial Statement Impact", "Recommended Audit Query",
    ];
    const rows = filtered.map((f) => [
      f.finding_id, f.rule_name, f.risk_level, f.je_id, f.date,
      f.account_no, f.account_name, f.amount.toString(), f.description,
      f.reason_flagged, f.financial_statement_impact, f.recommended_audit_query,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_findings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        No findings match the selected filters.
      </div>
    );
  }

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="gap-1.5 text-xs border-slate-200 text-slate-600 hover:text-slate-900"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
              <th className="w-6 px-3 py-3" />
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Rule</th>
              <th className="px-4 py-3 text-left font-medium">Risk</th>
              <th className="px-4 py-3 text-left font-medium">Account</th>
              <th className="px-4 py-3 text-left font-medium">JE ID</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Amount (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((f) => {
              const isOpen = expanded.has(f.finding_id);
              return (
                <>
                  <tr
                    key={f.finding_id}
                    onClick={() => toggle(f.finding_id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-3 text-slate-400">
                      {isOpen
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {f.finding_id}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px]">
                      {f.rule_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${RISK_STYLES[f.risk_level] ?? ""}`}>
                        {f.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                      <div className="text-xs font-mono text-slate-500">{f.account_no}</div>
                      <div className="text-xs text-slate-700 truncate">{f.account_name}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {f.je_id || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {f.date || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">
                      {f.amount > 0 ? formatNumber(f.amount) : "—"}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr key={`${f.finding_id}-detail`} className="bg-blue-50/40">
                      <td />
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 gap-4 text-sm">
                          <DetailRow label="Description" value={f.description} />
                          <DetailRow label="Reason Flagged" value={f.reason_flagged} />
                          <DetailRow label="Financial Statement Impact" value={f.financial_statement_impact} />
                          <DetailRow
                            label="Recommended Audit Query"
                            value={f.recommended_audit_query}
                            highlight
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-2 text-right">
        {filtered.length} finding{filtered.length !== 1 ? "s" : ""}
        {filtered.length !== findings.length ? ` (filtered from ${findings.length})` : ""}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-sm leading-relaxed ${
          highlight
            ? "text-blue-800 bg-blue-50 border border-blue-100 rounded p-2"
            : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
