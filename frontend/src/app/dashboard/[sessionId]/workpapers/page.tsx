"use client";

import { use, useEffect, useState } from "react";
import { AlertCircle, ShieldAlert, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkpapers, type Workpaper, type WorkpapersReport } from "@/lib/api";
import { WorkpaperDocument } from "@/components/workpaper-document";

const RISK_ICON: Record<string, React.ElementType> = {
  High:        ShieldAlert,
  Medium:      AlertTriangle,
  Low:         Info,
  "No Issues": CheckCircle,
};

const RISK_BADGE: Record<string, string> = {
  High:        "bg-red-100 text-red-700 border border-red-200",
  Medium:      "bg-amber-100 text-amber-700 border border-amber-200",
  Low:         "bg-slate-100 text-slate-600 border border-slate-200",
  "No Issues": "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const RISK_ICON_COLOR: Record<string, string> = {
  High:        "text-red-500",
  Medium:      "text-amber-500",
  Low:         "text-slate-400",
  "No Issues": "text-emerald-500",
};

export default function WorkpapersPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  const [data, setData] = useState<WorkpapersReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("WP-001");

  useEffect(() => {
    getWorkpapers(sessionId)
      .then((d) => {
        setData(d);
        if (d.workpapers.length > 0) setSelected(d.workpapers[0].workpaper_id);
      })
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

  const activeWp = data?.workpapers.find((w) => w.workpaper_id === selected) ?? null;

  return (
    <div className="flex h-full min-h-screen">
      {/* Left panel — workpaper list */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">Audit Workpapers</h3>
          <p className="text-xs text-slate-400 mt-0.5">6 areas · select to view</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {!data ? (
            <div className="px-3 space-y-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            data.workpapers.map((wp) => {
              const isActive = wp.workpaper_id === selected;
              const Icon = RISK_ICON[wp.risk_rating] ?? CheckCircle;
              return (
                <button
                  key={wp.workpaper_id}
                  onClick={() => setSelected(wp.workpaper_id)}
                  className={`w-full text-left px-3 py-3 mx-1 rounded-lg transition-colors mb-0.5 ${
                    isActive
                      ? "bg-white border border-slate-200 shadow-sm"
                      : "hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${RISK_ICON_COLOR[wp.risk_rating]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-slate-400">{wp.workpaper_id}</p>
                      <p className="text-sm font-medium text-slate-700 leading-tight mt-0.5">
                        {wp.audit_area}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${RISK_BADGE[wp.risk_rating]}`}>
                          {wp.risk_rating}
                        </span>
                        {wp.findings.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {wp.findings.length} finding{wp.findings.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </nav>
      </aside>

      {/* Right panel — document view */}
      <main className="flex-1 overflow-y-auto p-8">
        {!data ? (
          <DocumentSkeleton />
        ) : activeWp ? (
          <WorkpaperDocument wp={activeWp} />
        ) : null}
      </main>
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="max-w-4xl space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
