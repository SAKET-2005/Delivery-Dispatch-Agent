"use client";

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  assigned: { label: "Assigned", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  out_for_delivery: { label: "Out for Delivery", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered: { label: "Delivered", classes: "bg-green-50 text-green-700 border-green-200" },
  failed: { label: "Failed", classes: "bg-red-50 text-red-700 border-red-200" },
  returned: { label: "Returned", classes: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, classes: "bg-slate-50 text-slate-700 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}
