# Architecture — RouteWise

## 1. High-Level Request Flow

```
Dispatcher (Anitha V)
       │  natural language message
       ▼
Next.js Frontend (React, Tailwind)
  DispatchChat component
       │  POST /api/agent  { messages: [...] }
       ▼
Next.js API Route Handler
  app/api/agent/route.ts
  - Zod validates request shape
  - Calls runAgent()
       │
       ▼
Gemini Agent Loop  (server-only)
  lib/agent/runAgent.ts
  - Builds contents array from chat history
  - Sends to Gemini with tool declarations
       │
       ▼
Google Gemini API
  - Reads system prompt + tool descriptions
  - Returns: text reply OR function call(s)
       │
       ├─── if text → return { reply, steps }
       │
       └─── if function call(s)
              │
              ▼
         runTool()  in runAgent.ts
         - Looks up tool by name
         - Zod validates args (never trust the model)
         - Calls tool.run(args)
              │
              ▼
         Tool Implementation  lib/agent/tools.ts
         - server-only
         - Calls getSupabase() for reads
         - Calls rpc('assign_delivery') or rpc('reschedule_delivery') for writes
              │
              ▼
         Supabase PostgreSQL
         - Database functions enforce ALL business rules
         - Returns JSON result or raises exception
              │
              ▼
         Tool result / error
              │
              ▼
         Appended to contents as functionResponse
              │
              ▼
         Next round → Gemini reads result
              │
              ▼ (after final text or max 5 rounds)
  AgentResult { reply: string, steps: AgentStep[] }
       │
       ▼
Next.js API Route Handler
  Returns JSON to frontend
       │
       ▼
Next.js Frontend
  DispatchChat renders reply + ToolActivityPanel (each step)
  Other panels (Deliveries, Riders, Stats) refresh via refreshKey
```

---

## 2. Security Architecture

```
Browser (client)
  ├── CANNOT access GEMINI_API_KEY (server-only)
  ├── CANNOT access SUPABASE_SECRET_KEY (server-only)
  ├── CANNOT call Gemini directly
  ├── CANNOT call Supabase directly (RLS blocks anon)
  └── CAN only call /api/* routes (protected by middleware)

middleware.ts (renamed from proxy.ts)
  └── Validates session cookie (SHA-256 of APP_PASSCODE)
      ├── Valid → NextResponse.next()
      └── Invalid → redirect to /login (pages) or 401 (api/*)

Server (api routes + lib/)
  ├── lib/gemini.ts     — GEMINI_API_KEY (never reaches browser)
  ├── lib/supabase.ts   — SUPABASE_SECRET_KEY (never reaches browser)
  └── import "server-only" — build-time enforcement
```

---

## 3. Component Architecture

### App Shell (layout)
```
app/layout.tsx
  └── <html><body>
        └── {children}

Each authenticated page:
  <AppShell>          components/layout/AppShell.tsx
    <Sidebar />       components/layout/Sidebar.tsx
    <TopNav />        components/layout/TopNav.tsx
    <main>
      {page content}
    </main>
  </AppShell>
```

### Pages

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Redirect → `/dashboard` |
| `/login` | `app/login/page.tsx` | Passcode gate |
| `/dashboard` | `app/dashboard/page.tsx` | KPI cards + overview |
| `/dispatch` | `app/dispatch/page.tsx` | Full-screen AI chat |
| `/deliveries` | `app/deliveries/page.tsx` | Deliveries board |
| `/riders` | `app/riders/page.tsx` | Riders management |
| `/activity` | `app/activity/page.tsx` | Agent activity history |

### API Routes

| Endpoint | Handler | Purpose |
|---|---|---|
| `POST /api/agent` | `app/api/agent/route.ts` | Gemini agent (keep as-is) |
| `GET /api/stats` | `app/api/stats/route.ts` | Dashboard KPI counts |
| `GET /api/deliveries` | `app/api/deliveries/route.ts` | Deliveries list with filters |
| `GET /api/riders` | `app/api/riders/route.ts` | Riders with shift + load info |
| `GET /api/health` | `app/api/health/route.ts` | Environment check |
| `POST /api/login` | `app/api/login/route.ts` | Passcode authentication |
| `POST /api/logout` | `app/api/logout/route.ts` | Session clear |

---

## 4. Agent Architecture

```
lib/agent/
  defineTool.ts   — AgentTool type, defineTool(), toFunctionDeclarations()
  runAgent.ts     — Gemini loop, runTool(), Zod validation, step tracking
  systemPrompt.ts — buildSystemPrompt() with today's date, business rules
  tools.ts        — 6 RouteWise tools registered with Gemini
  types.ts        — AgentStep, AgentResult types
```

### Tool Registry (tools.ts)
```
getPendingDeliveries   reads: deliveries + zones
getAvailableRiders     reads: riders + rider_shifts
getRiderLoad           reads: deliveries (count)
assignDelivery         WRITES: rpc('assign_delivery')
rescheduleDelivery     WRITES: rpc('reschedule_delivery')
getFailedDeliveries    reads: deliveries + delivery_attempts
```

### Agent Loop (runAgent.ts — unchanged)
- Maximum 5 rounds
- Round: Gemini call → function calls or final text
- For each function call: Zod validate → tool.run() → functionResponse
- Steps array tracks every tool call for the activity UI

---

## 5. Data Flow for a Typical Dispatch Operation

**Example:** "Assign all pending Velachery deliveries for this evening"

```
Round 1:
  Gemini receives: message + 6 tool descriptions
  Gemini decides: call getPendingDeliveries({ zone: "Z1", delivery_date: "2026-11-12", time_window: "evening" })
  runTool: Zod validates → executes Supabase query
  Result: [{ id: 103, order_ref: "ORD-5006" }, { id: 104, order_ref: "ORD-5007" }]
  functionResponse appended to contents

Round 2:
  Gemini receives: tool result
  Gemini decides: call getAvailableRiders({ zone: "Z1", date: "2026-11-12" })
  runTool: Zod validates → Supabase query on riders + rider_shifts
  Result: [{ id: "R01", name: "Suresh Kumar", capacity: 6, ... }]
  functionResponse appended

Round 3:
  Gemini decides: call getRiderLoad({ rider_id: "R01", date: "2026-11-12" })
  Result: { assigned: 5, capacity: 6, remaining: 1 }
  functionResponse appended

Round 4:
  Gemini decides: call assignDelivery({ delivery_id: 103, rider_id: "R01", assignment_date: "2026-11-12" })
  runTool: Zod validates → rpc('assign_delivery', { p_delivery_id: 103, p_rider_id: 'R01' })
  Supabase DB function: checks zone ✓, shift ✓, capacity (5<6) ✓ → updates delivery → returns JSON
  Result: { delivery_id: 103, order_ref: "ORD-5006", rider: "Suresh Kumar", rider_load: 6, capacity: 6 }

  Gemini also decides: ORD-5007 → R01 is now full → cannot assign
  Gemini picks no more assignDelivery calls (or tries and gets DB error)

Round 5:
  Gemini produces final text reply explaining what was done
  Returns: { reply: "...", steps: [4 steps] }
```

---

## 6. State Management

**No global state library needed.** Pattern used in starter:

```
Page component
  └── refreshKey (useState)
        ├── Passed to data-panel components
        └── Incremented by DispatchChat when agent writes data (s.writes && s.ok)
              └── Data panels re-fetch from API when refreshKey changes
```

This is a simple, effective pattern. No Redux, Zustand, or React Query needed.

---

## 7. Deployment Architecture (Vercel)

```
GitHub Repository
  └── Vercel Project
        ├── Build: next build (TypeScript check included)
        ├── Runtime: Vercel Edge / Node (API routes use nodejs runtime)
        ├── Environment Variables:
        │     GEMINI_API_KEY
        │     GEMINI_MODEL
        │     SUPABASE_URL
        │     SUPABASE_SECRET_KEY
        │     APP_PASSCODE
        └── Database: Supabase (external, always-on)
```

All API routes use `export const runtime = "nodejs"` for Supabase/Gemini compatibility (not Edge runtime).

