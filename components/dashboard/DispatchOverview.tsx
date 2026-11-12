"use client";

import { useEffect, useState } from "react";

interface PendingByZone {
  zone_id: string;
  zone_name: string;
  count: number;
}

interface RiderAvailability {
  id: string;
  name: string;
  zone: string;
  vehicle: string;
  capacity: number;
  active_count: number;
  remaining: number;
  has_shift_today: boolean;
}

interface FailedDelivery {
  id: number;
  order_ref: string;
  customer_name: string;
  zone_id: string;
  delivery_date: string;
  time_window: string;
  attempts: number;
  rider_name: string | null;
  can_reschedule: boolean;
}

export default function DispatchOverview() {
  const [pendingByZone, setPendingByZone] = useState<PendingByZone[]>([]);
  const [riders, setRiders] = useState<RiderAvailability[]>([]);
  const [failedDeliveries, setFailedDeliveries] = useState<FailedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsRes, ridersRes, failedRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/riders"),
          fetch("/api/deliveries?status=failed"),
        ]);

        if (!statsRes.ok) throw new Error("Failed to load stats");
        if (!ridersRes.ok) throw new Error("Failed to load riders");
        if (!failedRes.ok) throw new Error("Failed to load failed deliveries");

        const stats = await statsRes.json();
        const ridersData = await ridersRes.json();
        const failedData = await failedRes.json();

        // Transform pendingByZone from stats
        const zoneNames: Record<string, string> = {
          Z1: "Velachery",
          Z2: "Adyar",
          Z3: "Anna Nagar",
          Z4: "T Nagar",
          Z5: "Tambaram",
        };
        const pendingZones = Object.entries(stats.pendingByZone || {}).map(([zone_id, count]) => ({
          zone_id,
          zone_name: zoneNames[zone_id] || zone_id,
          count: count as number,
        }));
        setPendingByZone(pendingZones);

        // Transform riders
        const availableRiders = (ridersData.riders || [])
          .filter((r: any) => r.has_shift_today && r.is_active)
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            zone: r.home_zone,
            vehicle: r.vehicle,
            capacity: r.capacity,
            active_count: r.active_count,
            remaining: r.remaining,
            has_shift_today: r.has_shift_today,
          }));
        setRiders(availableRiders);

        // Transform failed deliveries
        setFailedDeliveries(failedData.deliveries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getCapacityColor = (active: number, capacity: number) => {
    const pct = capacity > 0 ? (active / capacity) * 100 : 0;
    if (pct >= 81) return "bg-red-500";
    if (pct >= 51) return "bg-amber-500";
    return "bg-green-500";
  };

  const getCapacityWidth = (active: number, capacity: number) => {
    return capacity > 0 ? Math.min(100, (active / capacity) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Assignments by Zone */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-slate-900 font-semibold text-lg mb-4">Pending Assignments by Zone</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {pendingByZone.map((zone) => (
            <div
              key={zone.zone_id}
              className={`rounded-lg p-4 text-center ${zone.count > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50 border border-slate-200"}`}
            >
              <p className="text-slate-500 text-sm font-medium">{zone.zone_name}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{zone.count}</p>
              <p className="text-xs text-slate-500 mt-1">deliveries</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rider Availability */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-slate-900 font-semibold text-lg mb-4">Rider Availability (On Shift Today)</h2>
        {riders.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No riders on shift today</p>
        ) : (
          <div className="space-y-3">
            {riders.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {r.name.split(" ")[0][0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.zone} · {r.vehicle}</p>
                </div>
                <div className="w-40">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getCapacityColor(r.active_count, r.capacity)} transition-all duration-300`}
                      style={{ width: `${getCapacityWidth(r.active_count, r.capacity)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 text-right mt-1">{r.active_count}/{r.capacity}</p>
                </div>
                <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">On Shift</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Failed Deliveries Requiring Attention */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-slate-900 font-semibold text-lg mb-4">Failed Deliveries Requiring Attention</h2>
        {failedDeliveries.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No failed deliveries</p>
        ) : (
          <div className="space-y-2">
            {failedDeliveries.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{d.order_ref} — {d.customer_name}</p>
                  <p className="text-xs text-slate-500">{d.zone_id} · {d.delivery_date} · {d.time_window} · {d.attempts}/3 attempts</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.can_reschedule ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {d.can_reschedule ? "Can Reschedule" : "Must Return"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
