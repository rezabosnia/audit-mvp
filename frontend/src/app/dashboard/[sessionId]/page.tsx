"use client";

import { use, useEffect, useState } from "react";
import { getMetrics, getMetadata, type Metrics, type Metadata } from "@/lib/api";
import { MetricCard } from "@/components/metric-card";
import { formatIDR, formatPercent, formatRatio } from "@/lib/format";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, AlertCircle } from "lucide-react";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = !metrics && !error;

  useEffect(() => {
    Promise.all([getMetrics(sessionId), getMetadata(sessionId)])
      .then(([m, d]) => { setMetrics(m); setMeta(d); })
      .catch((e) => setError(e.message));
  }, [sessionId]);

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
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
          {meta && (
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{meta.filename}</span>
              <Badge variant="secondary" className="text-xs py-0">
                {meta.status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Primary metrics */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Financial Summary
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Assets"
            value={metrics ? formatIDR(metrics.total_assets) : null}
            sub="Balance Sheet"
            loading={loading}
          />
          <MetricCard
            label="Revenue"
            value={metrics ? formatIDR(metrics.revenue) : null}
            sub="Income Statement"
            loading={loading}
          />
          <MetricCard
            label="Net Income"
            value={metrics ? formatIDR(metrics.net_income) : null}
            sub="After all expenses"
            loading={loading}
            accent={
              metrics
                ? metrics.net_income >= 0
                  ? "positive"
                  : "negative"
                : "default"
            }
          />
          <MetricCard
            label="Net Profit Margin"
            value={
              metrics ? formatPercent(metrics.net_profit_margin) : null
            }
            sub="Net income / Revenue"
            loading={loading}
            accent={
              metrics
                ? (metrics.net_profit_margin ?? 0) >= 0
                  ? "positive"
                  : "negative"
                : "default"
            }
          />
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="mt-6 mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Balance Sheet Ratios
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Liabilities"
            value={metrics ? formatIDR(metrics.total_liabilities) : null}
            loading={loading}
          />
          <MetricCard
            label="Total Equity"
            value={metrics ? formatIDR(metrics.total_equity) : null}
            loading={loading}
          />
          <MetricCard
            label="Current Ratio"
            value={metrics ? formatRatio(metrics.current_ratio) : null}
            sub="Current assets / Current liabilities"
            loading={loading}
            accent={
              metrics
                ? (metrics.current_ratio ?? 0) >= 1
                  ? "positive"
                  : "negative"
                : "default"
            }
          />
          <MetricCard
            label="Debt-to-Equity"
            value={metrics ? formatRatio(metrics.debt_to_equity) : null}
            sub="Total liabilities / Total equity"
            loading={loading}
          />
        </div>
      </div>

      {/* Data summary */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
          Engagement Summary
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Journal Entries"
            value={metrics ? String(metrics.je_count) : null}
            sub="Total lines processed"
            loading={loading}
          />
          <MetricCard
            label="Accounts"
            value={metrics ? String(metrics.account_count) : null}
            sub="Chart of Accounts"
            loading={loading}
          />
          <MetricCard
            label="Total Findings"
            value={metrics ? String(metrics.findings_count) : null}
            sub="Audit risk items"
            loading={loading}
            accent={
              metrics
                ? metrics.findings_count > 0
                  ? "warning"
                  : "positive"
                : "default"
            }
          />
          <MetricCard
            label="High-Risk Findings"
            value={metrics ? String(metrics.high_risk_count) : null}
            sub="Require immediate review"
            loading={loading}
            accent={
              metrics
                ? metrics.high_risk_count > 0
                  ? "negative"
                  : "positive"
                : "default"
            }
          />
        </div>
      </div>
    </div>
  );
}
