"use client";

import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";

interface Delivery {
  id: number;
  order_ref: string;
  customer_name: string;
  address: string;
  zone_id: string;
  parcel_size: string;
  is_cod: boolean;
  cod_amount: number;
  delivery_date: string;
  time_window: string;
  rider_id: string | null;
  status: string;
  attempts: number;
  created_at: string;
  zone_name: string | null;
  rider_name: string | null;
}

interface DeliveriesTableProps {
  refreshKey: number;
  initialFilters?: { status?: string; zone_id?: string; date?: string };
}

export default function DeliveriesTable({ refreshKey, initialFilters }: DeliveriesTableProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: initialFilters?.status || "",
    zone_id: initialFilters?.zone_id || "",
    date: initialFilters?.date || "",
    search: "",
  });

  useEffect(() => {
    async function fetchDeliveries() {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (filters.status) params.set("status", filters.status);
        if (filters.zone_id) params.set("zone_id", filters.zone_id);
        if (filters.date) params.set("date", filters.date);
        const res = await fetch(`/api/deliveries?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load deliveries");
        const data = await res.json();
        setDeliveries(data.deliveries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deliveries");
      } finally {
        setLoading(false);
      }
    }
    fetchDeliveries();
  }, [refreshKey, filters.status, filters.zone_id, filters.date]);

  async function handleStatusUpdate(id: number, status: string) {
    try {
      const res = await fetch("/api/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setDeliveries((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  attempts: status === "failed" ? Math.min(3, item.attempts + 1) : item.attempts,
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Failed to update delivery status:", err);
    }
  }

  const zoneNames: Record<string, string> = {
    Z1: "Velachery",
    Z2: "Adyar",
    Z3: "Anna Nagar",
    Z4: "T Nagar",
    Z5: "Tambaram",
  };

  const filteredDeliveries = deliveries.filter((d) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        d.order_ref.toLowerCase().includes(search) ||
        d.customer_name.toLowerCase().includes(search) ||
        d.address.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const statusTabs = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "assigned", label: "Assigned" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "failed", label: "Failed" },
    { value: "returned", label: "Returned" },
  ];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Deliveries</h2>
        </div>
        <div className="animate-pulse space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
        <button onClick={() => setFilters({ ...filters })} className="ml-4 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="font-semibold">Deliveries</h2>
          <input
            type="text"
            placeholder="Search order, customer, address..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilters({ ...filters, status: tab.value })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.status === tab.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.zone_id}
            onChange={(e) => setFilters({ ...filters, zone_id: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            <option value="">All Zones</option>
            <option value="Z1">Z1 Velachery</option>
            <option value="Z2">Z2 Adyar</option>
            <option value="Z3">Z3 Anna Nagar</option>
            <option value="Z4">Z4 T Nagar</option>
            <option value="Z5">Z5 Tambaram</option>
          </select>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order Ref</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Window</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Attempts</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No deliveries found.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-900">{d.order_ref}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{d.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{zoneNames[d.zone_id] || d.zone_id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{d.delivery_date}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 capitalize">{d.time_window}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{d.rider_name || "—"}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-700">{d.attempts}/3</td>
                  <td className="px-4 py-3 text-sm">
                    {d.status === "assigned" || d.status === "out_for_delivery" ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleStatusUpdate(d.id, "delivered")}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          ✓ Delivered
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(d.id, "failed")}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                        >
                          ✕ Failed
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filteredDeliveries.length === 0 && deliveries.length > 0 && (
        <div className="px-4 py-3 text-sm text-slate-500 text-center">
          No deliveries match your search.
        </div>
      )}
    </div>
  );
}
