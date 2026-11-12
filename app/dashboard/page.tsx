"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBanner, KpiCard, LoadingBlock, StatusBadge } from "@/components/ui/Primitives";
import { api, Delivery, Rider, Stats, ZONES } from "@/lib/types";

function getIndiaHeaderContext() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(now)
  );
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return { weekday, greeting };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [failed, setFailed] = useState<Delivery[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { weekday, greeting } = getIndiaHeaderContext();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, r, f] = await Promise.all([
        api<Stats>("/api/stats"),
        api<{ riders: Rider[] }>("/api/riders"),
        api<{ deliveries: Delivery[] }>("/api/deliveries?status=failed"),
      ]);
      setStats(s);
      setRiders(r.riders || []);
      setFailed(f.deliveries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load hub data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow" suppressHydrationWarning>
              {weekday} · Chennai operations
            </div>
            <h1 className="page-title" suppressHydrationWarning>
              {greeting}, Anitha
            </h1>
            <p className="page-subtitle">Here’s the pulse of your delivery hub today.</p>
          </div>
          <button className="btn" onClick={() => void load()}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        {loading && !stats ? (
          <LoadingBlock />
        ) : (
          stats && (
            <>
              <section className="kpi-grid">
                <KpiCard label="Total parcels" value={stats.total} detail="Today's delivery volume" kind="total" index={0} />
                <KpiCard label="Pending assignment" value={stats.pending} detail="Waiting for a rider" kind="pending" index={1} />
                <KpiCard label="Assigned" value={stats.assigned} detail="Matched with a rider" kind="assigned" index={2} />
                <KpiCard label="Out for delivery" value={stats.out_for_delivery} detail="On the road right now" kind="out_for_delivery" index={3} />
                <KpiCard label="Delivered" value={stats.delivered} detail="Completed successfully" kind="delivered" index={4} />
                <KpiCard label="Failed" value={stats.failed} detail="Need attention" kind="failed" index={5} />
                <KpiCard label="Riders on shift" value={stats.ridersOnShift} detail={`${stats.activeRiders} currently active`} kind="riders" index={6} />
              </section>

              <section className="content-grid">
                <article className="panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-title">Pending by zone</div>
                      <div className="panel-hint">Parcels awaiting assignment</div>
                    </div>
                    <span className="badge badge-pending">{stats.pending} pending</span>
                  </div>
                  <div className="panel-body zone-list">
                    {ZONES.map((z, i) => {
                      const count = stats.pendingByZone?.[z.id] || 0;
                      const max = Math.max(1, ...Object.values(stats.pendingByZone || {}));
                      return (
                        <div className="zone-row" key={z.id} style={{ "--i": i } as React.CSSProperties}>
                          <div className="zone-name">
                            <span className="zone-id">{z.id}</span>
                            {z.name}
                          </div>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{ "--width": `${Math.max(2, (count / max) * 100)}%` } as React.CSSProperties}
                            />
                          </div>
                          <div className="zone-count tabular-nums">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-title">Rider availability</div>
                      <div className="panel-hint">Shift capacity at a glance</div>
                    </div>
                    <Link className="btn btn-quiet" href="/riders">
                      All riders <ArrowUpRight size={13} />
                    </Link>
                  </div>
                  <div className="panel-body">
                    {riders
                      .filter((r) => r.is_active)
                      .slice(0, 4)
                      .map((r, i) => {
                        const used = r.capacity ? Math.min(100, (r.active_count / r.capacity) * 100) : 0;
                        const color = used > 80 ? "#d55454" : used >= 50 ? "#d59a2a" : "#22a27d";
                        return (
                          <div className="rider-row" key={r.id}>
                            <div className="rider-initial">
                              {r.name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <div className="rider-detail">
                              <div className="rider-name">{r.name}</div>
                              <div className="rider-meta">
                                {r.home_zone} · {r.remaining} slots free
                              </div>
                            </div>
                            <div className="rider-cap">
                              <div className="rider-cap-label">
                                <span>Load</span>
                                <span>
                                  {r.active_count}/{r.capacity}
                                </span>
                              </div>
                              <div className="capacity-track">
                                <div
                                  className="capacity-fill"
                                  style={
                                    {
                                      "--width": `${used}%`,
                                      "--fill": color,
                                      "--i": i,
                                    } as React.CSSProperties
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {!riders.length && <div className="empty-state">No rider information available.</div>}
                  </div>
                </article>
              </section>

              <section className="panel" style={{ marginTop: 15 }}>
                <div className="panel-head">
                  <div>
                    <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <TriangleAlert size={14} color="#ca8b24" />
                      Failed deliveries needing attention
                    </div>
                    <div className="panel-hint">Review retry eligibility and next steps</div>
                  </div>
                  <Link className="btn btn-quiet" href="/deliveries?status=failed">
                    View deliveries <ArrowUpRight size={13} />
                  </Link>
                </div>

                <div className="table-wrap desktop-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Zone</th>
                        <th>Attempts</th>
                        <th>Status</th>
                        <th>Recommended action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failed.slice(0, 6).map((d, i) => (
                        <tr key={d.id} style={{ "--i": i } as React.CSSProperties}>
                          <td>
                            <div className="primary-cell">{d.order_ref || d.id}</div>
                          </td>
                          <td>{d.customer || d.customer_name || "—"}</td>
                          <td>{d.zone_id || "—"}</td>
                          <td className="tabular-nums">{d.attempts ?? 0}</td>
                          <td>
                            <StatusBadge status="failed" />
                          </td>
                          <td>
                            <span className={`badge ${(d.attempts ?? 0) >= 3 ? "badge-returned" : "badge-assigned"}`}>
                              {(d.attempts ?? 0) >= 3 ? "Must return" : "Can reschedule"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!failed.length && (
                    <div className="empty-state">No failed deliveries to review. Nice work.</div>
                  )}
                </div>

                <div className="mobile-table-cards" style={{ padding: 14 }}>
                  {failed.slice(0, 6).map((d) => (
                    <div className="delivery-card" key={d.id}>
                      <div className="delivery-card-top">
                        <div>
                          <div className="primary-cell">{d.order_ref || d.id}</div>
                          <div className="secondary-cell">
                            {d.customer || d.customer_name || "Customer"} · {d.zone_id || "—"}
                          </div>
                        </div>
                        <StatusBadge status="failed" />
                      </div>
                      <div className="secondary-cell" style={{ marginTop: 10 }}>
                        Attempts: {d.attempts ?? 0} · {(d.attempts ?? 0) >= 3 ? "Must return" : "Can reschedule"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )
        )}
      </div>
    </AppShell>
  );
}
