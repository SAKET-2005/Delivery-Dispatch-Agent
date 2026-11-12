# Project Context — RouteWise

## 1. Project Identity

| Field | Value |
|---|---|
| **Project name** | RouteWise |
| **Hackathon** | SRM Agentic AI Hackathon |
| **Problem statement** | PS7 — Delivery Dispatch Agent |
| **Business user** | Anitha V (Dispatcher ID: D01), Chennai Delivery Hub |
| **Category** | Agentic AI / Logistics / Delivery Automation |

---

## 2. Problem Statement

Anitha V manually assigns deliveries to riders using spreadsheets. This causes:

1. Some riders receive more deliveries than their capacity allows.
2. Other riders remain idle.
3. Deliveries are assigned to riders from the wrong geographical zone.
4. Riders receive assignments on days they are not working.
5. Failed deliveries are forgotten rather than rescheduled.
6. The dispatcher wastes time checking availability and assigning manually.

---

## 3. Solution

RouteWise is an **autonomous AI delivery dispatch assistant**. The dispatcher sends natural-language instructions. The AI agent independently selects which tools to call, retrieves real database records, validates all business rules, writes confirmed assignments to Supabase, and reports results.

**This is NOT a chatbot that generates text.** Every assignment, reschedule, and status check is backed by an actual Supabase read or write.

---

## 4. Technology Stack (MANDATORY — do not change)

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16 with App Router |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Backend | Next.js API Route Handlers |
| Database | Supabase PostgreSQL |
| Database SDK | @supabase/supabase-js v2 |
| AI SDK | @google/genai v3 |
| AI model | Google Gemini (gemini-2.5-flash default) |
| AI pattern | Gemini Function Calling |
| Validation | Zod v4 |
| Deployment | Vercel |
| Auth | Simple SHA-256 passcode cookie |

---

## 5. Business Rules (Hard Constraints)

These rules are enforced at the **database level** by PostgreSQL functions. The agent must respect them, but the database is the final authority.

| Rule | Enforcement |
|---|---|
| A rider can only receive deliveries from their assigned `home_zone` | `assign_delivery()` raises exception if zones differ |
| A rider must have a shift on the delivery date | `assign_delivery()` checks `rider_shifts` table |
| A rider cannot exceed their `capacity` (active deliveries) | `assign_delivery()` counts `assigned` + `out_for_delivery` |
| A delivery must have `status = 'pending'` to be assigned | `assign_delivery()` raises exception otherwise |
| A delivery can have at most 3 total attempts | Both functions enforce this |
| Only `failed` deliveries can be rescheduled | `reschedule_delivery()` raises exception otherwise |
| New scheduled date must be today or later | `reschedule_delivery()` date check |
| `reschedule_delivery()` resets rider_id to null and status to `pending` | By design — delivery must be re-assigned after rescheduling |
| `is_active = false` riders cannot receive deliveries | `assign_delivery()` checks `is_active` |

---

## 6. Database Tables (PS7 Schema)

| Table | Purpose |
|---|---|
| `zones` | Geographical delivery zones (Z1-Z5) |
| `riders` | Delivery riders with zone, vehicle, capacity |
| `rider_shifts` | Which riders work on which dates |
| `deliveries` | Individual delivery records with status |
| `delivery_attempts` | History of delivery attempt outcomes |

### Database Functions (write operations — always use these, never direct updates)

- `assign_delivery(p_delivery_id bigint, p_rider_id text)` → JSON
- `reschedule_delivery(p_delivery_id bigint, p_new_date date, p_time_window text)` → JSON

---

## 7. Seed Data Summary

**Zones:** Z1 Velachery, Z2 Adyar, Z3 Anna Nagar, Z4 T Nagar, Z5 Tambaram

**Riders:**
- R01 Suresh Kumar — Z1, bike, capacity 6 (5 active today → 1 slot left)
- R02 Lakshmi Priya — Z1, scooter, capacity 5 (NO SHIFT TODAY)
- R03 Mohammed Irfan — Z2, bike, capacity 6
- R04 Deepa R — Z3, scooter, capacity 5 (shift ends 14:00)
- R05 Vignesh M — Z3, van, capacity 12
- R06 Kavya S — Z4, bike, capacity 6
- R07 Ramesh B — Z5, van, capacity 12
- R08 Gokul P — Z2, bike, capacity 6 (INACTIVE)

**Key test scenarios in seed data:**
- R01 is at 5/6 capacity → only 1 more delivery fits
- R02 has no shift today → agent must reject assignments to R02
- R08 is inactive → agent must reject assignments to R08
- ORD-4990, ORD-4991 are failed with <3 attempts → can be rescheduled
- ORD-4992 has 3 attempts → cannot be rescheduled (must be returned)
- Pending deliveries exist in Z1 (Velachery), Z2, Z3, Z4, Z5

---

## 8. Important Architecture Decisions

1. **`proxy.ts` must be renamed to `middleware.ts`** and the export must be named `middleware`. This is a Next.js requirement. The current name means the passcode gate is inactive.

2. **All Gemini API calls happen server-side only.** The `api/agent/route.ts` handler calls `runAgent()`, which lives in `lib/agent/runAgent.ts` with `import "server-only"`. This is enforced by the `server-only` package.

3. **The agent loop is complete and correct.** `runAgent.ts` correctly handles: multi-round function calling, Zod validation of tool args, appending model turns and function-response turns to `contents`, returning steps to the frontend. Do not rewrite this.

4. **Supabase RLS is ON with no policies.** Only the service-role key (used by `getSupabase()`) can read/write. The anon key is NOT used anywhere. Never add the anon key to the client.

5. **Tailwind v4 syntax** — `@import "tailwindcss"` in globals.css. No tailwind.config.ts needed.

6. **Zod v4** — uses `z.toJSONSchema()` (not deprecated `.openapi()`). Schema definitions use the same API as v3 for most cases.

7. **The `defineTool()` helper strips JSON Schema keys to only what Gemini accepts** (`type`, `properties`, `required`, `description`, `enum`, `items`, `nullable`, `format`). Do not add extra Zod refinements that produce unknown JSON Schema keys — they will be silently stripped.

8. **`reschedule_delivery` creates a `delivery_attempts` row** with the current `rider_id` before clearing it. If `rider_id` is already null at reschedule time, the attempt row will have a null rider — this is acceptable.

9. **No additional npm packages needed.** All required dependencies are present. Do not add UI libraries (shadcn, Radix, etc.) — use Tailwind classes directly.

10. **Capacity definition:** "capacity" = maximum number of deliveries with status `assigned` OR `out_for_delivery` at the same time. This is NOT total deliveries per day.

---

## 9. Dispatcher Identity for Demo

- **Name:** Anitha V
- **Role:** Dispatcher
- **Hub:** Chennai Delivery Hub
- **Dispatcher ID:** D01
- **System prompt persona:** The AI introduces itself as the RouteWise dispatch assistant and addresses the user by role.

---

## 10. Environment Variables Required

```
GEMINI_API_KEY=          # Google AI Studio API key
GEMINI_MODEL=            # gemini-2.5-flash (default if not set)
SUPABASE_URL=            # Supabase project URL
SUPABASE_SECRET_KEY=     # Supabase service_role key (server only)
APP_PASSCODE=            # Team passcode for session auth
```

