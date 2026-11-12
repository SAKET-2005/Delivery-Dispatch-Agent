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
