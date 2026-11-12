# RouteWise – AI-Powered Delivery Dispatch Agent

**SRM Agentic AI Hackathon | Problem Statement PS7 – Delivery Dispatch Agent**

An autonomous logistics dispatch assistant designed for Anitha V (Dispatcher ID: `D01`), Chennai Delivery Hub.

---

## Team Members & Responsibilities

| Team Member | Registration Number | Role | Responsibilities |
|---|---|---|---|
| Sigeni Tejas | RA2411003011282 | Team Lead & Database Integration | Project architecture, GitHub repository management, Supabase integration, database design, system integration, testing and Vercel deployment. |
| Saket Badie | RA2411003011271 | Frontend Developer | Next.js UI, dashboard development, responsive design, delivery management interface, rider management and AI chat interface. |
| Pranav J | RA2411003011292 | Backend & API Developer | Next.js API routes, backend architecture, request handling, Zod validation, API integration and error handling. |
| Anil | RA2411003011098 | AI Agent Engineer | Gemini API integration, function calling, agent execution loop, tool definitions, system instructions and autonomous dispatch workflows. |

**Team Objective:** Develop a functional, secure and intelligent logistics dispatch platform that automates delivery allocation, rider capacity management and failed delivery rescheduling using Agentic AI.

---

## 1. Project Overview

RouteWise replaces manual spreadsheet-based delivery coordination with an autonomous AI-powered dispatch assistant.

The system enables dispatchers to communicate using natural language. Powered by Google Gemini Function Calling and backed by Supabase PostgreSQL, RouteWise retrieves pending deliveries, identifies eligible riders, evaluates delivery capacity, assigns parcels and reschedules failed deliveries.

Unlike conventional chatbot applications, RouteWise performs actual database operations through validated backend tools.

Every successful assignment and rescheduling operation is validated against the logistics business rules before being committed to the database.

**Our goal:** Reduce manual dispatch effort, improve rider utilization, prevent incorrect assignments and ensure failed deliveries receive appropriate follow-up.

---

## 2. Problem Statement

The Chennai delivery hub currently relies on manual spreadsheet-based delivery coordination.

This creates several operational challenges:

- Uneven distribution of deliveries among riders.
- Rider capacity being exceeded.
- Deliveries assigned to riders belonging to incorrect zones.
- Assignments made without checking rider shift schedules.
- Failed deliveries being forgotten instead of rescheduled.
- Increased manual effort for dispatchers.

RouteWise addresses these challenges through an AI agent that understands dispatcher instructions and performs validated logistics operations.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Frontend | React 19 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript Strict Mode |
| Database | Supabase PostgreSQL |
| Database SDK | Supabase JavaScript SDK |
| AI Provider | Google Gemini |
| AI SDK | `@google/genai` |
| AI Model | Gemini 2.5 Flash |
| Agent Architecture | Gemini Native Function Calling |
| Validation | Zod v4 |
| Authentication | Passcode-based cookie authentication |
| Version Control | Git and GitHub |
| Deployment | Vercel |

---

## 4. Core Features

### 4.1 AI Dispatch Assistant – `/dispatch`

- Natural-language interaction with the logistics dispatcher.
- Autonomous tool selection using Gemini Function Calling.
- Sequential multi-round tool execution with a maximum of five rounds.
- Automatic retrieval of pending deliveries.
- Rider availability and workload evaluation.
- Validated delivery assignments.
- Failed delivery retrieval and rescheduling.
- Tool execution activity panel.
- Execution status, arguments and database response visibility.
- Suggested prompts for common dispatch operations.

### 4.2 Operational Dashboard – `/dashboard`

- Today's total deliveries.
- Pending deliveries.
- Assigned deliveries.
- Out-for-delivery count.
- Delivered count.
- Failed deliveries.
- Zone-wise pending delivery distribution.
- Active riders and capacity statistics.
- Delivery success rate indicators.

### 4.3 Deliveries Management – `/deliveries`

- Complete delivery inventory.
- Status-based filtering.
- Delivery date filtering.
- Zone filtering.
- Customer address information.
- Priority indicators.
- Assigned rider details.
- Delivery attempt counters.

Supported statuses:

- Pending
- Assigned
- Out for Delivery
- Delivered
- Failed

### 4.4 Riders Management – `/riders`

- Rider information and contact details.
- Home zone information.
- Vehicle type.
- Shift schedule.
- Current delivery workload.
- Maximum delivery capacity.
- Remaining available capacity.
- Visual capacity indicators.

### 4.5 Activity Audit Log – `/activity`

- Chronological record of dispatcher interactions.
- Agent execution history.
- Tool parameters.
- Execution results.
- Database operation outcomes.
- Final AI responses.

---

## 5. AI Agent Architecture

RouteWise uses Gemini Native Function Calling to enable autonomous logistics operations.

The architecture follows this workflow:

1. Dispatcher submits a natural-language request.
2. Next.js API receives the request.
3. Gemini analyses the request.
4. Gemini independently selects the appropriate tool.
5. Backend validates tool arguments using Zod.
6. Backend executes the requested operation.
7. Supabase retrieves or updates database records.
8. Tool results are returned to Gemini.
9. Gemini can request additional tools when necessary.
10. The final response is displayed to the dispatcher.

The agent supports a maximum of five tool-calling rounds per request.

Gemini does not access Supabase directly. All database operations are executed by the application's server-side backend.

---

## 6. The Six Agent Tools

| No. | Tool | Operation | Description |
|---|---|---|---|
| 1 | `getPendingDeliveries` | Read | Retrieves pending deliveries by zone, date and time window. |
| 2 | `getAvailableRiders` | Read | Retrieves eligible riders based on zone, shift and availability. |
| 3 | `getRiderLoad` | Read | Calculates a rider's current workload and remaining capacity. |
| 4 | `assignDelivery` | Write | Assigns a delivery using the PostgreSQL `assign_delivery()` function. |
| 5 | `rescheduleDelivery` | Write | Reschedules failed deliveries using `reschedule_delivery()`. |
| 6 | `getFailedDeliveries` | Read | Retrieves failed deliveries and their attempt history. |

All tool arguments are validated through Zod before execution.

Database writes are performed through server-side operations and their results are returned to Gemini.

---

## 7. Database Architecture

RouteWise uses Supabase PostgreSQL as its primary database.

### Database tables

| Table | Purpose |
|---|---|
| `zones` | Stores delivery zones. |
| `riders` | Stores rider information, vehicle details and capacity. |
| `rider_shifts` | Stores rider shift schedules. |
| `deliveries` | Stores delivery information and assignment status. |
| `delivery_attempts` | Tracks delivery attempts and outcomes. |

### Database functions

- `assign_delivery()`
- `reschedule_delivery()`

These functions enforce important business constraints at the database level.

---

## 8. Business Rules

RouteWise enforces the following logistics constraints:

1. **Zone Matching:** Riders can only accept deliveries belonging to their assigned home zone.
2. **Shift Verification:** Riders must have a valid shift on the delivery assignment date.
3. **Capacity Restriction:** A rider cannot exceed their maximum delivery capacity.
4. **Pending Requirement:** Only eligible pending deliveries can be assigned.
5. **Attempt Restriction:** A delivery can have a maximum of three delivery attempts.
6. **Rescheduling Restriction:** Only eligible failed deliveries can be rescheduled.
7. **Database Validation:** Assignment and rescheduling operations must pass database-level validation.

These restrictions prevent the AI agent from performing invalid logistics operations.

---

## 9. Project Structure

```text
RouteWise/
│
├── app/
│   ├── activity/
│   │   └── page.tsx
│   ├── api/
│   │   ├── agent/
│   │   │   └── route.ts
│   │   ├── deliveries/
│   │   │   └── route.ts
│   │   ├── health/
│   │   │   └── route.ts
│   │   ├── login/
│   │   │   └── route.ts
│   │   ├── logout/
│   │   │   └── route.ts
│   │   ├── riders/
│   │   │   └── route.ts
│   │   └── stats/
│   │       └── route.ts
│   ├── dashboard/
│   ├── deliveries/
│   ├── dispatch/
│   ├── login/
│   ├── riders/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── dashboard/
│   ├── deliveries/
│   ├── dispatch/
│   ├── layout/
│   └── riders/
│
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── AGENT_DESIGN.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── AI_HANDOFF.md
│
├── lib/
│   ├── agent/
│   │   ├── runAgent.ts
│   │   ├── tools.ts
│   │   ├── defineTool.ts
│   │   └── systemPrompt.ts
│   ├── auth.ts
│   ├── dates.ts
│   ├── env.ts
│   ├── gemini.ts
│   ├── schemas.ts
│   ├── supabase.ts
│   └── utils.ts
│
├── seed/
│   ├── 00_starter_example.sql
│   └── ps7_delivery_dispatch.sql
│
├── middleware.ts
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

*The structure above represents the intended project organization. Refer to the actual repository for the final file inventory.*

---

## 10. Installation and Setup

### Prerequisites

- Node.js 20 or later.
- npm.
- Git.
- Supabase account.
- Google AI Studio account.

### Step 1: Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure Supabase

1. Create a Supabase project.
2. Select the Mumbai region.
3. Open the SQL Editor.
4. Execute `seed/00_starter_example.sql` first, if included in the repository.
5. Execute `seed/ps7_delivery_dispatch.sql`.
6. Verify that all required tables and database functions have been created.

### Step 4: Configure Gemini API

1. Visit https://aistudio.google.com/
2. Generate a Gemini API key.
3. Store it in your local environment configuration.

### Step 5: Environment variables

Create `.env.local` in the project root.

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret_key

APP_PASSCODE=your_team_passcode
```

Use the exact variable names required by the existing application configuration.

**Security:** Never commit `.env.local` or expose the Supabase secret key and Gemini API key in client-side code.

### Step 6: Start the development server

```bash
npm run dev
```

Open:

http://localhost:3000

### Step 7: Production build

```bash
npm run build
npm start
```

---

## 11. Verification and Testing

The following scenarios are designed to verify the application's agentic workflow.

| Test | Dispatcher Request | Expected Behaviour |
|---|---|---|
| TEST 1 | Which riders have free capacity today? | Retrieves eligible riders and their workload. |
| TEST 2 | Assign all pending Velachery deliveries for this evening. | Retrieves deliveries, checks riders and executes valid assignments. |
| TEST 3 | Show me all failed deliveries. | Retrieves failed deliveries and attempt history. |
| TEST 4 | Reschedule yesterday's failed deliveries to tomorrow morning. | Checks eligibility and executes valid rescheduling operations. |
| TEST 5 | Assign a delivery to a rider from another zone. | Database rejects the invalid assignment. |
| TEST 6 | Assign more deliveries than a rider's capacity. | Database prevents capacity violation. |
| TEST 7 | Assign the deliveries. | Agent requests clarification when the request is ambiguous. |

Additional testing includes:
- Invalid tool arguments.
- Missing database records.
- API failures.
- Gemini API failures.
- Duplicate assignment attempts.
- Authentication checks.
- Responsive UI testing.
- Production deployment verification.

---

## 12. Deployment

RouteWise is designed for deployment on Vercel.

Deployment process:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Deploy the Next.js application.
5. Verify Supabase connectivity.
6. Verify Gemini Function Calling.
7. Test actual delivery assignment and rescheduling operations.

Production deployment must be verified using the live application.

---

## 13. Expected Outcomes

RouteWise aims to provide:

- Reduced manual dispatcher workload.
- Improved rider utilization.
- More efficient delivery allocation.
- Prevention of incorrect zone assignments.
- Capacity-aware dispatch operations.
- Automated failed delivery recovery.
- Transparent and auditable AI operations.
- Natural-language interaction with logistics systems.

---

## 14. Conclusion

RouteWise demonstrates how Agentic AI can be applied to real-world logistics operations.

By combining Gemini Function Calling, Next.js, Supabase PostgreSQL and database-level business-rule enforcement, the application moves beyond conversational AI and enables autonomous operational decision-making.

The project focuses on building a practical system where AI understands dispatcher requirements, selects appropriate tools, executes validated database operations and communicates the results transparently.

**RouteWise – Smarter Dispatch. Better Utilization. Reliable Deliveries.**

---

**Developed for:** SRM Agentic AI Hackathon  
**Problem Statement:** PS7 – Delivery Dispatch Agent  
**Institution:** SRM Institute of Science and Technology, Kattankulathur  
**Team:** RouteWise Development Team
