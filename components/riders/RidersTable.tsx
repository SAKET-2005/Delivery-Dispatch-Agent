"use client";

import { useEffect, useState } from "react";
import CapacityBar from "./CapacityBar";

interface Rider {
  id: string;
  name: string;
  phone: string;
  home_zone: string;
  vehicle: string;
  capacity: number;
  is_active: boolean;
  shift: { shift_date: string; start_time: string; end_time: string } | null;
  active_count: number;
  remaining: number;
  has_shift_today: boolean;
}

interface RidersTableProps {
  refreshKey: number;
}

const ZONE_NAMES: Record<string, string> = {
  Z1: "Velachery",
  Z2: "Adyar",
  Z3: "Anna Nagar",
  Z4: "T Nagar",
  Z5: "Tambaram",
};

const VEHICLE_ICONS: Record<string, string> = {
  bike: "🚲",
  scooter: "🛵",
  van: "🚐",
};

export default function RidersTable({ refreshKey }: RidersTableProps) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [internalKey, setInternalKey] = useState(0);

  useEffect(() => {
    async function fetchRiders() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/riders");
        if (!res.ok) throw new Error("Failed to load riders");
        const data = await res.json();
        setRiders(data.riders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load riders");
      } finally {
        setLoading(false);
      }
    }
    fetchRiders();
  }, [refreshKey, internalKey]);

  const filteredRiders = riders.filter((r) => {
    if (zoneFilter && r.home_zone !== zoneFilter) return false;
    if (shiftFilter === "on_shift" && !r.has_shift_today) return false;
    if (shiftFilter === "off_shift" && r.has_shift_today) return false;
    if (shiftFilter === "inactive" && r.is_active) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Riders</h2>
        </div>
        <div className="animate-pulse space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
        <button onClick={() => setInternalKey((k) => k + 1)} className="ml-4 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="font-semibold">Riders</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="">All Zones</option>
            <option value="Z1">Z1 Velachery</option>
            <option value="Z2">Z2 Adyar</option>
            <option value="Z3">Z3 Anna Nagar</option>
            <option value="Z4">Z4 T Nagar</option>
            <option value="Z5">Z5 Tambaram</option>
          </select>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="">All Shifts</option>
            <option value="on_shift">On Shift Today</option>
            <option value="off_shift">Off Today</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Shift Today</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Load</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRiders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No riders match the current filters.
                </td>
              </tr>
            ) : (
              filteredRiders.map((r) => (
                <tr key={r.id} className={`hover:bg-slate-50 ${!r.is_active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-600">{r.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{ZONE_NAMES[r.home_zone] || r.home_zone}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 flex items-center gap-1">
                    {VEHICLE_ICONS[r.vehicle] || r.vehicle} {r.vehicle}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.has_shift_today && r.shift ? (
                      <span className="text-slate-700">{r.shift.start_time} – {r.shift.end_time}</span>
                    ) : r.has_shift_today ? (
                      <span className="text-slate-700">On shift</span>
                    ) : !r.is_active ? (
                      <span className="text-red-600">Inactive</span>
                    ) : (
                      <span className="text-slate-500">Off today</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.has_shift_today ? (
                      <CapacityBar active={r.active_count} capacity={r.capacity} />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.has_shift_today && r.is_active ? (
                      <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">On Shift</span>
                    ) : !r.is_active ? (
                      <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs">Inactive</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs">Off Today</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
