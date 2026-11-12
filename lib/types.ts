export type ZoneId = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

export const ZONES: { id: ZoneId; name: string }[] = [
  { id: "Z1", name: "Velachery" },
  { id: "Z2", name: "Adyar" },
  { id: "Z3", name: "Anna Nagar" },
  { id: "Z4", name: "T Nagar" },
  { id: "Z5", name: "Tambaram" },
];

export type Stats = {
  total: number;
  pending: number;
  assigned: number;
  out_for_delivery: number;
  delivered: number;
  failed: number;
  pendingByZone: Record<ZoneId, number>;
  ridersOnShift: number;
  activeRiders: number;
};

export type Rider = {
  id: string;
  name: string;
  phone: string;
  home_zone: ZoneId;
  vehicle: string;
  capacity: number;
  is_active: boolean;
  shift: { shift_date: string; start_time: string; end_time: string } | string | null;
  active_count: number;
  remaining: number;
  has_shift_today: boolean;
  cod_total: number;
};

export type Delivery = {
  id: string | number;
  order_ref?: string;
  customer?: string;
  customer_name?: string;
  address?: string;
  zone_id?: ZoneId;
  status: string;
  attempts?: number;
  delivery_date?: string;
  time_window?: string;
  scheduled_at?: string;
  rider_name?: string | null;
  rider_id?: string | null;
  phone?: string;
};

export type AgentStep = {
  tool: string;
  args: unknown;
  ok: boolean;
  writes: boolean;
  result?: unknown;
  error?: string;
};

export type ActivityItem = {
  id: string;
  timestamp: string;
  userMessage: string;
  agentReply: string;
  steps: AgentStep[];
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Returned",
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data as T;
}

export function readActivity(): ActivityItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("routewise_activity") || "[]") as ActivityItem[];
  } catch {
    return [];
  }
}

export function saveActivity(item: ActivityItem) {
  const next = [item, ...readActivity()].slice(0, 50);
  localStorage.setItem("routewise_activity", JSON.stringify(next));
  window.dispatchEvent(new Event("routewise:activity"));
}

export const money = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatSchedule = (d: Pick<Delivery, "delivery_date" | "time_window" | "scheduled_at">) => {
  if (d.delivery_date) {
    const dateLabel = new Date(`${d.delivery_date}T00:00:00`).toLocaleDateString("en-IN", {
      dateStyle: "medium",
    });
    return d.time_window ? `${dateLabel} · ${d.time_window}` : dateLabel;
  }
  if (d.scheduled_at) {
    return new Date(d.scheduled_at).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
  return "—";
};

