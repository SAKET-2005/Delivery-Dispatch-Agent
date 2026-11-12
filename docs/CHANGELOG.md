# Changelog — RouteWise

All notable changes to RouteWise are recorded here.
Format: `YYYY-MM-DD | IDE | Change`

---

## 2026-11-12 | IDE 2 (Takeover & Completion) | Implementation & Integration

### Fixed
- Fixed UTF-16 LE and UTF-8 BOM encoding in `app/login/page.tsx`, `app/dispatch/page.tsx`, `components/dashboard/DispatchOverview.tsx`, `components/deliveries/DeliveriesTable.tsx`, `components/deliveries/StatusBadge.tsx`, `components/layout/AppShell.tsx`, and `components/layout/Sidebar.tsx` causing build parsing errors.
- Fixed non-functional "Log out" buttons in `components/layout/TopNav.tsx` and `components/layout/Sidebar.tsx` by attaching `handleLogout` calling `/api/logout` and redirecting to `/login`.
- Fixed `/activity` page displaying empty state indefinitely: connected `DispatchChat.tsx` to persist all dispatcher turns, tool calls, results, and agent responses to `localStorage` key `routewise_activity`.
- Fixed `package.json` build script to `next build --webpack` to avoid Turbopack PostCSS worker spawn panics on Windows.

### Enhanced
- Updated `lib/schemas.ts` and `lib/agent/tools.ts`:
  - `getPendingDeliveriesArgs`: Made `delivery_date` optional so queries across all dates succeed.
  - `getAvailableRidersArgs`: Made `zone_id` optional so queries like "Which riders have free capacity today?" query all active riders across all zones.
  - Included `zone: r.home_zone` in `getAvailableRiders` tool return so Gemini agent can evaluate zone constraints accurately.
- Updated `DispatchChat.tsx` sample prompts to include all 7 hackathon test workflows.
- Added "Clear Log" action in `app/activity/page.tsx`.

### Verified
- `npm.cmd run typecheck` passes with zero errors.
- `npm.cmd run build` successfully compiles all 15 routes to static/dynamic production output (exit code 0).
- All 6 Gemini agent tools validated with Zod and integrated with Supabase RPCs.
- Environment template `.env.example` verified with all server-side secret boundaries respected.

---

## 2026-11-12 | IDE 1 (Antigravity) | Design session

### Added
- `docs/REPOSITORY_AUDIT.md` — Full file classification of starter repository
- `docs/PROJECT_CONTEXT.md` — Business context, tech stack, business rules
- `docs/ARCHITECTURE.md` — System architecture, request flow, security model
- `docs/DATABASE_DESIGN.md` — PS7 schema analysis, DB function specs, example queries
- `docs/AGENT_DESIGN.md` — All 6 tool definitions, system prompt, error handling strategy
- `docs/UI_DESIGN.md` — Visual design system, page layouts, component specs
- `docs/IMPLEMENTATION_PLAN.md` — Phased implementation checklist with test scenarios
- `docs/AI_HANDOFF.md` — Handoff document for IDE 2
- `docs/CHANGELOG.md` — This file

### Changed
- Nothing (starter is intact)

### Removed
- Nothing

### Identified Issues
- CRITICAL: `proxy.ts` must be renamed `middleware.ts` and export renamed to `middleware`

### Next milestone
- Design approval → begin Phase 1 implementation

