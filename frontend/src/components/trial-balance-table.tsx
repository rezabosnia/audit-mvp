import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/format";
import type { TrialBalance } from "@/lib/api";

export function TrialBalanceTable({ data }: { data: TrialBalance }) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-24 text-slate-600 font-semibold">Acct No.</TableHead>
            <TableHead className="text-slate-600 font-semibold">Account Name</TableHead>
            <TableHead className="text-slate-600 font-semibold">Type</TableHead>
            <TableHead className="text-right text-slate-600 font-semibold">Total Debits</TableHead>
            <TableHead className="text-right text-slate-600 font-semibold">Total Credits</TableHead>
            <TableHead className="text-right text-slate-600 font-semibold">Dr Balance</TableHead>
            <TableHead className="text-right text-slate-600 font-semibold">Cr Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.accounts.map((row) => (
            <TableRow key={row.account_no} className="hover:bg-slate-50 text-sm">
              <TableCell className="font-mono text-slate-500">{row.account_no}</TableCell>
              <TableCell className="font-medium text-slate-800">{row.account_name}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs font-normal ${typeColor(row.account_type)}`}
                >
                  {row.account_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-slate-700">
                {row.debit_total > 0 ? formatIDR(row.debit_total) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-slate-700">
                {row.credit_total > 0 ? formatIDR(row.credit_total) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-slate-800">
                {row.debit_balance > 0 ? formatIDR(row.debit_balance) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-slate-800">
                {row.credit_balance > 0 ? formatIDR(row.credit_balance) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Totals footer */}
      <div className="border-t-2 border-slate-300 mt-1">
        <div className="flex justify-end gap-6 px-4 py-3 bg-slate-50 text-sm font-semibold text-slate-700">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Total Debit Balance</p>
            <p className="font-mono">{formatIDR(data.total_debit)}</p>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Total Credit Balance</p>
            <p className="font-mono">{formatIDR(data.total_credit)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function typeColor(type: string): string {
  switch (type) {
    case "Asset": return "border-blue-200 text-blue-700 bg-blue-50";
    case "Contra Asset": return "border-blue-200 text-blue-600 bg-blue-50";
    case "Liability": return "border-orange-200 text-orange-700 bg-orange-50";
    case "Equity": return "border-purple-200 text-purple-700 bg-purple-50";
    case "Revenue": return "border-emerald-200 text-emerald-700 bg-emerald-50";
    case "Expense": return "border-red-200 text-red-700 bg-red-50";
    default: return "border-slate-200 text-slate-600";
  }
}
