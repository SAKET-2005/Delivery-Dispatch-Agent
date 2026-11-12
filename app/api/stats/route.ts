import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { todayInIndia } from "@/lib/dates";

export const runtime = "nodejs";

export async function GET() {
  const today = todayInIndia();

  const supabase = getSupabase();

  // Get delivery counts by status for today
  const { data: deliveries, error: deliveriesError } = await supabase
    .from("deliveries")
    .select("status")
    .eq("delivery_date", today);

  if (deliveriesError) {
    return NextResponse.json({ error: deliveriesError.message }, { status: 500 });
  }

  const counts = {
    total: deliveries?.length ?? 0,
    pending: 0,
    assigned: 0,
    out_for_delivery: 0,
    delivered: 0,
    failed: 0,
  };

  for (const d of deliveries ?? []) {
    if (d.status in counts) {
      counts[d.status as keyof typeof counts]++;
    }
  }

  // Get pending counts per zone
  const { data: pendingByZoneData, error: zoneError } = await supabase
    .from("deliveries")
    .select("zone_id")
    .eq("delivery_date", today)
    .eq("status", "pending");

  if (zoneError) {
    return NextResponse.json({ error: zoneError.message }, { status: 500 });
  }

  const pendingByZone: Record<string, number> = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
  for (const d of pendingByZoneData ?? []) {
    if (d.zone_id in pendingByZone) {
      pendingByZone[d.zone_id]++;
    }
  }

  // Get riders on shift today
  const { data: shifts, error: shiftsError } = await supabase
    .from("rider_shifts")
    .select("rider_id")
    .eq("shift_date", today);

  if (shiftsError) {
    return NextResponse.json({ error: shiftsError.message }, { status: 500 });
  }

  const ridersOnShift = shifts?.length ?? 0;

  // Get active riders (active + on shift)
  const riderIds = shifts?.map((s) => s.rider_id) ?? [];
  let activeRiders = 0;
  if (riderIds.length > 0) {
    const { data: activeRidersData, error: activeError } = await supabase
      .from("riders")
      .select("id")
      .eq("is_active", true)
      .in("id", riderIds);
    if (activeError) {
      return NextResponse.json({ error: activeError.message }, { status: 500 });
    }
    activeRiders = activeRidersData?.length ?? 0;
  }

  return NextResponse.json({
    ...counts,
    pendingByZone,
    ridersOnShift,
    activeRiders,
  });
}
