"use client";

import { use, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import {
  getTrialBalance,
  getBalanceSheet,
  getPL,
  type TrialBalance,
  type BalanceSheet,
  type PL,
} from "@/lib/api";
import { TrialBalanceTable } from "@/components/trial-balance-table";
import { BalanceSheetTable } from "@/components/balance-sheet-table";
import { PLTable } from "@/components/pl-table";

export default function FinancialStatementsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);

  const [tb, setTb] = useState<TrialBalance | null>(null);
  const [bs, setBs] = useState<BalanceSheet | null>(null);
  const [pl, setPl] = useState<PL | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = !tb && !error;

  useEffect(() => {
    Promise.all([
      getTrialBalance(sessionId),
      getBalanceSheet(sessionId),
      getPL(sessionId),
    ])
      .then(([t, b, p]) => { setTb(t); setBs(b); setPl(p); })
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Financial Statements</h2>
        <p className="text-slate-500 text-sm mt-1">
          Derived from uploaded journal entries and chart of accounts.
        </p>
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="trial-balance">
        <TabsList className="mb-6 bg-slate-100 border border-slate-200">
          <TabsTrigger value="trial-balance" className="text-sm">
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="text-sm">
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="pl" className="text-sm">
            Profit &amp; Loss
          </TabsTrigger>
        </TabsList>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700">
                Trial Balance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All accounts with total movements and closing balances
              </p>
            </div>
            {loading ? (
              <TableSkeleton />
            ) : tb ? (
              <TrialBalanceTable data={tb} />
            ) : null}
          </div>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700">
                Balance Sheet
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Statement of financial position
              </p>
            </div>
            <div className="p-6">
              {loading ? (
                <TableSkeleton rows={8} />
              ) : bs ? (
                <BalanceSheetTable data={bs} />
              ) : null}
            </div>
          </div>
        </TabsContent>

        {/* P&L */}
        <TabsContent value="pl">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700">
                Profit &amp; Loss Statement
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Income statement — revenues and expenses
              </p>
            </div>
            <div className="p-6">
              {loading ? (
                <TableSkeleton rows={6} />
              ) : pl ? (
                <PLTable data={pl} />
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}
