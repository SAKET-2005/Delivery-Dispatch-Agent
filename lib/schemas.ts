import { z } from "zod";

/** Shared Zod schemas. Add your own schemas for your problem statement here. */

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .describe("Date in YYYY-MM-DD format");

export const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().min(1).max(4000),
});

export const agentRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// Example: schema for the starter "tasks" REST API
export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  due_date: isoDate.optional(),
});

// -- RouteWise (PS7) Zod schemas ---------------------------------------------

export const ZONE_ID = z.enum(["Z1", "Z2", "Z3", "Z4", "Z5"]);
export const DELIVERY_STATUS = z.enum([
  "pending",
  "assigned",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
]);
export const TIME_WINDOW = z.enum(["morning", "afternoon", "evening"]);
export const VEHICLE_TYPE = z.enum(["bike", "scooter", "van"]);
export const DELIVERY_ATTEMPT_OUTCOME = z.enum([
  "delivered",
  "customer_not_home",
  "wrong_address",
  "refused",
  "rescheduled",
]);

// -- API response schemas ----------------------------------------------------

export const zoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  pincodes: z.string(),
});

export const riderSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  home_zone: z.string(),
  vehicle: z.string(),
  capacity: z.number(),
  is_active: z.boolean(),
});

export const riderShiftSchema = z.object({
  id: z.number(),
  rider_id: z.string(),
  shift_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

export const deliverySchema = z.object({
  id: z.number(),
  order_ref: z.string(),
  customer_name: z.string(),
  address: z.string(),
  zone_id: z.string(),
  parcel_size: z.string(),
  is_cod: z.boolean(),
  cod_amount: z.number(),
  delivery_date: z.string(),
  time_window: z.string(),
  rider_id: z.string().nullable(),
  status: z.string(),
  attempts: z.number(),
  created_at: z.string(),
});

export const deliveryAttemptSchema = z.object({
  id: z.number(),
  delivery_id: z.number(),
  rider_id: z.string(),
  attempted_at: z.string(),
  outcome: z.string(),
  note: z.string().nullable(),
});

// -- API request/response schemas --------------------------------------------

export const getPendingDeliveriesArgs = z.object({
  zone_id: ZONE_ID.optional(),
  delivery_date: isoDate.optional(),
  time_window: TIME_WINDOW.optional(),
});

export const getAvailableRidersArgs = z.object({
  zone_id: ZONE_ID.optional(),
  date: isoDate,
});

export const getRiderLoadArgs = z.object({
  rider_id: z.string(),
  date: isoDate,
});

export const assignDeliveryArgs = z.object({
  delivery_id: z.number(),
  rider_id: z.string(),
});

export const rescheduleDeliveryArgs = z.object({
  delivery_id: z.number(),
  new_date: isoDate,
  time_window: TIME_WINDOW,
});

export const getFailedDeliveriesArgs = z.object({
  zone_id: ZONE_ID.optional(),
  date: isoDate.optional(),
});

// -- Exported types ----------------------------------------------------------

export type Zone = z.infer<typeof zoneSchema>;
export type Rider = z.infer<typeof riderSchema>;
export type RiderShift = z.infer<typeof riderShiftSchema>;
export type Delivery = z.infer<typeof deliverySchema>;
export type DeliveryAttempt = z.infer<typeof deliveryAttemptSchema>;

export type GetPendingDeliveriesArgs = z.infer<typeof getPendingDeliveriesArgs>;
export type GetAvailableRidersArgs = z.infer<typeof getAvailableRidersArgs>;
export type GetRiderLoadArgs = z.infer<typeof getRiderLoadArgs>;
export type AssignDeliveryArgs = z.infer<typeof assignDeliveryArgs>;
export type RescheduleDeliveryArgs = z.infer<typeof rescheduleDeliveryArgs>;
export type GetFailedDeliveriesArgs = z.infer<typeof getFailedDeliveriesArgs>;

