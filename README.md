# RouteWise — AI-Powered Delivery Dispatch Agent

> **SRM Agentic AI Hackathon** | **Problem Statement PS7**  
> Autonomous logistics dispatch assistant for **Anitha V** (Dispatcher ID: `D01`), Chennai Delivery Hub.

---

## Overview

RouteWise replaces manual spreadsheet-based delivery coordination with an autonomous AI dispatch agent. Powered by Google Gemini with native function calling and backed by Supabase PostgreSQL, the agent validates business rules, evaluates rider capacity, assigns pending parcels, and reschedules failed deliveries with full auditability.

Every action performed by RouteWise executes real database queries and stored procedures—never simulated text.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI & Components:** React 19, Tailwind CSS v4
- **Language:** TypeScript (Strict Mode)
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **AI SDK:** Google Gen AI SDK (`@google/genai` v3)
- **AI Model:** Google Gemini (`gemini-2.5-flash`)
- **Agent Pattern:** Gemini Native Function Calling with Multi-Round Tool Loop (Max 5 Rounds)
- **Schema Validation:** Zod v4 (runtime argument checking)
- **Security:** Passcode-gated cookie authentication with SHA-256 session hashing

---

## Core Capabilities & Features

### 1. AI Dispatch Assistant (`/dispatch`)
- Conversational command interface powered by Gemini 2.5 Flash.
- **Autonomous Tool Selection:** Gemini decides when and which tools to call without hardcoded keyword rules.
- **Sequential Multi-Round Execution:** Chained queries and writes up to 5 rounds (e.g. query pending → find riders → check capacity → assign).
- **Interactive Tool Activity Panel:** Live drawer inspecting tool arguments, execution status, and raw database responses.
- Pre-populated test scenario quick buttons.

### 2. Operational Dashboard (`/dashboard`)
- Real-time KPI summary: Today's Total, Pending, Assigned, Out for Delivery, Delivered, and Failed counts.
- Zone-by-zone pending distribution across Chennai (Velachery, Adyar, Anna Nagar, T Nagar, Tambaram).
- Operational fleet metrics: Active riders on shift, delivery success rate progress bar.

### 3. Deliveries Board (`/deliveries`)
- Complete delivery inventory with status tabs (`All`, `Pending`, `Assigned`, `Out for Delivery`, `Delivered`, `Failed`).
- Filtering by delivery date and zone.
- Visual status badges, priority levels (`low`, `medium`, `high`, `urgent`), customer addresses, and attempt counters.

### 4. Riders Management (`/riders`)
- Active fleet roster with contact details, vehicle type icons (`bike`, `scooter`, `van`), and home zone.
- Real-time **Capacity Bars** showing active workload vs max capacity (color-coded thresholds: green < 50%, yellow 50-80%, red > 80%).
- Shift schedule indicators for the current date.

### 5. Activity Audit Log (`/activity`)
- Persistent chronological record of all dispatcher interactions and tool executions stored locally.
- Detailed trace of tool parameters, database outcomes, and final agent responses.

---

## The 6 Agent Tools

All tools are declared in `lib/agent/tools.ts`, validated with Zod, and converted to Gemini function declarations via `lib/agent/defineTool.ts`.

| # | Tool Name | Mode | Description |
|---|---|---|---|
| 1 | `getPendingDeliveries` | Read | Retrieves pending deliveries for a given zone, date, or time window (`morning`, `afternoon`, `evening`). |
| 2 | `getAvailableRiders` | Read | Returns active riders scheduled on a given date with current workload vs max capacity. |
| 3 | `getRiderLoad` | Read | Returns granular workload breakdown and capacity headroom for a specific rider. |
| 4 | `assignDelivery` | Write | Assigns a pending delivery to a rider via PostgreSQL function `assign_delivery(bigint, text)`. |
| 5 | `rescheduleDelivery` | Write | Reschedules a failed delivery to a new date/window via `reschedule_delivery(bigint, date, text)`. |
| 6 | `getFailedDeliveries` | Read | Lists failed deliveries with attempt history and marks whether they can be rescheduled (`attempts < 3`). |

---

## Business Rules Enforced in PostgreSQL

RouteWise enforces business constraints directly in the database (`seed/ps7_delivery_dispatch.sql`) so the agent cannot violate logistics policies:

1. **Zone Matching:** A rider can only accept deliveries in their home zone (`rider.home_zone == delivery.zone_id`).
2. **Shift Verification:** A rider must have an active shift on the scheduled delivery date in `rider_shifts`.
3. **Capacity Ceiling:** Active deliveries (`assigned` + `out_for_delivery`) cannot exceed the rider's `capacity`.
4. **Pending Requirement:** Only deliveries with `pending` status can be assigned.
5. **Attempt Ceiling:** Deliveries with 3 failed attempts cannot be rescheduled; must be marked returned.
6. **Reschedule Restriction:** Only deliveries with `failed` status can be rescheduled.

---

## Project Structure

```
├── app/
│   ├── activity/page.tsx        # Activity audit log
│   ├── api/
│   │   ├── agent/route.ts       # POST /api/agent (Gemini agent runner)
│   │   ├── deliveries/route.ts  # GET /api/deliveries (filtered orders)
│   │   ├── health/route.ts      # GET /api/health (environment check)
│   │   ├── login/route.ts       # POST /api/login (passcode auth)
│   │   ├── logout/route.ts      # POST /api/logout (session clear)
│   │   ├── riders/route.ts      # GET /api/riders (fleet & load)
│   │   └── stats/route.ts       # GET /api/stats (dashboard KPIs)
│   ├── dashboard/page.tsx       # Operations dashboard
│   ├── deliveries/page.tsx      # Deliveries table view
│   ├── dispatch/page.tsx        # AI dispatch console
│   ├── login/page.tsx           # Authentication screen
│   ├── riders/page.tsx          # Riders fleet view
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Redirect to /dashboard
├── components/
│   ├── dashboard/               # KpiCard, DispatchOverview
│   ├── deliveries/              # DeliveriesTable, StatusBadge
│   ├── dispatch/                # DispatchChat, ToolActivityPanel
│   ├── layout/                  # AppShell, Sidebar, TopNav
│   └── riders/                  # RidersTable, CapacityBar
├── docs/                        # Architecture, database & agent design docs
├── lib/
│   ├── agent/                   # runAgent.ts, tools.ts, defineTool.ts, systemPrompt.ts
│   ├── auth.ts                  # SHA-256 session management
│   ├── dates.ts                 # IST date utilities
│   ├── env.ts                   # Server-side environment reader
│   ├── gemini.ts                # Singleton GoogleGenAI client
│   ├── schemas.ts               # Shared Zod schemas & types
│   ├── supabase.ts              # Server-side Supabase admin client
│   └── utils.ts                 # Classname combiner
├── seed/
│   └── ps7_delivery_dispatch.sql # Complete PostgreSQL schema, functions & seed
├── middleware.ts                # Session authentication gate
├── package.json                 # Dependencies and build scripts
└── README.md                    # This file
```

---

## Setup & Running Locally

### 1. Prerequisites
- Node.js 20 or later
- npm or pnpm
- Supabase account ([supabase.com](https://supabase.com))
- Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
1. Open your Supabase project dashboard -> **SQL Editor**.
2. Open [seed/ps7_delivery_dispatch.sql](seed/ps7_delivery_dispatch.sql).
3. Copy the entire file and execute it in the SQL Editor.
4. This creates tables (`zones`, `riders`, `rider_shifts`, `deliveries`, `delivery_attempts`), stored procedures (`assign_delivery`, `reschedule_delivery`), RLS policies, and seed data.

### 4. Configure Environment Variables
Create `.env.local` in the project root:
```env
# Google AI Studio Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Gemini model (default: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# Supabase Project URL
SUPABASE_URL=https://your-project.supabase.co

# Supabase Service Role Secret Key (Server-only)
SUPABASE_SECRET_KEY=your_supabase_service_role_key

# Team Passcode for dashboard login
APP_PASSCODE=your_team_passcode
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Enter your `APP_PASSCODE` to access RouteWise.

### 6. Production Build
```bash
npm run build
npm start
```

---

## Verification Test Scenarios

Try these exact prompts in `/dispatch` to verify all agent workflows:

| Test | Prompt | Verified Agent Behavior |
|---|---|---|
| **TEST 1** | *"Which riders have free capacity today?"* | Calls `getAvailableRiders`, checks workload against capacity, displays table of available riders. |
| **TEST 2** | *"Assign all pending Velachery deliveries for this evening."* | Calls `getPendingDeliveries` -> `getAvailableRiders` -> `assignDelivery` sequentially. Fills capacity and reports remaining pending orders. |
| **TEST 3** | *"Show me all failed deliveries."* | Calls `getFailedDeliveries`, displays failed parcels with attempt history. |
| **TEST 4** | *"Reschedule yesterday's failed deliveries to tomorrow morning."* | Calls `getFailedDeliveries` -> `rescheduleDelivery`. Reschedules orders under 3 attempts; warns about orders exceeding 3 attempts. |
| **TEST 5** | *"Assign a delivery to a rider from another zone."* | Calls `assignDelivery`. Database function rejects cross-zone assignment; agent explains zone mismatch. |
| **TEST 6** | *"Assign more deliveries than a rider's capacity."* | Calls `assignDelivery`. Database function rejects when rider load = max capacity; agent explains capacity limit. |
| **TEST 7** | *"Assign the deliveries."* | Agent detects ambiguous request; asks for specific zone, date, or order reference before executing tools. |
