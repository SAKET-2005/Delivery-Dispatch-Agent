"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, ChevronRight, RotateCw, Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBanner } from "@/components/ui/Primitives";
import { ActivityItem, AgentStep, api, readActivity, saveActivity, Stats, ZONES } from "@/lib/types";

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  steps?: AgentStep[];
  timestamp: string;
};

const prompts = [
  "Which riders have free capacity today?",
  "Assign all pending Velachery deliveries for this evening",
  "Show me all failed deliveries",
  "Reschedule yesterday's failed deliveries to tomorrow morning",
  "Assign a delivery to a rider from another zone",
];

function ToolCard({ step }: { step: AgentStep }) {
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
          <div className={step.ok ? "tool-pass" : "tool-fail"} style={{ fontWeight: 650 }}>
            {step.ok ? "Tool completed" : "Tool failed"}
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
              <div style={{ marginTop: 8 }}>JSON result</div>
              <pre>{JSON.stringify(step.result, null, 2)}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DispatchPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const refreshStats = useCallback(async () => {
    try {
      setStats(await api<Stats>("/api/stats"));
    } catch {
      /* Keep last known context visible if the API is temporarily unavailable. */
    }
  }, []);

  useEffect(() => {
    void refreshStats();
    const previous = readActivity().slice().reverse();
    setMessages(
      previous.flatMap((item: ActivityItem) => [
        { id: `${item.id}-u`, role: "user" as const, text: item.userMessage, timestamp: item.timestamp },
        {
          id: `${item.id}-a`,
          role: "model" as const,
          text: item.agentReply,
          steps: item.steps,
          timestamp: item.timestamp,
        },
      ])
    );
  }, [refreshStats]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text = draft) {
    const value = text.trim();
    if (!value || busy) return;
    setDraft("");
    setError("");
    const timestamp = new Date().toISOString();
    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", text: value, timestamp };
    const prior = messages.map((m) => ({ role: m.role, text: m.text }));
    const next = [...messages, user];
    setMessages(next);
    setBusy(true);

    try {
      const response = await api<{ reply: string; steps: AgentStep[] }>("/api/agent", {
        method: "POST",
        body: JSON.stringify({ messages: [...prior, { role: "user", text: value }].slice(-20) }),
      });
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        text: response.reply,
        steps: response.steps || [],
        timestamp: new Date().toISOString(),
      };
      setMessages((cur) => [...cur, reply]);
      const record: ActivityItem = {
        id: user.id,
        timestamp,
        userMessage: value,
        agentReply: response.reply,
        steps: response.steps || [],
      };
      saveActivity(record);
      if ((response.steps || []).some((s) => s.ok && s.writes)) {
        await refreshStats();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "The assistant could not respond. Please try again.";
      setError(message);
      const fallback = "I couldn’t complete that request. Please check the connection and try again.";
      setMessages((cur) => [
        ...cur,
        { id: crypto.randomUUID(), role: "model", text: fallback, timestamp: new Date().toISOString() },
      ]);
      saveActivity({
        id: user.id,
        timestamp,
        userMessage: value,
        agentReply: fallback,
        steps: [
          {
            tool: "dispatch_request",
            args: { messages: [...prior, { role: "user", text: value }] },
            ok: false,
            writes: false,
            error: message,
          },
        ],
      });
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  return (
    <AppShell>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">AI-assisted operations</div>
            <h1 className="page-title">Dispatch assistant</h1>
            <p className="page-subtitle">Plan assignments, understand exceptions and act on your hub.</p>
          </div>
          <span className="badge badge-out_for_delivery">
            <span className="pulse-dot" /> Assistant ready
          </span>
        </div>

        {error && <ErrorBanner message={error} onRetry={() => setError("")} />}

        <div className="chat-layout">
          <section className="panel chat-panel">
            <div className="panel-head">
              <div className="chat-heading">
                <span className="assistant-icon">
                  <Bot size={18} />
                </span>
                <div>
                  <div className="panel-title">RouteWise AI</div>
                  <div className="panel-hint">Chennai dispatch operations</div>
                </div>
              </div>
              <button className="btn btn-quiet" onClick={() => setMessages([])} title="New conversation">
                <RotateCw size={14} />
              </button>
            </div>

            <div className="chat-messages">
              {!messages.length && !busy && (
                <div className="chat-welcome">
                  <div className="chat-welcome-mark">
                    <Sparkles size={22} />
                  </div>
                  <h3>What needs moving?</h3>
                  <p>
                    Ask about riders, deliveries, zone workload or let me help plan an assignment. I’ll
                    show each operation before and after it runs.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <article className={`message ${m.role === "user" ? "user" : "assistant"}`} key={m.id}>
                  <div className="message-bubble">{m.text}</div>
                  <div className="message-time">
                    {new Date(m.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {m.steps?.map((s, i) => (
                    <ToolCard step={s} key={`${m.id}-${i}`} />
                  ))}
                </article>
              ))}

              {busy && (
                <div className="message assistant">
                  <div className="message-bubble typing" aria-label="Assistant is typing">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
              <div ref={bottom} />
            </div>

            <div className="chat-composer">
              <form className="composer-box" onSubmit={submit}>
                <textarea
                  className="composer-input"
                  rows={1}
                  placeholder="Ask about dispatch, riders or deliveries…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <button
                  className="btn btn-primary send-btn"
                  aria-label="Send message"
                  disabled={busy || !draft.trim()}
                >
                  <Send size={14} />
                </button>
              </form>
              <div className="chip-list">
                {prompts.map((p) => (
                  <button key={p} className="prompt-chip" onClick={() => void send(p)} disabled={busy}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="panel context-panel">
            <div className="panel-head" style={{ padding: "0 0 13px", border: 0 }}>
              <div>
                <div className="panel-title">Quick context</div>
                <div className="panel-hint">Live hub snapshot</div>
              </div>
              <span className="live-dot" />
            </div>

            {stats ? (
              <>
                <div className="context-row">
                  <span className="context-label">Today’s pending</span>
                  <span className="context-value">{stats.pending}</span>
                </div>
                <div className="context-row">
                  <span className="context-label">Failed deliveries</span>
                  <span className="context-value" style={{ color: stats.failed ? "#c14b4b" : undefined }}>
                    {stats.failed}
                  </span>
                </div>
                <div className="context-row">
                  <span className="context-label">Riders on shift</span>
                  <span className="context-value">{stats.ridersOnShift}</span>
                </div>

                <div className="context-zones">
                  <div className="panel-hint" style={{ marginBottom: 5 }}>
                    ZONES WITH PENDING
                  </div>
                  {ZONES.filter((z) => (stats.pendingByZone?.[z.id] || 0) > 0).map((z) => (
                    <div className="context-zone" key={z.id}>
                      <span>
                        {z.id} · {z.name}
                      </span>
                      <strong>{stats.pendingByZone[z.id]}</strong>
                    </div>
                  ))}
                  {!ZONES.some((z) => (stats.pendingByZone?.[z.id] || 0) > 0) && (
                    <div className="context-zone">All zones clear</div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ paddingTop: 15, fontSize: 10, color: "#8793a0" }}>
                Loading live hub context…
              </div>
            )}

            <button className="btn" style={{ width: "100%", marginTop: 14 }} onClick={() => void refreshStats()}>
              <RotateCw size={12} /> Refresh context
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
