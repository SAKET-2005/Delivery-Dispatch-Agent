import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zone_id = searchParams.get("zone_id");
  const date = searchParams.get("date");

  const supabase = getSupabase();

  let query = supabase
    .from("riders")
    .select(
      `
      id, name, phone, home_zone, vehicle, capacity, is_active,
      rider_shifts!left(shift_date, start_time, end_time)
    `
    )
    .order("home_zone")
    .order("id");

  if (zone_id) query = query.eq("home_zone", zone_id);

  const { data: riders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // For each rider, count active deliveries on the given date
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const ridersWithLoad = await Promise.all(
    (riders ?? []).map(async (r: any) => {
      const shift = Array.isArray(r.rider_shifts)
        ? r.rider_shifts.find((s: any) => s.shift_date === targetDate) ?? null
        : r.rider_shifts?.shift_date === targetDate
        ? r.rider_shifts
        : null;

      const { count: activeCount, error: countError } = await supabase
        .from("deliveries")
        .select("*", { count: "exact", head: true })
        .eq("rider_id", r.id)
        .in("status", ["assigned", "out_for_delivery"])
        .eq("delivery_date", targetDate);

      // Daily COD summary for rider
      const { data: codDeliveries } = await supabase
        .from("deliveries")
        .select("cod_amount")
        .eq("rider_id", r.id)
        .eq("is_cod", true)
        .eq("delivery_date", targetDate);

      const codTotal = (codDeliveries ?? []).reduce(
        (sum: number, item: { cod_amount?: number }) => sum + (item.cod_amount || 0),
        0
      );

      if (countError) {
        return {
          ...r,
          rider_shifts: undefined,
          shift,
          active_count: 0,
          remaining: r.capacity,
          has_shift_today: !!shift,
          cod_total: codTotal,
        };
      }

      const active = countError ? 0 : activeCount ?? 0;
      return {
        ...r,
        rider_shifts: undefined,
        shift,
        active_count: active,
        remaining: r.capacity - active,
        has_shift_today: !!shift,
        cod_total: codTotal,
      };
    })
  );

  return NextResponse.json({ riders: ridersWithLoad });
}
