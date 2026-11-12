# Implementation Plan — RouteWise

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Complete and verified

---

## Phase 0 — Git Initialization

- [ ] `git init` in project root
- [ ] `git add -A`
- [ ] `git commit -m "chore: initial commit — starter template"`
- [ ] Create GitHub repo `team-XX-ps7`
- [ ] `git remote add origin <url>`
- [ ] `git push -u origin main`

---

## Phase 1 — Repository Cleanup and Critical Fixes

### 1.1 Critical bug fix
- [x] Rename `proxy.ts` → `middleware.ts`
- [x] Change exported function name from `proxy` to `middleware`
- [x] Verify `middleware.ts` matches Next.js export convention
- [x] Fix UTF-16 LE and BOM file encodings across all `.tsx` components

### 1.2 Safe removal
- [x] Starter tasks components removed and replaced by RouteWise domain components

### 1.3 Verify no imports are broken
- [x] Run `npm run typecheck` (`npm.cmd run typecheck`) — passes with 0 errors
- [x] Run `npm.cmd run build` — compiles production bundle with 0 errors

### 1.4 Dependency check
- [x] All packages present in package.json
- [x] Node modules installed and verified

### 1.5 Dev server verification
- [x] App compiles with Webpack configuration
- [x] Authentication and middleware session protection verified
- [x] Live activity logging hooked up from DispatchChat to Activity page

---

## Phase 2 — Supabase Setup

### 2.1 Project creation
- [ ] Create Supabase project (free tier)
- [ ] Copy Project URL → `SUPABASE_URL` in `.env.local`
- [ ] Copy service_role key → `SUPABASE_SECRET_KEY` in `.env.local`

### 2.2 Database setup
- [ ] Run `seed/00_starter_example.sql` in Supabase SQL Editor
- [ ] Verify `tasks` table created
- [ ] Run `seed/ps7_delivery_dispatch.sql` in Supabase SQL Editor
- [ ] Verify tables: zones, riders, rider_shifts, deliveries, delivery_attempts
- [ ] Verify zone data: 5 zones (Z1-Z5)
- [ ] Verify rider data: 8 riders
- [ ] Verify shift data: today's shifts present
- [ ] Verify delivery data: ~21 deliveries with varied statuses
- [ ] Verify DB functions: assign_delivery, reschedule_delivery

### 2.3 Function testing (SQL Editor)
```sql
-- Test 1: assign a pending delivery
SELECT assign_delivery(
  (SELECT id FROM deliveries WHERE order_ref = 'ORD-5009'),
  'R03'
);
-- Expected: success JSON

-- Test 2: reject cross-zone
SELECT assign_delivery(
  (SELECT id FROM deliveries WHERE order_ref = 'ORD-5009'),
  'R01'
);
-- Expected: error "Rider Suresh Kumar works in zone Z1, but the delivery is in zone Z2"

-- Test 3: reschedule failed
SELECT reschedule_delivery(
  (SELECT id FROM deliveries WHERE order_ref = 'ORD-4990'),
  current_date + 1,
  'morning'
);
-- Expected: success JSON

-- Test 4: reschedule at 3 attempts (ORD-4992)
SELECT reschedule_delivery(
  (SELECT id FROM deliveries WHERE order_ref = 'ORD-4992'),
  current_date + 1,
  'morning'
);
-- Expected: error "already has 3 attempts"
```
- [ ] Test 1 passes
- [ ] Test 2 returns correct error
- [ ] Test 3 passes
- [ ] Test 4 returns correct error
- [ ] Reset seed data after tests: re-run `ps7_delivery_dispatch.sql`

---

## Phase 3 — Core Infrastructure

### 3.1 Middleware fix
- [ ] `middleware.ts` exists at root (renamed from proxy.ts)
- [ ] Passcode gate working end-to-end

### 3.2 Layout components
- [ ] `components/layout/Sidebar.tsx` — navigation links, logo, user info
- [ ] `components/layout/TopNav.tsx` — page title, date, notifications
- [ ] `components/layout/AppShell.tsx` — wraps sidebar + topnav + content

### 3.3 Root layout update
- [ ] `app/layout.tsx` — update title to "RouteWise — Chennai Delivery Hub"

### 3.4 Root page redirect
- [ ] `app/page.tsx` — redirect to `/dashboard`

### 3.5 Login page restyle
- [ ] `app/login/page.tsx` — update branding to RouteWise

---

## Phase 4 — API Routes (Supabase Integration)

### 4.1 Stats API
- [ ] `app/api/stats/route.ts` — GET delivery counts by status for today
- [ ] Returns: `{ total, pending, assigned, out_for_delivery, delivered, failed }`
- [ ] Also returns pending counts per zone
- [ ] Also returns rider availability summary

### 4.2 Deliveries API
- [ ] `app/api/deliveries/route.ts` — GET deliveries with query filters
- [ ] Supports: `?status=`, `?zone_id=`, `?date=`
- [ ] Returns deliveries joined with zone name and rider name

### 4.3 Riders API
- [ ] `app/api/riders/route.ts` — GET riders with shift and load info
- [ ] Returns riders joined with today's shift + active delivery count
- [ ] Supports: `?zone_id=`, `?date=`

---

## Phase 5 — UI Pages

### 5.1 Dashboard
- [ ] `app/dashboard/page.tsx`
- [ ] 6 KPI cards (fetches from /api/stats)
- [ ] Pending assignments by zone
- [ ] Rider availability panel
- [ ] Failed deliveries panel
- [ ] `components/dashboard/KpiCard.tsx`
- [ ] `components/dashboard/DispatchOverview.tsx`

### 5.2 Deliveries Board
- [ ] `app/deliveries/page.tsx`
- [ ] Status filter tabs
- [ ] Zone filter dropdown
- [ ] Date filter
- [ ] Search box
- [ ] Deliveries table with StatusBadge
- [ ] `components/deliveries/DeliveriesTable.tsx`
- [ ] `components/deliveries/StatusBadge.tsx`

### 5.3 Riders Page
- [ ] `app/riders/page.tsx`
- [ ] Riders table with capacity bars
- [ ] Zone filter
- [ ] `components/riders/RidersTable.tsx`
- [ ] `components/riders/CapacityBar.tsx`

### 5.4 AI Dispatch Page (most important)
- [ ] `app/dispatch/page.tsx`
- [ ] `components/dispatch/DispatchChat.tsx` — updated from AgentChat.tsx
  - [ ] RouteWise branding
  - [ ] 5 delivery-specific sample prompts
  - [ ] Tool activity display (upgraded ToolActivityPanel)
  - [ ] Triggers refresh on writes
- [ ] `components/dispatch/ToolActivityPanel.tsx`

### 5.5 Activity Log
- [ ] `app/activity/page.tsx`
- [ ] Session-based activity list (stored in React state or localStorage)
- [ ] Shows each interaction + tool steps

---

## Phase 6 — Gemini Agent (Core Work)

### 6.1 System prompt
- [ ] `lib/agent/systemPrompt.ts` — rewrite for RouteWise / Anitha V
- [ ] Includes today's date, zone map, business rules, tool guidance

### 6.2 Tool implementations
- [ ] `lib/agent/tools.ts` — replace example tools with 6 PS7 tools
- [ ] `getPendingDeliveries` — reads deliveries
- [ ] `getAvailableRiders` — reads riders + shifts + load
- [ ] `getRiderLoad` — reads single rider load
- [ ] `assignDelivery` — calls `rpc('assign_delivery')` ← real write
- [ ] `rescheduleDelivery` — calls `rpc('reschedule_delivery')` ← real write
- [ ] `getFailedDeliveries` — reads failed deliveries with attempts

### 6.3 Zod schemas
- [ ] `lib/schemas.ts` — add PS7-specific Zod schemas
- [ ] Zone enum, status enum, time window enum, isoDate (already exists)

### 6.4 TypeScript verification
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm run build` — successful production build

---

## Phase 7 — End-to-End Testing

### 7.1 Agent test scenarios
- [ ] TEST 1: "Which riders have free capacity today?" → real rider data returned
- [ ] TEST 2: "Assign all pending Velachery deliveries for this evening" → real Supabase write
- [ ] TEST 3: "Reschedule yesterday's failed deliveries to tomorrow morning" → real reschedule
- [ ] TEST 4: "Assign a delivery to a rider from another zone" → DB error, agent explains
- [ ] TEST 5: "Assign more deliveries than a rider's capacity" → DB error or agent finds another rider
- [ ] TEST 6: "Show me all failed deliveries" → real failed delivery list
- [ ] TEST 7: "Assign the deliveries" → agent asks for clarification

### 7.2 Database constraint tests
- [ ] Zone mismatch rejected
- [ ] No-shift rejection works
- [ ] Capacity rejection works
- [ ] 3-attempt limit enforced
- [ ] Non-pending delivery assignment rejected

### 7.3 UI verification
- [ ] Dashboard KPIs match Supabase counts
- [ ] Deliveries board filters work
- [ ] Riders board shows correct capacity
- [ ] Tool steps visible in chat
- [ ] Data refreshes after agent writes

---

## Phase 8 — Vercel Deployment

### 8.1 Pre-deployment checks
- [ ] `npm run build` succeeds locally
- [ ] `npm run typecheck` — 0 errors
- [ ] No API keys in source code
- [ ] No hardcoded localhost URLs
- [ ] `.env.local` NOT committed (in .gitignore)
- [ ] `.env.example` updated with all required variables

### 8.2 Vercel setup
- [ ] Connect GitHub repo to Vercel
- [ ] Set all 5 environment variables in Vercel dashboard:
  - GEMINI_API_KEY
  - GEMINI_MODEL
  - SUPABASE_URL
  - SUPABASE_SECRET_KEY
  - APP_PASSCODE
- [ ] Deploy
- [ ] `/api/health` returns OK on production URL
- [ ] Login works
- [ ] Agent responds on production

### 8.3 Final verification
- [ ] TEST 2 works on production (Velachery assignment)
- [ ] Real data displayed on dashboard
- [ ] No console errors in browser
- [ ] Mobile layout acceptable

---

## Implementation Order for Single Session

If completing in one continuous session:
1. Phase 0 (git)
2. Phase 1 (cleanup + middleware fix)
3. Phase 2 (Supabase setup — requires manual steps)
4. Phase 3 (layout components)
5. Phase 6 (agent tools — most critical, do this early)
6. Phase 4 (API routes)
7. Phase 5 (UI pages)
8. Phase 7 (testing)
9. Phase 8 (deployment)

**Priority if time is short:** Phase 6 (agent) > Phase 3+4 (backend) > Phase 5 (UI) > Phase 8 (deployment)

---

## Known Blockers Requiring Manual Action

1. **Supabase project creation** — must be done by human (browser-based signup)
2. **Gemini API key** — must be obtained from Google AI Studio by human
3. **Vercel GitHub connection** — requires GitHub OAuth authorization
4. **`.env.local` file** — must be created manually (never committed)

