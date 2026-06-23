"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  FileText,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "",
  },
  {
    label: "Financial Statements",
    icon: BarChart3,
    path: "/financial-statements",
  },
  {
    label: "Audit Findings",
    icon: AlertTriangle,
    path: "/findings",
  },
  {
    label: "Audit Workpapers",
    icon: FileText,
    path: "/workpapers",
  },
];

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const sessionId = params?.sessionId as string;

  const base = `/dashboard/${sessionId}`;

  return (
    <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">
              Audit Intelligence
            </p>
            <p className="text-slate-400 text-xs leading-tight">Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const href = `${base}${item.path}`;
          const isActive = item.path === ""
            ? pathname === base
            : pathname.startsWith(href);

          return item.disabled ? (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-slate-500 cursor-not-allowed"
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-slate-700 text-slate-400 rounded px-1.5 py-0.5 font-medium shrink-0">
                  {item.badge}
                </span>
              )}
            </div>
          ) : (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Session info */}
      {sessionId && (
        <div className="px-4 py-3 border-t border-slate-700">
          <p className="text-slate-500 text-xs truncate">
            Session: {sessionId.slice(0, 8)}…
          </p>
        </div>
      )}
    </aside>
  );
}
