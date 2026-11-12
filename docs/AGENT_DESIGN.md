# Agent Design — RouteWise

## 1. Overview

RouteWise uses **Gemini Function Calling** as its AI backbone. The dispatcher sends natural-language messages. Gemini reads the tool descriptions and independently decides which tools to call, in what order, and with what arguments. The backend executes those tools against Supabase and returns real results. Gemini synthesizes the results into a natural-language response.

**Gemini is the decision-maker. The backend is the executor and validator.**

---

## 2. System Prompt (`lib/agent/systemPrompt.ts`)

```typescript
export function buildSystemPrompt(): string {
  return `
You are RouteWise, an autonomous delivery dispatch assistant for the Chennai Delivery Hub.
The logged-in dispatcher is Anitha V (Dispatcher ID: D01).

Today is ${weekdayInIndia()}, ${todayInIndia()} (India Standard Time).
Use this to resolve dates like "today", "tomorrow", "yesterday", "this evening".

## Your job
Help the dispatcher assign deliveries to riders and manage failed deliveries.
Always use tools to get real data. Never invent delivery IDs, rider IDs, or counts.

## How to work
1. If the request needs delivery IDs: call getPendingDeliveries or getFailedDeliveries first.
2. If the request needs rider IDs: call getAvailableRiders first.
3. If you need to check capacity before assigning: call getRiderLoad.
4. For assignments: call assignDelivery for each delivery. The database enforces all rules.
5. For rescheduling: call rescheduleDelivery. Only failed deliveries with <3 attempts can be rescheduled.
6. If a tool returns an error, explain it clearly and suggest what the dispatcher can do.
7. If the request is ambiguous (no zone, no date, etc.), ask one short clarifying question.
8. After completing writes, summarise what was done: how many deliveries assigned, to which riders.
9. Keep replies professional and concise. Use plain English.

## Business rules (the database enforces these automatically)
- A rider can only receive deliveries from their own zone.
- A rider must have a shift on the delivery date.
- A rider cannot exceed their capacity (maximum concurrent active deliveries).
- A delivery must be "pending" before it can be assigned.
- Failed deliveries with 3 attempts cannot be rescheduled — advise the dispatcher to mark them as returned.
- Only failed deliveries can be rescheduled.

## Zones
Z1 = Velachery, Z2 = Adyar, Z3 = Anna Nagar, Z4 = T Nagar, Z5 = Tambaram

## Time windows
morning = early hours, afternoon = midday, evening = late afternoon/evening
`.trim();
}
```

---

## 3. Tool Definitions

### Tool 1: `getPendingDeliveries`

```typescript
defineTool({
  name: "getPendingDeliveries",
  description: `Use this when the dispatcher asks about pending, unassigned, or waiting deliveries.
Returns deliveries with status 'pending' for a given zone and date.
Optionally filter by time window (morning, afternoon, or evening).`,
  schema: z.object({
    zone_id: z.enum(["Z1","Z2","Z3","Z4","Z5"]).optional()
      .describe("Zone ID: Z1=Velachery, Z2=Adyar, Z3=Anna Nagar, Z4=T Nagar, Z5=Tambaram. Omit to get all zones."),
    delivery_date: isoDate
      .describe("Date in YYYY-MM-DD format. Use today's date if not specified."),
    time_window: z.enum(["morning","afternoon","evening"]).optional()
      .describe("Filter by time window. Omit to return all time windows."),
  }),
  run: async ({ zone_id, delivery_date, time_window }) => {
    let query = getSupabase()
      .from("deliveries")
      .select("id, order_ref, customer_name, address, zone_id, parcel_size, is_cod, cod_amount, delivery_date, time_window, attempts")
      .eq("status", "pending")
      .eq("delivery_date", delivery_date)
      .order("time_window")
      .order("id");
    if (zone_id) query = query.eq("zone_id", zone_id);
    if (time_window) query = query.eq("time_window", time_window);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { count: data.length, deliveries: data };
  },
});
```

---

### Tool 2: `getAvailableRiders`

```typescript
defineTool({
  name: "getAvailableRiders",
  description: `Use this when you need to find riders who can accept deliveries.
Returns riders who are active, have a shift on the given date, and are assigned to the given zone.
Also returns their current load vs capacity so you can see who has room.`,
  schema: z.object({
    zone_id: z.enum(["Z1","Z2","Z3","Z4","Z5"])
      .describe("Zone ID to filter riders by their home_zone."),
    date: isoDate
      .describe("Date in YYYY-MM-DD format to check for shifts."),
  }),
  run: async ({ zone_id, date }) => {
    // Join riders + rider_shifts, filter active + on shift + correct zone
    // Also count active deliveries per rider
    const { data, error } = await getSupabase()
      .from("riders")
      .select(`
        id, name, vehicle, capacity,
        rider_shifts!inner(shift_date, start_time, end_time)
      `)
      .eq("home_zone", zone_id)
      .eq("is_active", true)
      .eq("rider_shifts.shift_date", date);
    if (error) throw new Error(error.message);

    // For each rider, count active deliveries
    const riders = await Promise.all(data.map(async (r) => {
      const { count } = await getSupabase()
        .from("deliveries")
        .select("*", { count: "exact", head: true })
        .eq("rider_id", r.id)
        .in("status", ["assigned", "out_for_delivery"]);
      return {
        id: r.id,
        name: r.name,
        vehicle: r.vehicle,
        capacity: r.capacity,
        active_count: count ?? 0,
        remaining: r.capacity - (count ?? 0),
        shift: r.rider_shifts[0],
      };
    }));
    return { count: riders.length, riders };
  },
});
```

---

### Tool 3: `getRiderLoad`

```typescript
defineTool({
  name: "getRiderLoad",
  description: `Use this to check how many deliveries a specific rider currently has active,
and how much capacity they have left. Call this before assigning to confirm space is available.`,
  schema: z.object({
    rider_id: z.string().describe("Rider ID, for example R01"),
    date: isoDate.describe("Date in YYYY-MM-DD format"),
  }),
  run: async ({ rider_id, date }) => {
    const { data: rider, error: rErr } = await getSupabase()
      .from("riders")
      .select("id, name, capacity, home_zone, is_active")
      .eq("id", rider_id)
      .single();
    if (rErr) throw new Error(rErr.message);
    if (!rider) throw new Error(`Rider ${rider_id} not found`);

    const { count: active } = await getSupabase()
      .from("deliveries")
      .select("*", { count: "exact", head: true })
      .eq("rider_id", rider_id)
      .in("status", ["assigned", "out_for_delivery"]);

    const { data: shift } = await getSupabase()
      .from("rider_shifts")
      .select("shift_date, start_time, end_time")
      .eq("rider_id", rider_id)
      .eq("shift_date", date)
      .maybeSingle();

    return {
      rider_id: rider.id,
      name: rider.name,
      zone: rider.home_zone,
      is_active: rider.is_active,
      has_shift_today: !!shift,
      shift: shift ?? null,
      capacity: rider.capacity,
      active_count: active ?? 0,
      remaining: rider.capacity - (active ?? 0),
    };
  },
});
```

---

### Tool 4: `assignDelivery` (WRITE)

```typescript
defineTool({
  name: "assignDelivery",
  description: `Use this to assign a pending delivery to a rider.
The database will validate zone match, shift, capacity, and status automatically.
If the assignment fails, the error message will explain why.
You must have the delivery id (a number) and rider id (like R01) before calling this.`,
  writes: true,
  schema: z.object({
    delivery_id: z.number().int().positive()
      .describe("The numeric id of the delivery (not order_ref)"),
    rider_id: z.string().min(1)
      .describe("The rider ID, for example R01"),
  }),
  run: async ({ delivery_id, rider_id }) => {
    const { data, error } = await getSupabase()
      .rpc("assign_delivery", {
        p_delivery_id: delivery_id,
        p_rider_id: rider_id,
      });
    if (error) throw new Error(error.message);
    return data; // { delivery_id, order_ref, rider, rider_load, capacity }
  },
});
```

---

### Tool 5: `rescheduleDelivery` (WRITE)

```typescript
defineTool({
  name: "rescheduleDelivery",
  description: `Use this to reschedule a failed delivery to a new date and time window.
Only deliveries with status 'failed' and fewer than 3 attempts can be rescheduled.
After rescheduling, the delivery status becomes 'pending' and must be assigned again.
If a delivery already has 3 attempts, tell the dispatcher to mark it as returned instead.`,
  writes: true,
  schema: z.object({
    delivery_id: z.number().int().positive()
      .describe("The numeric id of the failed delivery"),
    new_date: isoDate
      .describe("New delivery date in YYYY-MM-DD format. Must be today or later."),
    time_window: z.enum(["morning","afternoon","evening"])
      .describe("New time window for the delivery"),
  }),
  run: async ({ delivery_id, new_date, time_window }) => {
    const { data, error } = await getSupabase()
      .rpc("reschedule_delivery", {
        p_delivery_id: delivery_id,
        p_new_date: new_date,
        p_time_window: time_window,
      });
    if (error) throw new Error(error.message);
    return data; // { delivery_id, order_ref, new_date, time_window, attempts_used }
  },
});
```

---

### Tool 6: `getFailedDeliveries`

```typescript
defineTool({
  name: "getFailedDeliveries",
  description: `Use this when the dispatcher asks about failed deliveries that need attention.
Returns failed deliveries with their attempt count and history.
Optionally filter by zone. Deliveries with 3 attempts cannot be rescheduled.`,
  schema: z.object({
    zone_id: z.enum(["Z1","Z2","Z3","Z4","Z5"]).optional()
      .describe("Filter by zone. Omit to return failed deliveries from all zones."),
    date: isoDate.optional()
      .describe("Filter by delivery_date. Omit to return all dates."),
  }),
  run: async ({ zone_id, date }) => {
    let query = getSupabase()
      .from("deliveries")
      .select(`
        id, order_ref, customer_name, address, zone_id,
        delivery_date, time_window, attempts, rider_id,
        riders(name)
      `)
      .eq("status", "failed")
      .order("delivery_date", { ascending: false })
      .order("id");
    if (zone_id) query = query.eq("zone_id", zone_id);
    if (date) query = query.eq("delivery_date", date);
    const { data, error } = await query.limit(30);
    if (error) throw new Error(error.message);

    return {
      count: data.length,
      deliveries: data.map(d => ({
        ...d,
        rider_name: (d.riders as { name: string } | null)?.name ?? null,
        can_reschedule: d.attempts < 3,
      })),
    };
  },
});
```

---

## 4. Agent Loop (unchanged from starter)

The `runAgent.ts` loop is kept exactly as the starter provides it. It:

1. Converts chat messages to Gemini `Content[]` format
2. Sends to Gemini with `systemInstruction` + `tools`
3. If Gemini returns `functionCalls`, runs each through `runTool()`
4. `runTool()` Zod-validates args, then calls `tool.run()`
5. Appends `functionResponse` parts to `contents`
6. Loops up to 5 rounds
7. When Gemini returns no function calls → final answer

---

## 5. Tool Selection by Scenario

| Dispatcher says | Tools Gemini should call (in order) |
|---|---|
| "Show all pending Velachery deliveries" | `getPendingDeliveries` |
| "Which riders are free today?" | `getAvailableRiders` for each zone OR all zones |
| "Assign all pending Velachery deliveries for this evening" | `getPendingDeliveries` → `getAvailableRiders` → `getRiderLoad` → `assignDelivery` (×N) |
| "What's Suresh's current load?" | `getRiderLoad` |
| "Show all failed deliveries" | `getFailedDeliveries` |
| "Reschedule yesterday's failed deliveries to tomorrow morning" | `getFailedDeliveries` → `rescheduleDelivery` (×N) |
| "Assign delivery 103 to R01" | `assignDelivery` (direct, if IDs are known) |
| "Assign the deliveries" | Gemini should ask: "Which zone and date?" |

---

## 6. Error Handling Strategy

| Error source | How handled |
|---|---|
| Zod validation failure | `runTool()` catches it, returns `AgentStep { ok: false, error: "Invalid arguments: ..." }` |
| DB function raises exception | `tool.run()` calls `throw new Error(error.message)` → `runTool()` catches → `AgentStep { ok: false }` |
| Gemini quota (429) | `api/agent/route.ts` detects 429/RESOURCE_EXHAUSTED → returns friendly message |
| Tool not found | `runTool()` returns `{ ok: false, error: "Unknown tool: ..." }` |
| Max rounds reached | `runAgent()` returns "I needed too many steps..." message |
| Network error | Caught by try/catch in `runAgent`, surfaces in `AgentStep.error` |

---

## 7. What Gemini Sees (Function Declaration Example)

The `toFunctionDeclarations()` function in `defineTool.ts` strips the Zod schema to only Gemini-compatible JSON Schema keys. For `assignDelivery`, Gemini sees:

```json
{
  "name": "assignDelivery",
  "description": "Use this to assign a pending delivery to a rider...",
  "parametersJsonSchema": {
    "type": "object",
    "properties": {
      "delivery_id": {
        "type": "number",
        "description": "The numeric id of the delivery (not order_ref)"
      },
      "rider_id": {
        "type": "string",
        "description": "The rider ID, for example R01"
      }
    },
    "required": ["delivery_id", "rider_id"]
  }
}
```

---

## 8. Tool Execution Visibility

Every tool call is captured in `AgentStep`:
```typescript
{
  tool: "assignDelivery",
  args: { delivery_id: 103, rider_id: "R01" },
  ok: true,
  writes: true,
  result: { delivery_id: 103, order_ref: "ORD-5006", rider: "Suresh Kumar", rider_load: 6, capacity: 6 }
}
```

The frontend `ToolActivityPanel` renders each step as an expandable row showing:
- ✅ Done / ❌ Failed
- Tool name + "writes data" badge
- Args + result or error (expandable JSON)

