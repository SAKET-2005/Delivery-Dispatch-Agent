# AI Handoff Document — RouteWise

**Last updated:** 2026-11-12  
**Current IDE:** Antigravity (IDE 1)  
**Next IDE:** Secondary coding IDE (IDE 2)

---

## 1. Current Project Stage

**Stage: DESIGN COMPLETE — Ready to implement**

The repository has been fully audited. All six design documents have been written. No application code has been modified yet (the starter is intact). Implementation begins with Phase 1.

---

## 2. What Was Completed This Session

- ✅ Full forensic audit of the starter repository (every file read and classified)
- ✅ Identified critical bug: `proxy.ts` must be renamed `middleware.ts`
- ✅ Fully analysed `seed/ps7_delivery_dispatch.sql` — schema, seed data, and DB functions documented
- ✅ Designed complete application architecture (6 docs created)
- ✅ Designed all 6 agent tools with exact implementation specs
- ✅ Designed all UI pages with component breakdowns
- ✅ Created phased implementation checklist

---

## 3. Files Created This Session

| File | Purpose |
|---|---|
| `docs/REPOSITORY_AUDIT.md` | Full file classification, risks, recommended structure |
| `docs/PROJECT_CONTEXT.md` | Business context, tech stack, decisions, business rules |
| `docs/ARCHITECTURE.md` | Request flow, security model, component structure |
| `docs/DATABASE_DESIGN.md` | Schema, queries, DB function specs, usage patterns |
| `docs/AGENT_DESIGN.md` | All 6 tool specs, system prompt, error handling |
| `docs/UI_DESIGN.md` | Visual design, page layouts, component specs |
| `docs/IMPLEMENTATION_PLAN.md` | Phased checklist with test scenarios |
| `docs/AI_HANDOFF.md` | This file |
| `docs/CHANGELOG.md` | (see CHANGELOG.md) |

---

## 4. Files Modified This Session

**None.** No existing files were changed. The starter is intact.

---

## 5. Files Deleted This Session

**None.** Deletion happens in Phase 1 (after design approval).

---

## 6. Current Architecture

```
Next.js 16 App Router + React 19 + TypeScript + Tailwind v4
Gemini Function Calling via @google/genai v3
Supabase PostgreSQL via @supabase/supabase-js v2
Zod v4 for all validation
Vercel deployment target
Passcode auth via SHA-256 cookie (middleware.ts)
```

The starter's agent loop (`runAgent.ts`) is complete and correct — it handles multi-round function calling, Zod validation, and step tracking. **Do not rewrite it.**

---

## 7. Dependencies Added

**None.** All required packages are already in `package.json`.

---

## 8. Database Status

**Not yet configured.** Supabase project needs to be created manually.

Steps required:
1. Create project at supabase.com
2. Run `seed/00_starter_example.sql` in SQL Editor
3. Run `seed/ps7_delivery_dispatch.sql` in SQL Editor
4. Add credentials to `.env.local`

The PS7 SQL has been fully analysed. See `docs/DATABASE_DESIGN.md`.

---

## 9. Gemini Integration Status

The starter's `runAgent.ts` and `defineTool.ts` are ready and functional. The only files that need modification are:
- `lib/agent/tools.ts` — replace 3 example tools with 6 PS7 tools
- `lib/agent/systemPrompt.ts` — rewrite for RouteWise

The API key needs to be obtained from Google AI Studio and placed in `.env.local`.

---

## 10. Tests Executed

**None yet.** Testing begins after implementation.

Planned test scenarios are documented in `docs/IMPLEMENTATION_PLAN.md` Section 7.

---

## 11. Known Bugs / Issues

| Issue | Severity | Fix |
|---|---|---|
| `proxy.ts` not named `middleware.ts` — passcode gate is inactive | CRITICAL | Rename file, rename export to `middleware` |
| `delivery_attempts.rider_id` is NOT NULL — `reschedule_delivery()` will fail if called on a delivery that has no rider_id | LOW | Seed data is correct (failed deliveries always have a rider). Document as known limitation. |

---

## 12. Unfinished Tasks (What IDE 2 Must Do)

In order:

### Phase 1 — Critical fix + cleanup
1. Rename `proxy.ts` → `middleware.ts`, export as `middleware`
2. Delete `components/TaskList.tsx`
3. Delete `app/api/tasks/route.ts`
4. Run `npm run typecheck` — verify 0 errors

### Phase 2 — Supabase (requires manual human setup)
5. Create Supabase project, run both SQL files
6. Create `.env.local` with all 5 variables
7. Test DB functions manually in SQL Editor

### Phase 3 — Layout
8. Create `components/layout/Sidebar.tsx`
9. Create `components/layout/TopNav.tsx`
10. Create `components/layout/AppShell.tsx`
11. Update `app/layout.tsx` title
12. Update `app/page.tsx` to redirect to `/dashboard`
13. Restyle `app/login/page.tsx` for RouteWise

### Phase 4 — API routes
14. Create `app/api/stats/route.ts`
15. Create `app/api/deliveries/route.ts`
16. Create `app/api/riders/route.ts`

### Phase 5 — UI pages
17. Create `app/dashboard/page.tsx` with KPI cards + overview panels
18. Create `app/deliveries/page.tsx` with filter + table
19. Create `app/riders/page.tsx` with capacity bars
20. Create `app/dispatch/page.tsx` with DispatchChat
21. Create `app/activity/page.tsx`
22. Create all required components (see `docs/UI_DESIGN.md`)

### Phase 6 — Agent (MOST CRITICAL)
23. Rewrite `lib/agent/systemPrompt.ts` for RouteWise
24. Rewrite `lib/agent/tools.ts` with 6 PS7 tools
25. Update `lib/schemas.ts` with PS7 Zod types
26. Run `npm run typecheck` — 0 errors

### Phase 7 — Testing
27. Run all 7 test scenarios from `docs/IMPLEMENTATION_PLAN.md`
28. Verify writes appear in Supabase dashboard

### Phase 8 — Deployment
29. `npm run build` must succeed
30. Deploy to Vercel with all env vars
31. Verify on production URL

---

## 13. Exact Next Steps (Start Here)

```bash
# Step 1: Initialize git
git init
git add -A
git commit -m "chore: initial commit — starter template + RouteWise design docs"

# Step 2: Fix critical middleware bug
# Rename proxy.ts to middleware.ts
# Change: export async function proxy(request: NextRequest)
# To:     export async function middleware(request: NextRequest)

# Step 3: Verify TypeScript
npm run typecheck

# Step 4: Configure environment (manual)
# Copy .env.example to .env.local, fill in real values

# Step 5: Start implementing Phase 3 (layout)
# Then Phase 6 (agent tools) — this is the hackathon core
```

---

## 14. Important Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build (must pass before Vercel deploy)
npm run typecheck    # TypeScript check (tsc --noEmit)
```

---

## 15. Git Status

No git repository initialized. Must run `git init` as first step.

**Branch:** main (to be created)  
**Latest commit:** N/A

---

## 16. Decisions That Must Not Be Changed

1. **Do NOT rewrite `runAgent.ts`** — the agent loop is correct and production-ready.
2. **Do NOT rewrite `defineTool.ts`** — the JSON schema conversion is carefully crafted for Gemini v3.
3. **Do NOT add UI libraries** (shadcn, Radix, etc.) — use Tailwind classes only. No new npm packages needed.
4. **Do NOT use the Supabase anon key** — only `SUPABASE_SECRET_KEY` (service_role) on the server.
5. **Do NOT replace `rpc('assign_delivery')` with direct table updates** — the DB function is the authority.
6. **Do NOT use `tailwind.config.ts`** — Tailwind v4 does not need a config file.
7. **Tool descriptions MUST start with "Use this when..."** — this is how Gemini knows when to call each tool.
8. **Keep `export const runtime = "nodejs"`** in all API routes — Edge runtime breaks Supabase/Gemini.
9. **The `proxy` export in `proxy.ts`** must become `middleware` export in `middleware.ts` for Next.js to recognize it.
10. **isoDate regex** already defined in `lib/schemas.ts` — reuse it in tool schemas.

