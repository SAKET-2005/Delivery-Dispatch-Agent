"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Phone, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBanner, LoadingBlock } from "@/components/ui/Primitives";
import { api, money, Rider, ZONES } from "@/lib/types";

const filters = ["all", "on", "off", "inactive"];

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [zone, setZone] = useState("");
  const [shift, setShift] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await api<{ riders: Rider[] }>("/api/riders");
      setRiders(d.riders || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load riders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      riders.filter(
        (r) =>
          (!zone || r.home_zone === zone) &&
          (shift === "all" ||
            (shift === "on" && r.is_active && r.has_shift_today) ||
            (shift === "off" && r.is_active && !r.has_shift_today) ||
            (shift === "inactive" && !r.is_active))
      ),
    [riders, zone, shift]
  );

  return (
    <AppShell>
      <div className="page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Fleet and capacity</div>
            <h1 className="page-title">Riders</h1>
            <p className="page-subtitle">Shift coverage, delivery capacity and COD collected.</p>
          </div>
          <button className="btn" onClick={() => void load()}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {error && <ErrorBanner message={error} onRetry={() => void load()} />}

        <div className="panel">
          <div className="panel-head" style={{ display: "block" }}>
            <div className="filter-row" style={{ marginBottom: 12 }}>
              {filters.map((f) => (
                <button
                  className={`filter-pill ${shift === f ? "active" : ""}`}
                  key={f}
                  onClick={() => setShift(f)}
                >
                  {
                    (
                      {
                        all: "All riders",
                        on: "On Shift Today",
                        off: "Off Today",
                        inactive: "Inactive",
                      } as Record<string, string>
                    )[f]
                  }
                </button>
              ))}
            </div>
            <div className="toolbar">
              <select className="field" value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">All zones</option>
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.id} · {z.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 10, color: "#8793a0" }}>{visible.length} riders</span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 15 }}>
              <LoadingBlock />
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Home zone</th>
                    <th>Vehicle</th>
                    <th>Shift</th>
                    <th>Capacity</th>
                    <th>COD collected</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => {
                    const used = r.capacity ? Math.min(100, (r.active_count / r.capacity) * 100) : 0;
                    const color = used > 80 ? "#d55454" : used >= 50 ? "#d59a2a" : "#22a27d";
                    return (
                      <tr key={r.id} style={{ "--i": i } as React.CSSProperties}>
                        <td>
                          <div className="primary-cell">{r.name}</div>
                          <div className="secondary-cell">{r.id}</div>
                        </td>
                        <td>{r.home_zone}</td>
                        <td style={{ textTransform: "capitalize" }}>{r.vehicle}</td>
                        <td>
                          <span
                            className={`badge ${
                              !r.is_active
                                ? "badge-failed"
                                : r.has_shift_today
                                ? "badge-delivered"
                                : "badge-pending"
                            }`}
                          >
                            {!r.is_active ? "Inactive" : r.has_shift_today ? "On shift" : "Off today"}
                          </span>
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <div className="rider-cap" style={{ width: "100%" }}>
                            <div className="rider-cap-label">
                              <span>{r.remaining} remaining</span>
                              <span>
                                {r.active_count}/{r.capacity}
                              </span>
                            </div>
                            <div className="capacity-track">
                              <div
                                className="capacity-fill"
                                style={{ "--width": `${used}%`, "--fill": color } as React.CSSProperties}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="tabular-nums" style={{ fontWeight: 650 }}>
                          {money(r.cod_total)}
                        </td>
                        <td>
                          <a className="btn" href={`tel:${r.phone}`}>
                            <Phone size={12} /> Call
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visible.length && <div className="empty-state">No riders match this filter.</div>}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
