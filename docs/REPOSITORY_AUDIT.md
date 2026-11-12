# Repository Audit — RouteWise (PS7 Delivery Dispatch)

Generated: 2026-11-12  
Auditor: Antigravity (IDE 1)

---

## 1. Original Repository Structure

```
srm-agent-hackathon-starter-main/
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── proxy.ts                        ← middleware / passcode gate
├── README.md
├── tsconfig.json
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                    ← starter home (chat + tasklist)
│   ├── login/
│   │   └── page.tsx
│   └── api/
│       ├── agent/route.ts          ← POST /api/agent  (agent entry point)
│       ├── health/route.ts         ← GET  /api/health
│       ├── login/route.ts          ← POST /api/login
│       ├── logout/route.ts         ← POST /api/logout
│       └── tasks/route.ts          ← example REST API (tasks table)
├── components/
│   ├── AgentChat.tsx               ← chat UI with tool-step display
│   └── TaskList.tsx                ← example data list
├── lib/
│   ├── agent/
│   │   ├── defineTool.ts           ← tool type + toFunctionDeclarations()
│   │   ├── runAgent.ts             ← Gemini agent loop (max 5 rounds)
│   │   ├── systemPrompt.ts         ← system prompt builder (generic)
│   │   ├── tools.ts                ← example tools: listTasks/createTask/completeTask
│   │   └── types.ts                ← AgentStep, AgentResult types
│   ├── auth.ts                     ← passcode hash + session validation
│   ├── dates.ts                    ← todayInIndia(), weekdayInIndia()
│   ├── env.ts                      ← requireEnv(), GEMINI_MODEL constant
│   ├── gemini.ts                   ← singleton GoogleGenAI client
│   ├── schemas.ts                  ← shared Zod schemas (isoDate, chatMessage, etc.)
│   └── supabase.ts                 ← singleton Supabase service-role client
└── seed/
    ├── 00_starter_example.sql      ← tasks table (run FIRST)
    ├── demo_eventease.sql
    ├── ps1_ecommerce_support.sql
    ├── ps2_inventory_restock.sql
    ├── ps3_clinic_appointments.sql
    ├── ps4_it_helpdesk.sql
    ├── ps5_expense_claims.sql
    ├── ps6_job_match.sql
    ├── ps7_delivery_dispatch.sql   ← OUR TARGET SCHEMA
    └── ps8_smart_banking.sql
```

**Note:** No `.git` directory found. The repo was downloaded as a ZIP. Git must be initialized before first commit.

---

## 2. Dependency Analysis

### package.json — exact versions

| Package | Version | Role |
|---|---|---|
| `next` | ^16.4.5 | Framework (App Router) |
| `react` | ^19.3.1 | UI |
| `react-dom` | ^19.3.1 | UI |
| `@google/genai` | ^3.0.0 | Gemini SDK |
| `@supabase/supabase-js` | ^2.119.0 | Database SDK |
| `zod` | ^4.6.7 | Validation |
| `server-only` | ^0.0.1 | Prevents server code in client |
| `tailwindcss` | ^4.3.5 (dev) | Styling (v4 — `@import "tailwindcss"`) |
| `@tailwindcss/postcss` | ^4.3.5 (dev) | PostCSS plugin for Tailwind v4 |
| `typescript` | ^5.9.3 (dev) | Type checking |

> **Important:** Tailwind v4 is in use. The CSS uses `@import "tailwindcss"` (not `@tailwind base/components/utilities`). Do NOT add a `tailwind.config.ts` — it is not needed for v4.

### No additional dependencies needed beyond what is already installed.
All required packages (Gemini, Supabase, Zod, Next.js, React, Tailwind) are present.

---

## 3. Existing Functional Components (MUST KEEP)

### 3A. Core Infrastructure — DO NOT TOUCH

| File | What it does | Why keep |
|---|---|---|
| `lib/agent/runAgent.ts` | Complete Gemini agent loop, 5-round limit, function calling | Fully functional, production quality |
| `lib/agent/defineTool.ts` | Type-safe tool definition + JSON Schema conversion for Gemini | Required by agent loop |
| `lib/agent/types.ts` | `AgentStep` / `AgentResult` types | Used across frontend and backend |
| `lib/supabase.ts` | Singleton Supabase service-role client | Server-side database access |
| `lib/gemini.ts` | Singleton GoogleGenAI client | Gemini API access |
| `lib/auth.ts` | SHA-256 passcode hash + session validation | Login/session security |
| `lib/env.ts` | `requireEnv()` + `GEMINI_MODEL` constant | Safe env-var access |
| `lib/dates.ts` | `todayInIndia()` / `weekdayInIndia()` | Date context in system prompt |
| `proxy.ts` | Middleware passcode gate | Protects all routes |
| `app/api/agent/route.ts` | POST /api/agent entry point | Agent API — keep as-is |
| `app/api/health/route.ts` | Environment check endpoint | Debugging aid |
| `app/api/login/route.ts` | Passcode login handler | Authentication |
| `app/api/logout/route.ts` | Session cookie clear | Authentication |
| `app/login/page.tsx` | Login UI | Required auth flow |
| `next.config.ts` | Next.js config | Build config |
| `tsconfig.json` | TypeScript strict config with `@/` alias | Type safety |
| `postcss.config.mjs` | Tailwind v4 PostCSS | Styling pipeline |
| `app/globals.css` | Base Tailwind import + body styles | Styling |
| `.env.example` | Environment variable template | Developer setup |
| `.gitignore` | Git ignore rules | Source control |
| `seed/00_starter_example.sql` | Starter tasks table | Setup prerequisite |
| `seed/ps7_delivery_dispatch.sql` | Full PS7 schema + seed + DB functions | Our database |

---

## 4. Files to MODIFY

| File | Current state | Required change |
|---|---|---|
| `lib/agent/tools.ts` | 3 example tools for `tasks` table | **Replace with 6 RouteWise tools** for delivery dispatch |
| `lib/agent/systemPrompt.ts` | Generic task assistant prompt | **Rewrite** for Anitha V, Chennai hub, dispatch rules |
| `lib/schemas.ts` | Generic chat + task schemas | **Add** PS7 Zod schemas (zone enum, delivery status enum, etc.) |
| `app/page.tsx` | Starter home with TaskList | **Replace** with RouteWise Dashboard (keep pattern, new content) |
| `app/layout.tsx` | "Hackathon Starter" title | **Update** title/description to "RouteWise" |
| `components/AgentChat.tsx` | Generic agent chat UI | **Update** sample prompts, branding — keep the architecture |
| `app/globals.css` | Minimal base styles | **Extend** with any custom CSS variables needed |

---

## 5. Files SAFE TO REMOVE

| File | Reason |
|---|---|
| `components/TaskList.tsx` | Replaced by RouteWise data panels |
| `app/api/tasks/route.ts` | Tasks REST API — not needed for PS7 |

> **Rule:** Only remove after verifying no other file imports them. Removal happens in Phase 1.

---

## 6. Files to KEEP but NOT USE in PS7

| File | Reason to keep |
|---|---|
| `seed/demo_eventease.sql` | Other teams' data — harmless, leave in place |
| `seed/ps1_*.sql` through `seed/ps8_*.sql` (except ps7) | Leave untouched — not relevant to our app |

---

## 7. New Files to CREATE

### New app pages
```
app/dashboard/page.tsx          ← KPI overview
app/deliveries/page.tsx         ← Deliveries board with filters
app/riders/page.tsx             ← Riders management
app/activity/page.tsx           ← Agent execution history
app/dispatch/page.tsx           ← Full-screen AI dispatch chat
```

### New API routes
```
app/api/deliveries/route.ts     ← GET /api/deliveries (with filters)
app/api/riders/route.ts         ← GET /api/riders (with zone/shift info)
app/api/stats/route.ts          ← GET /api/stats (dashboard KPIs)
```

### New components
```
components/layout/Sidebar.tsx
components/layout/TopNav.tsx
components/layout/AppShell.tsx
components/dashboard/KpiCard.tsx
components/dashboard/DispatchOverview.tsx
components/dispatch/DispatchChat.tsx
components/dispatch/ToolActivityPanel.tsx
components/deliveries/DeliveriesTable.tsx
components/deliveries/StatusBadge.tsx
components/riders/RidersTable.tsx
components/riders/CapacityBar.tsx
```

### New lib files
```
lib/agent/tools.ts              ← (modified in-place with 6 PS7 tools)
lib/agent/systemPrompt.ts       ← (modified in-place)
```

### New docs
```
docs/REPOSITORY_AUDIT.md        ← this file
docs/PROJECT_CONTEXT.md
docs/ARCHITECTURE.md
docs/DATABASE_DESIGN.md
docs/AGENT_DESIGN.md
docs/UI_DESIGN.md
docs/IMPLEMENTATION_PLAN.md
docs/AI_HANDOFF.md
docs/CHANGELOG.md
```

---

## 8. Potential Conflicts and Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Tailwind v4 — no config file, different import syntax | Medium | Use `@import "tailwindcss"` only. No `tailwind.config.ts`. Utility classes work the same. |
| `zod` v4 — `z.toJSONSchema()` API (not v3) | Low | Already in use in `defineTool.ts`. Do not use deprecated v3 `.openapi()`. |
| `@google/genai` v3 — newer SDK | Low | `response.text`, `response.functionCalls`, `response.candidates` already used correctly in `runAgent.ts`. Preserve this pattern. |
| No git repo initialized | Medium | Run `git init && git add -A && git commit -m "chore: initial commit"` as first step |
| `server-only` import in lib files | Low | All agent/supabase/gemini files correctly import `"server-only"`. Never import these in client components. |
| RLS on all tables | Medium | Service-role key bypasses RLS — correct. The `getSupabase()` client uses `SUPABASE_SECRET_KEY`. Never expose this to the client. |
| `reschedule_delivery` inserts a `delivery_attempt` with `d.rider_id` which may be null after a re-assignment | Low | The function uses `d.rider_id` from the row before update — if already null, the attempt gets null rider_id. This is by design in the seed. |
| `proxy.ts` filename — Next.js expects `middleware.ts` at root | **HIGH** | The file is named `proxy.ts`, not `middleware.ts`. It exports `proxy` not `middleware`. This means the passcode gate is NOT active by default. Must rename to `middleware.ts` and export as `middleware`. |

> **Critical finding:** `proxy.ts` exports `proxy` and `config` but is NOT named `middleware.ts`. Next.js only auto-runs `middleware.ts` or `middleware.js` at the project root. This is a starter bug. We must rename it in Phase 1.

---

## 9. Recommended Final Directory Structure

```
srm-agent-hackathon-starter-main/
├── .env.example                    (KEEP — updated with same vars)
├── .env.local                      (NOT committed — created locally)
├── .gitignore                      (KEEP)
├── middleware.ts                   (RENAME from proxy.ts — fix critical bug)
├── next.config.ts                  (KEEP)
├── package.json                    (KEEP — no new deps needed)
├── package-lock.json               (KEEP)
├── postcss.config.mjs              (KEEP)
├── README.md                       (UPDATE for RouteWise)
├── tsconfig.json                   (KEEP)
│
├── app/
│   ├── globals.css                 (KEEP — extend if needed)
│   ├── layout.tsx                  (MODIFY — RouteWise title)
│   ├── page.tsx                    (MODIFY — redirect to /dashboard or be dashboard)
│   ├── login/
│   │   └── page.tsx                (KEEP — restyle for RouteWise)
│   ├── dashboard/
│   │   └── page.tsx                (NEW — KPI overview)
│   ├── dispatch/
│   │   └── page.tsx                (NEW — full AI dispatch)
│   ├── deliveries/
│   │   └── page.tsx                (NEW — deliveries board)
│   ├── riders/
│   │   └── page.tsx                (NEW — riders management)
│   ├── activity/
│   │   └── page.tsx                (NEW — agent activity log)
│   └── api/
│       ├── agent/route.ts          (KEEP — no change needed)
│       ├── health/route.ts         (KEEP)
│       ├── login/route.ts          (KEEP)
│       ├── logout/route.ts         (KEEP)
│       ├── deliveries/route.ts     (NEW)
│       ├── riders/route.ts         (NEW)
│       └── stats/route.ts          (NEW)
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            (NEW — sidebar + topnav wrapper)
│   │   ├── Sidebar.tsx             (NEW)
│   │   └── TopNav.tsx              (NEW)
│   ├── dashboard/
│   │   ├── KpiCard.tsx             (NEW)
│   │   └── DispatchOverview.tsx    (NEW)
│   ├── dispatch/
│   │   ├── DispatchChat.tsx        (NEW — based on AgentChat.tsx pattern)
│   │   └── ToolActivityPanel.tsx   (NEW)
│   ├── deliveries/
│   │   ├── DeliveriesTable.tsx     (NEW)
│   │   └── StatusBadge.tsx         (NEW)
│   └── riders/
│       ├── RidersTable.tsx         (NEW)
│       └── CapacityBar.tsx         (NEW)
│
├── lib/
│   ├── agent/
│   │   ├── defineTool.ts           (KEEP — no change)
│   │   ├── runAgent.ts             (KEEP — no change)
│   │   ├── systemPrompt.ts         (MODIFY — RouteWise prompt)
│   │   ├── tools.ts                (MODIFY — 6 PS7 tools)
│   │   └── types.ts                (KEEP — no change)
│   ├── auth.ts                     (KEEP)
│   ├── dates.ts                    (KEEP)
│   ├── env.ts                      (KEEP)
│   ├── gemini.ts                   (KEEP)
│   ├── schemas.ts                  (MODIFY — add PS7 schemas)
│   └── supabase.ts                 (KEEP)
│
├── seed/
│   ├── 00_starter_example.sql      (KEEP — run first)
│   └── ps7_delivery_dispatch.sql   (KEEP — run second)
│   └── [other ps*.sql]             (KEEP — untouched)
│
└── docs/
    ├── REPOSITORY_AUDIT.md         (this file)
    ├── PROJECT_CONTEXT.md
    ├── ARCHITECTURE.md
    ├── DATABASE_DESIGN.md
    ├── AGENT_DESIGN.md
    ├── UI_DESIGN.md
    ├── IMPLEMENTATION_PLAN.md
    ├── AI_HANDOFF.md
    └── CHANGELOG.md
```

---

## 10. Summary Classification Table

| File | Classification |
|---|---|
| `lib/agent/runAgent.ts` | A — MUST KEEP |
| `lib/agent/defineTool.ts` | A — MUST KEEP |
| `lib/agent/types.ts` | A — MUST KEEP |
| `lib/supabase.ts` | A — MUST KEEP |
| `lib/gemini.ts` | A — MUST KEEP |
| `lib/auth.ts` | A — MUST KEEP |
| `lib/env.ts` | A — MUST KEEP |
| `lib/dates.ts` | A — MUST KEEP |
| `proxy.ts` | B — MODIFY (rename to middleware.ts, export as `middleware`) |
| `app/api/agent/route.ts` | A — MUST KEEP |
| `app/api/health/route.ts` | A — MUST KEEP |
| `app/api/login/route.ts` | A — MUST KEEP |
| `app/api/logout/route.ts` | A — MUST KEEP |
| `app/login/page.tsx` | A — MUST KEEP (restyle) |
| `app/layout.tsx` | B — MODIFY (title update) |
| `app/page.tsx` | B — MODIFY (replace content) |
| `app/globals.css` | A — MUST KEEP |
| `next.config.ts` | A — MUST KEEP |
| `tsconfig.json` | A — MUST KEEP |
| `postcss.config.mjs` | A — MUST KEEP |
| `.env.example` | A — MUST KEEP |
| `.gitignore` | A — MUST KEEP |
| `lib/agent/tools.ts` | B — MODIFY (replace with 6 PS7 tools) |
| `lib/agent/systemPrompt.ts` | B — MODIFY (RouteWise prompt) |
| `lib/schemas.ts` | B — MODIFY (add PS7 schemas) |
| `components/AgentChat.tsx` | B — MODIFY (update prompts + branding) |
| `components/TaskList.tsx` | C — SAFE TO REMOVE |
| `app/api/tasks/route.ts` | C — SAFE TO REMOVE |
| `seed/00_starter_example.sql` | A — MUST KEEP |
| `seed/ps7_delivery_dispatch.sql` | A — MUST KEEP |
| `seed/[other ps*.sql]` | D — OPTIONAL / UNUSED |
| `README.md` | B — MODIFY (RouteWise instructions) |

