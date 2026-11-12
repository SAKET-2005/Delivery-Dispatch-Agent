"use client";

import { useState } from "react";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-3xl mb-4">
            🚚
          </div>
          <h1 className="text-3xl font-bold text-slate-900">RouteWise</h1>
          <p className="mt-1 text-slate-500 font-medium">Chennai Delivery Hub</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Enter team passcode</h2>
            <p className="mt-1 text-sm text-slate-500">This keeps your app and your Gemini quota safe.</p>
          </div>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            placeholder="Passcode"
            autoFocus
            disabled={loading}
          />
          {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !passcode}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? "Checking..." : "Enter Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
