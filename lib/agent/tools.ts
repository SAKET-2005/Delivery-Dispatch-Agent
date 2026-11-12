import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { isoDate } from "../schemas";
import {
  ZONE_ID,
  TIME_WINDOW,
  getPendingDeliveriesArgs,
  getAvailableRidersArgs,
  getRiderLoadArgs,
  assignDeliveryArgs,
  rescheduleDeliveryArgs,
  getFailedDeliveriesArgs,
} from "../schemas";

const getPendingDeliveries = defineTool({
  name: "getPendingDeliveries",
  description: `Use this when the dispatcher asks about pending, unassigned, or waiting deliveries.
Returns deliveries with status 'pending'. Optionally filter by zone, delivery date, or time window (morning, afternoon, or evening).`,
  schema: getPendingDeliveriesArgs,
  run: async ({ zone_id, delivery_date, time_window }) => {
    let query = getSupabase()
      .from("deliveries")
      .select(
        "id, order_ref, customer_name, address, zone_id, parcel_size, is_cod, cod_amount, delivery_date, time_window, attempts"
      )
      .eq("status", "pending")
      .order("delivery_date")
      .order("time_window")
      .order("id");
    if (delivery_date) query = query.eq("delivery_date", delivery_date);
    if (zone_id) query = query.eq("zone_id", zone_id);
    if (time_window) query = query.eq("time_window", time_window);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { count: data.length, deliveries: data };
  },
});

const getAvailableRiders = defineTool({
  name: "getAvailableRiders",
  description: `Use this when you need to find riders who can accept deliveries.
Returns riders who are active and have a shift on the given date (optionally filtered by zone).
Also returns their current load vs capacity so you can see who has room.`,
  schema: getAvailableRidersArgs,
  run: async ({ zone_id, date }) => {
    let query = getSupabase()
      .from("riders")
      .select(
        `
        id, name, vehicle, capacity, home_zone,
        rider_shifts!inner(shift_date, start_time, end_time)
      `
      )
      .eq("is_active", true)
      .eq("rider_shifts.shift_date", date);
    if (zone_id) query = query.eq("home_zone", zone_id);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const riders = await Promise.all(
      (data ?? []).map(async (r: any) => {
        const { count, error: countError } = await getSupabase()
          .from("deliveries")
          .select("*", { count: "exact", head: true })
          .eq("rider_id", r.id)
          .in("status", ["assigned", "out_for_delivery"]);
        if (countError) throw new Error(countError.message);

        const shift = Array.isArray(r.rider_shifts) ? r.rider_shifts[0] : r.rider_shifts;
        const activeCount = count ?? 0;
        return {
          id: r.id,
          name: r.name,
          vehicle: r.vehicle,
          zone: r.home_zone,
          capacity: r.capacity,
          active_count: activeCount,
          remaining: r.capacity - activeCount,
          shift,
        };
      })
    );

    return { count: riders.length, riders };
  },
});

const getRiderLoad = defineTool({
  name: "getRiderLoad",
  description: `Use this to check how many deliveries a specific rider currently has active,
and how much capacity they have left. Call this before assigning to confirm space is available.`,
  schema: getRiderLoadArgs,
  run: async ({ rider_id, date }) => {
    const { data: rider, error: rErr } = await getSupabase()
      .from("riders")
      .select("id, name, capacity, home_zone, is_active")
      .eq("id", rider_id)
      .single();
    if (rErr) throw new Error(rErr.message);
    if (!rider) throw new Error(`Rider ${rider_id} not found`);

    const { count: active, error: activeError } = await getSupabase()
      .from("deliveries")
      .select("*", { count: "exact", head: true })
      .eq("rider_id", rider_id)
      .in("status", ["assigned", "out_for_delivery"]);
    if (activeError) throw new Error(activeError.message);

    const { data: shift, error: shiftError } = await getSupabase()
      .from("rider_shifts")
      .select("shift_date, start_time, end_time")
      .eq("rider_id", rider_id)
      .eq("shift_date", date)
      .maybeSingle();
    if (shiftError) throw new Error(shiftError.message);

    const activeCount = active ?? 0;
    return {
      rider_id: rider.id,
      name: rider.name,
      zone: rider.home_zone,
      is_active: rider.is_active,
      has_shift_today: !!shift,
      shift: shift ?? null,
      capacity: rider.capacity,
      active_count: activeCount,
      remaining: rider.capacity - activeCount,
    };
  },
});

const assignDelivery = defineTool({
  name: "assignDelivery",
  description: `Use this to assign a pending delivery to a rider.
The database will validate zone match, shift, capacity, and status automatically.
If the assignment fails, the error message will explain why.
You must have the delivery id (a number) and rider id (like R01) before calling this.`,
  writes: true,
  schema: assignDeliveryArgs,
  run: async ({ delivery_id, rider_id }) => {
    const { data, error } = await getSupabase().rpc("assign_delivery", {
      p_delivery_id: delivery_id,
      p_rider_id: rider_id,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

const rescheduleDelivery = defineTool({
  name: "rescheduleDelivery",
  description: `Use this to reschedule a failed delivery to a new date and time window.
Only deliveries with status 'failed' and fewer than 3 attempts can be rescheduled.
After rescheduling, the delivery status becomes 'pending' and must be assigned again.
If a delivery already has 3 attempts, tell the dispatcher to mark it as returned instead.`,
  writes: true,
  schema: rescheduleDeliveryArgs,
  run: async ({ delivery_id, new_date, time_window }) => {
    const { data, error } = await getSupabase().rpc("reschedule_delivery", {
      p_delivery_id: delivery_id,
      p_new_date: new_date,
      p_time_window: time_window,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

const getFailedDeliveries = defineTool({
  name: "getFailedDeliveries",
  description: `Use this when the dispatcher asks about failed deliveries that need attention.
Returns failed deliveries with their attempt count and history.
Optionally filter by zone. Deliveries with 3 attempts cannot be rescheduled.`,
  schema: getFailedDeliveriesArgs,
  run: async ({ zone_id, date }) => {
    let query = getSupabase()
      .from("deliveries")
      .select(
        `
        id, order_ref, customer_name, address, zone_id,
        delivery_date, time_window, attempts, rider_id,
        riders(name)
      `
      )
      .eq("status", "failed")
      .order("delivery_date", { ascending: false })
      .order("id");
    if (zone_id) query = query.eq("zone_id", zone_id);
    if (date) query = query.eq("delivery_date", date);

    const { data, error } = await query.limit(30);
    if (error) throw new Error(error.message);

    return {
      count: (data ?? []).length,
      deliveries: (data ?? []).map((d: any) => ({
        ...d,
        rider_name: (d.riders as { name: string } | null)?.name ?? null,
        can_reschedule: d.attempts < 3,
      })),
    };
  },
});

export const tools: AgentTool[] = [
  getPendingDeliveries,
  getAvailableRiders,
  getRiderLoad,
  assignDelivery,
  rescheduleDelivery,
  getFailedDeliveries,
];