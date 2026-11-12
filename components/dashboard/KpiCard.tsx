"use client";

interface KpiCardProps {
  label: string;
  value: number;
  highlight?: "warning" | "danger" | "success" | "normal";
  icon?: React.ReactNode;
}

const HIGHLIGHT_STYLES = {
  warning: "border-l-4 border-amber-500 bg-amber-50",
  danger: "border-l-4 border-red-500 bg-red-50",
  success: "border-l-4 border-green-500 bg-green-50",
  normal: "border-l-4 border-slate-300",
};

export default function KpiCard({ label, value, highlight = "normal", icon }: KpiCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${HIGHLIGHT_STYLES[highlight]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </div>
  );
}
