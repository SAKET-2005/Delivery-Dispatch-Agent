import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const zone_id = searchParams.get("zone_id");
  const date = searchParams.get("date");

  const supabase = getSupabase();

  let query = supabase
    .from("deliveries")
    .select(
      `
      id, order_ref, customer_name, address, zone_id, parcel_size,
      is_cod, cod_amount, delivery_date, time_window, rider_id,
      status, attempts, created_at,
      zones(name),
      riders(name)
    `
    )
    .order("delivery_date", { ascending: true })
    .order("time_window")
    .order("id");

  if (status) query = query.eq("status", status);
  if (zone_id) query = query.eq("zone_id", zone_id);
  if (date) query = query.eq("delivery_date", date);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deliveries = (data ?? []).map((d: any) => ({
    ...d,
    zone_name: (d.zones as { name: string } | null)?.name ?? null,
    rider_name: (d.riders as { name: string } | null)?.name ?? null,
  }));

  return NextResponse.json({ deliveries });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.id || !body.status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const { id, status, outcome, note } = body;
  const supabase = getSupabase();

  const { data: d, error: fetchErr } = await supabase
    .from("deliveries")
    .select("rider_id, attempts")
    .eq("id", id)
    .single();

  if (fetchErr || !d) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "failed") {
    updateData.attempts = Math.min(3, (d.attempts || 0) + 1);
  }

  const { error: updateErr } = await supabase
    .from("deliveries")
    .update(updateData)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  if (d.rider_id && (status === "delivered" || status === "failed")) {
    await supabase.from("delivery_attempts").insert({
      delivery_id: id,
      rider_id: d.rider_id,
      outcome: outcome || (status === "delivered" ? "delivered" : "customer_not_home"),
      note: note || (status === "delivered" ? "Handed to customer" : "Attempt failed"),
    });
  }

  return NextResponse.json({ ok: true, status });
}
