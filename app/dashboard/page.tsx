"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import KpiCard from "@/components/dashboard/KpiCard";
import DispatchOverview from "@/components/dashboard/DispatchOverview";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    assigned: number;
    out_for_delivery: number;
    delivered: number;
    failed: number;
    ridersOnShift: number;
    activeRiders: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <main className="p-6 lg:p-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl border border-slate-200"></div>
            ))}
          </div>
        </main>
      </AppShell>
    );
  }

  if (error || !stats) {
    return (
      <AppShell title="Dashboard">
        <main className="p-6 lg:p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error || "Failed to load dashboard"}</div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <main className="p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-8">
          <KpiCard label="Total Today" value={stats.total} icon="??" />
          <KpiCard label="Pending" value={stats.pending} highlight="warning" icon="?" />
          <KpiCard label="Assigned" value={stats.assigned} highlight="normal" icon="??" />
          <KpiCard label="Out for Delivery" value={stats.out_for_delivery} highlight="success" icon="??" />
          <KpiCard label="Delivered" value={stats.delivered} highlight="success" icon="?" />
          <KpiCard label="Failed" value={stats.failed} highlight="danger" icon="?" />
        </div>
        <DispatchOverview />
      </main>
    </AppShell>
  );
}
