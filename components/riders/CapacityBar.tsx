"use client";

interface CapacityBarProps {
  active: number;
  capacity: number;
}

export default function CapacityBar({ active, capacity }: CapacityBarProps) {
  const pct = capacity > 0 ? Math.min(100, (active / capacity) * 100) : 0;
  const colorClass = pct >= 81 ? "bg-red-500" : pct >= 51 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${pct}%` }}></div>
      </div>
      <span className="text-xs font-mono text-slate-600 w-16 text-right">{active}/{capacity}</span>
      <span className={`text-xs font-medium ${pct >= 81 ? "text-red-600" : pct >= 51 ? "text-amber-600" : "text-green-600"}`}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}
