"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { AgentStep } from "@/lib/agent/types";

interface ActivityEntry {
  id: string;
  timestamp: string;
  userMessage: string;
  agentReply: string;
  steps: AgentStep[];
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("routewise_activity");
    if (stored) {
      try {
        setActivities(JSON.parse(stored));
      } catch {
        setActivities([]);
      }
    }
  }, []);

  function handleClear() {
    localStorage.removeItem("routewise_activity");
    setActivities([]);
  }

  return (
    <AppShell title="Activity Log">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Agent Activity Log</h2>
            <p className="text-xs text-slate-500">Shows all dispatcher interactions and tool executions from this session</p>
          </div>
          {activities.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
            >
              Clear Log
            </button>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-slate-900 font-medium">No activity yet</h3>
            <p className="mt-1 text-slate-500 text-sm">
              Agent interactions from the AI Dispatch page will appear here.
              <br />
              This log is stored locally in your browser.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Dispatcher Request</p>
                    <p className="text-sm text-slate-500">{activity.timestamp}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 mb-3">
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{activity.userMessage}</p>
                </div>
                {activity.steps && activity.steps.length > 0 && (
                  <details className="mb-3">
                    <summary className="cursor-pointer text-sm font-medium text-slate-700 mb-2">Tool Execution Steps ({activity.steps.length})</summary>
                    <div className="space-y-2 text-xs">
                      {activity.steps.map((s, i) => (
                        <div key={i} className="rounded border border-slate-200 bg-white p-2 font-mono text-[11px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={s.ok ? "text-emerald-600" : "text-red-600"}>
                              {s.ok ? "?" : "?"}
                            </span>
                            <span className="font-medium">{s.tool}</span>
                            {s.writes && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-[10px]">writes</span>}
                          </div>
                          <div className="text-slate-600 ml-6">Args: {JSON.stringify(s.args)}</div>
                          {s.ok && s.result != null && <div className="text-slate-600 ml-6">Result: {JSON.stringify(s.result)}</div>}
                          {!s.ok && s.error && <div className="text-red-600 ml-6">Error: {s.error}</div>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                  <p className="text-sm font-medium text-blue-900 mb-1">Agent Response</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{activity.agentReply}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
