"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopNav } from "@/components/layout/TopNav";
import DispatchChat from "@/components/dispatch/DispatchChat";
import KpiCard from "@/components/dashboard/KpiCard";

export default function DispatchPage() {
  const [refreshKey, setRefreshKey] = useState(0);
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

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <AppShell title="AI Dispatch">
      <div className="grid gap-6 lg:grid-cols-4 lg:grid-rows-[auto_1fr]">
        {/* Quick Context Panel */}
        <aside className="lg:col-span-1 lg:row-span-2 space-y-4">
          {stats && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Quick Context</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Today's Pending</span><span className="font-medium text-amber-700">{stats.pending}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Failed</span><span className="font-medium text-red-700">{stats.failed}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Riders on Shift</span><span className="font-medium">{stats.ridersOnShift}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Zones with Pending</h3>
                <div className="space-y-2">
                  {/* This would be populated from pendingByZone in a full implementation */}
                  <p className="text-xs text-slate-500">Data loads with dashboard stats</p>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Chat Panel */}
        <section className="lg:col-span-3 lg:row-span-2 min-h-[600px]">
          <DispatchChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
      </div>
    </AppShell>
  );
}
