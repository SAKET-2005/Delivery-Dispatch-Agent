"use client";

import type { AgentStep } from "@/lib/agent/types";

interface ToolActivityPanelProps {
  steps: AgentStep[];
}

export default function ToolActivityPanel({ steps }: ToolActivityPanelProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <details key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <summary className="cursor-pointer select-none flex items-center gap-2">
            <span className={s.ok ? "text-emerald-700" : "text-red-600"}>
              {s.ok ? "✅" : "❌"}
            </span>
            <span className="font-mono font-medium">{s.tool}</span>
            {s.writes && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-[10px]">writes data</span>}
          </summary>
          <div className="mt-2 space-y-1 text-slate-600 font-mono text-[11px]">
            <div><strong>Args:</strong> {JSON.stringify(s.args, null, 2)}</div>
            {s.ok && s.result ? (
              <div><strong>Result:</strong> {JSON.stringify(s.result, null, 2)}</div>
            ) : null}
            {!s.ok && s.error && <div className="text-red-600"><strong>Error:</strong> {s.error}</div>}
          </div>
        </details>
      ))}
    </div>
  );
}

