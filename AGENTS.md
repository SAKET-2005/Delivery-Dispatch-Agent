<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## RouteWise (PS7 — Delivery Dispatch Agent)

- **Business user:** Dispatcher Anitha V (`D01`), Chennai Delivery Hub.
- **Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Supabase (server-only `service_role`), Gemini function calling (`@google/genai`), Zod v4.
- **Tables (`seed/ps7_delivery_dispatch.sql`):**
  - `zones` (`id`, `name`, `pincodes`)
  - `riders` (`id`, `name`, `phone`, `home_zone`, `vehicle`, `capacity`, `is_active`)
  - `rider_shifts` (`id`, `rider_id`, `shift_date`, `start_time`, `end_time`)
  - `deliveries` (`id`, `order_ref`, `customer_name`, `address`, `zone_id`, `parcel_size`, `is_cod`, `cod_amount`, `delivery_date`, `time_window`, `rider_id`, `status`, `attempts`, `created_at`)
  - `delivery_attempts` (`id`, `delivery_id`, `rider_id`, `attempted_at`, `outcome`, `note`)
- **Agent tools (`lib/agent/tools.ts`):** Use `defineTool()` with Zod schemas (`lib/schemas.ts`); descriptions start with `"Use this when..."`. Write tools (`assignDelivery`, `rescheduleDelivery`) call Supabase RPC functions `assign_delivery` and `reschedule_delivery`—do not update `deliveries` directly in TypeScript for agent writes.
- **Business rules:** Same-zone rider only (`home_zone = zone_id`), rider active and on shift on `delivery_date`, active load (`assigned` + `out_for_delivery`) `< capacity`, only `pending` deliveries can be assigned, only `failed` deliveries with `< 3` attempts can be rescheduled (3+ attempts must be marked `returned`).
- **Security:** Never use `SUPABASE_SECRET_KEY` or `GEMINI_API_KEY` in client components. Never commit `.env.local`.
