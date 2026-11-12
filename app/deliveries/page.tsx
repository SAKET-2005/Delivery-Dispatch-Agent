"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Search, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBanner, LoadingBlock, StatusBadge } from "@/components/ui/Primitives";
import { api, Delivery, formatSchedule, STATUS_LABELS, ZONES } from "@/lib/types";

const statuses = ["all", "pending", "assigned", "out_for_delivery", "delivered", "failed", "returned"];

export default function DeliveriesPage() {
  const [items, setItems] = useState<Delivery[]>([]);
  const [status, setStatus] = useState("all");
  const [zone, setZone] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | number | null>(null);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("status");
    if (initial && statuses.includes(initial)) setStatus(initial);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const q = new URLSearchParams();
    if (status !== "all") q.set("status", status);
    if (zone) q.set("zone_id", zone);
    if (date) q.set("date", date);
    try {
      const data = await api<{ deliveries: Delivery[] }>(
        `/api/deliveries${q.size ? `?${q.toString()}` : ""}`
      );
      setItems(data.deliveries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load deliveries.");
    } finally {
      setLoading(false);
    }
  }, [status, zone, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter((d) =>
        `${d.order_ref || ""} ${d.customer || d.customer_name || ""} ${d.address || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [items, search]
  );

  async function update(id: string | number, next: string) {
    setBusy(id);
    setError("");
    try {
      await api("/api/deliveries", {
        method: "PATCH",
        body: JSON.stringify({ id, status: next }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update delivery.");
    } finally {
      setBusy(null);
    }
  }

  const controls = (d: Delivery) => (
    <div className="delivery-card-actions">
      {["assigned", "out_for_delivery"].includes(d.status) && (
        <>
          <button
            className="btn"
            disabled={busy === d.id}
            onClick={() => void update(d.id, "delivered")}
          >
            <Check size={13} /> Mark delivered
          </button>
          <button
            className="btn btn-danger"
            disabled={busy === d.id}
            onClick={() => void update(d.id, "failed")}
          >
            <X size={13} /> Mark failed
          </button>
        </>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Parcel control</div>
            <h1 className="page-title">Deliveries</h1>
            <p className="page-subtitle">Search, review and update today’s parcel flow.</p>
          </div>
          <button className="btn" onClick={() => void load()}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        <div className="panel">
          <div className="panel-head" style={{ display: "block" }}>
            <div className="filter-row" style={{ marginBottom: 12 }}>
              {statuses.map((s) => (
                <button
                  key={s}
                  className={`filter-pill ${status === s ? "active" : ""}`}
                  onClick={() => setStatus(s)}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s] || s}
                </button>
              ))}
            </div>
            <div className="toolbar">
              <label className="toolbar" style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: 10, color: "#8995a2" }} />
                <input
                  className="field search-field"
                  style={{ paddingLeft: 30, width: "100%" }}
                  placeholder="Search order, customer or address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <select className="field" value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">All zones</option>
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.id} · {z.name}
                  </option>
                ))}
              </select>
              <input
                className="field"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Filter by date"
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 15 }}>
              <LoadingBlock />
            </div>
          ) : (
            <>
              <div className="table-wrap desktop-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order / customer</th>
                      <th>Address</th>
                      <th>Zone</th>
                      <th>Rider</th>
                      <th>Scheduled</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => (
                      <tr key={d.id} style={{ "--i": i } as React.CSSProperties}>
                        <td>
                          <div className="primary-cell">{d.order_ref || d.id}</div>
                          <div className="secondary-cell">{d.customer || d.customer_name || "—"}</div>
                        </td>
                        <td style={{ maxWidth: 220 }}>{d.address || "—"}</td>
                        <td>{d.zone_id || "—"}</td>
                        <td>{d.rider_name || d.rider_id || "—"}</td>
                        <td style={{ textTransform: "capitalize" }}>{formatSchedule(d)}</td>
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td>
                          {["assigned", "out_for_delivery"].includes(d.status) ? (
                            <div style={{ display: "flex", gap: 5 }}>
                              <button
                                className="btn"
                                disabled={busy === d.id}
                                onClick={() => void update(d.id, "delivered")}
                              >
                                Delivered
                              </button>
                              <button
                                className="btn btn-danger"
                                disabled={busy === d.id}
                                onClick={() => void update(d.id, "failed")}
                              >
                                Failed
                              </button>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filtered.length && <div className="empty-state">No deliveries match your filters.</div>}
              </div>

              <div className="mobile-table-cards" style={{ padding: 14 }}>
                {filtered.map((d) => (
                  <article className="delivery-card" key={d.id}>
                    <div className="delivery-card-top">
                      <div>
                        <div className="primary-cell">{d.order_ref || d.id}</div>
                        <div className="secondary-cell">{d.customer || d.customer_name || "—"}</div>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="secondary-cell" style={{ marginTop: 10 }}>
                      {d.address || "—"}
                    </div>
                    <div className="secondary-cell" style={{ marginTop: 5, textTransform: "capitalize" }}>
                      {d.zone_id || "—"} · {d.rider_name || d.rider_id || "Unassigned"} ·{" "}
                      {formatSchedule(d)}
                    </div>
                    {controls(d)}
                  </article>
                ))}
                {!filtered.length && <div className="empty-state">No deliveries match your filters.</div>}
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: 10, color: "#8a96a3", fontSize: 10 }}>
          {filtered.length} {filtered.length === 1 ? "delivery" : "deliveries"}
        </div>
      </div>
    </AppShell>
  );
}
