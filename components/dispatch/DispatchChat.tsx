"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentResult, AgentStep } from "@/lib/agent/types";
import ToolActivityPanel from "./ToolActivityPanel";

type Message = { role: "user" | "model"; text: string; steps?: AgentStep[] };

const SAMPLE_PROMPTS = [
  "Which riders have free capacity today?",
  "Assign all pending Velachery deliveries for this evening",
  "Show me all failed deliveries",
  "Reschedule yesterday's failed deliveries to tomorrow morning",
  "Assign a delivery to a rider from another zone",
  "Assign more deliveries than a rider's capacity",
  "Assign the deliveries",
];

export default function DispatchChat({ onDataChanged }: { onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-20).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const result = data as AgentResult;
      setMessages([...next, { role: "model", text: result.reply, steps: result.steps }]);
      
      // Save to activity log in localStorage
      try {
        const stored = localStorage.getItem("routewise_activity");
        const existing = stored ? JSON.parse(stored) : [];
        const entry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          userMessage: trimmed,
          agentReply: result.reply,
          steps: result.steps,
        };
        localStorage.setItem("routewise_activity", JSON.stringify([entry, ...existing].slice(0, 50)));
      } catch {
        // Ignore localStorage error
      }

      if (result.steps.some((s) => s.writes && s.ok)) onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">AI Dispatch Assistant</h2>
        <p className="text-xs text-slate-500">Natural language dispatch. Every tool call is shown below.</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Try one of these:</p>
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-slate-900 px-3 py-2 text-sm text-white"
                  : "max-w-[85%] space-y-2"
              }
            >
              {m.steps && m.steps.length > 0 && <ToolActivityPanel steps={m.steps} />}
              {m.role === "model" ? (
                <div className="whitespace-pre-wrap rounded-2xl bg-slate-100 px-3 py-2 text-sm">{m.text}</div>
              ) : (
                m.text
              )}
            </div>
          </div>
        ))}

        {loading && <p className="text-sm text-slate-500 flex justify-center">Agent is working...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-slate-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your request..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
