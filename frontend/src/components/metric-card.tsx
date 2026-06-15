import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: string | null;
  sub?: string;
  loading?: boolean;
  accent?: "default" | "positive" | "negative" | "warning";
}

export function MetricCard({
  label,
  value,
  sub,
  loading,
  accent = "default",
}: MetricCardProps) {
  const accentClass = {
    default: "text-slate-800",
    positive: "text-emerald-700",
    negative: "text-red-600",
    warning: "text-amber-600",
  }[accent];

  return (
    <Card className="bg-white shadow-sm border border-slate-200">
      <CardContent className="px-5 py-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        {loading ? (
          <>
            <Skeleton className="h-7 w-32 mb-1" />
            {sub && <Skeleton className="h-3.5 w-20" />}
          </>
        ) : (
          <>
            <p className={`text-2xl font-semibold leading-tight ${accentClass}`}>
              {value ?? "—"}
            </p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
