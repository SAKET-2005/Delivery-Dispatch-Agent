"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Package, Truck, Users } from "lucide-react";
import { STATUS_LABELS } from "@/lib/types";

const icons = {
  total: Package,
  pending: Clock3,
  assigned: Users,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  failed: AlertTriangle,
  riders: Activity,
};

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let frame = 0;
    const from = performance.now();
    const duration = 650;
    const tick = (now: number) => {
      const p = Math.min(1, (now - from) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="tabular-nums">{shown.toLocaleString("en-IN")}</span>;
}

export function KpiCard({
  label,
  value,
  detail,
  kind,
  index = 0,
}: {
  label: string;
  value: number;
  detail: string;
  kind: keyof typeof icons;
  index?: number;
}) {
  const Icon = icons[kind];
  return (
    <article className="kpi-card" style={{ "--i": index } as React.CSSProperties}>
      <div className="kpi-top">
        <span>{label}</span>
        <span className="kpi-icon">
          <Icon size={15} />
        </span>
      </div>
      <div className="kpi-value">
        <CountUp value={value} />
      </div>
      <div className="kpi-foot">{detail}</div>
    </article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABELS[status] || status.replaceAll("_", " ")}
    </span>
  );
}

export function LoadingBlock() {
  return (
    <div className="panel" style={{ padding: 20, display: "grid", gap: 13 }}>
      <div className="skeleton" style={{ width: "35%" }} />
      <div className="skeleton" style={{ width: "100%" }} />
      <div className="skeleton" style={{ width: "70%" }} />
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-banner">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-quiet" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

