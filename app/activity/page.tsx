"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Clock3, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityItem, AgentStep, readActivity } from "@/lib/types";

function ToolTrace({ step }: { step: AgentStep }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tool-card">
      <button className="tool-toggle" onClick={() => setOpen(!open)}>
        <span className={step.ok ? "tool-pass" : "tool-fail"}>{step.ok ? "●" : "!"}</span>
        <strong>{step.tool}</strong>
        {step.writes && <span className="write-badge">WRITES DATA</span>}
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className="tool-content">
          <div style={{ fontWeight: 650, color: step.ok ? "#158163" : "#c14b4b" }}>
            {step.ok ? "Completed" : "Failed"}
          </div>
          <div style={{ marginTop: 8 }}>Arguments</div>
          <pre>{JSON.stringify(step.args, null, 2)}</pre>
          {step.error && (
            <>
              <div style={{ marginTop: 8 }}>Error</div>
              <pre>{step.error}</pre>
            </>
          )}
          {step.result !== undefined && (
            <>
              <div style={{ marginTop: 8 }}>Result</div>
              <pre>{JSON.stringify(step.result, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const sync = useCallback(() => setItems(readActivity()), []);

  useEffect(() => {
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("routewise:activity", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("routewise:activity", sync);
    };
  }, [sync]);

  function clear() {
    localStorage.removeItem("routewise_activity");
    setItems([]);
    window.dispatchEvent(new Event("routewise:activity"));
  }

  return (
    <AppShell>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Dispatcher history</div>
            <h1 className="page-title">Activity</h1>
            <p className="page-subtitle">A local record of AI dispatch requests and tool actions.</p>
          </div>
          <button className="btn btn-danger" disabled={!items.length} onClick={clear}>
            <Trash2 size={13} /> Clear log
          </button>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Recent interactions</div>
              <div className="panel-hint">Up to 50 interactions stored in this browser</div>
            </div>
            <span className="badge badge-assigned">{items.length} entries</span>
          </div>
          <div className="panel-body">
            {!items.length ? (
              <div className="empty-state">
                No activity recorded yet. Your dispatch assistant conversations will appear here.
              </div>
            ) : (
              <div className="activity-timeline">
                {items.map((item, i) => (
                  <article className="activity-item" key={item.id} style={{ "--i": i } as React.CSSProperties}>
                    <div className="activity-card">
                      <div className="activity-meta">
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <Clock3 size={11} />
                          {new Date(item.timestamp).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>
                          {item.steps.length} tool {item.steps.length === 1 ? "action" : "actions"}
                        </span>
                      </div>
                      <div className="activity-request">{item.userMessage}</div>
                      <div className="activity-reply">{item.agentReply}</div>
                      {!!item.steps.length && (
                        <div className="activity-steps">
                          {item.steps.map((s, j) => (
                            <ToolTrace step={s} key={`${s.tool}-${j}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
