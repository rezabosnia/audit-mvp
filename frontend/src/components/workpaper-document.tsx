"use client";

import { type Workpaper } from "@/lib/api";
import { formatIDR } from "@/lib/format";
import { Separator } from "@/components/ui/separator";

const RISK_STYLES: Record<string, { badge: string; section: string }> = {
  High:       { badge: "bg-red-100 text-red-700 border border-red-200",     section: "border-red-200 bg-red-50" },
  Medium:     { badge: "bg-amber-100 text-amber-700 border border-amber-200", section: "border-amber-200 bg-amber-50" },
  Low:        { badge: "bg-slate-100 text-slate-600 border border-slate-200", section: "border-slate-200 bg-slate-50" },
  "No Issues":{ badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", section: "border-emerald-200 bg-emerald-50" },
};

const FINDING_RISK: Record<string, string> = {
  High:   "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-amber-100 text-amber-700 border border-amber-200",
  Low:    "bg-slate-100 text-slate-600 border border-slate-200",
};

export function WorkpaperDocument({ wp }: { wp: Workpaper }) {
  const styles = RISK_STYLES[wp.risk_rating] ?? RISK_STYLES["No Issues"];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-slate-400 mb-1">{wp.workpaper_id}</p>
          <h2 className="text-2xl font-bold text-slate-800">{wp.audit_area}</h2>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full shrink-0 ${styles.badge}`}>
          {wp.risk_rating}
        </span>
      </div>

      <Separator />

      {/* Objective & Scope */}
      <div className="grid grid-cols-2 gap-6">
        <Section title="Objective">
          <p className="text-sm text-slate-700 leading-relaxed">{wp.objective}</p>
        </Section>
        <Section title="Scope">
          <p className="text-sm text-slate-700 leading-relaxed">{wp.scope}</p>
        </Section>
      </div>

      {/* Procedures */}
      <Section title="Procedures Performed">
        <ol className="space-y-2">
          {wp.procedures_performed.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Key Account Balances */}
      {wp.key_balances.length > 0 && (
        <Section title={`Key Account Balances (${wp.key_balances.length} accounts)`}>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-2.5 text-left font-medium">Account No</th>
                  <th className="px-4 py-2.5 text-left font-medium">Account Name</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit (IDR)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Credit (IDR)</th>
                  <th className="px-4 py-2.5 text-right font-medium">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wp.key_balances.map((b) => (
                  <tr key={b.account_no} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{b.account_no}</td>
                    <td className="px-4 py-2.5 text-slate-700">{b.account_name}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-600">{formatIDR(b.debit)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-slate-600">{formatIDR(b.credit)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${b.net_balance < 0 ? "text-red-600" : "text-slate-800"}`}>
                      {formatIDR(b.net_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Findings */}
      <Section title={`Findings (${wp.findings.length})`}>
        {wp.findings.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No exceptions noted.</p>
        ) : (
          <div className="space-y-3">
            {wp.findings.map((f) => (
              <div key={f.finding_id} className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{f.finding_id}</span>
                    <span className="text-sm font-semibold text-slate-800">{f.rule_name}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${FINDING_RISK[f.risk_level] ?? ""}`}>
                    {f.risk_level}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-1">{f.description}</p>
                {f.je_id && (
                  <p className="text-xs text-slate-400 font-mono">JE: {f.je_id}{f.date ? ` · ${f.date}` : ""}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Highlighted JEs */}
      {wp.highlighted_je_ids.length > 0 && (
        <Section title="Highlighted Journal Entries">
          <div className="flex flex-wrap gap-2">
            {wp.highlighted_je_ids.map((id) => (
              <span key={id} className="font-mono text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded px-2 py-1">
                {id}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* FS Impact + Recommended Query */}
      <div className="grid grid-cols-2 gap-6">
        <Section title="Financial Statement Impact">
          <p className="text-sm text-slate-700 leading-relaxed">{wp.financial_statement_impact}</p>
        </Section>
        <Section title="Recommended Audit Query">
          <p className="text-sm text-blue-800 leading-relaxed bg-blue-50 border border-blue-100 rounded p-3">
            {wp.recommended_audit_query}
          </p>
        </Section>
      </div>

      {/* Conclusion */}
      <div className={`rounded-lg border p-5 ${styles.section}`}>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Conclusion</p>
        <p className="text-sm text-slate-800 leading-relaxed">{wp.conclusion}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}
