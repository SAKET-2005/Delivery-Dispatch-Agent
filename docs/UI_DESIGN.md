# UI Design — RouteWise

## 1. Design Philosophy

RouteWise looks like a **professional SaaS logistics operations platform**, not a generic AI chatbot demo. The visual language draws from real-world dispatch and fleet management tools.

**Principles:**
- Information density without clutter
- Status at a glance (colour-coded badges)
- The AI is a panel within a larger operational workspace, not the entire app
- Every number on screen comes from real Supabase data
- Professional typography, consistent spacing, restrained colour

---

## 2. Colour Palette

```
Background:     #F8FAFC  (slate-50)
Surface/Card:   #FFFFFF  (white)
Sidebar bg:     #0F172A  (slate-900)
Sidebar text:   #94A3B8  (slate-400)
Sidebar active: #FFFFFF  (white)
Sidebar accent: #3B82F6  (blue-500)
Border:         #E2E8F0  (slate-200)
Text primary:   #0F172A  (slate-900)
Text secondary: #64748B  (slate-500)

Status colours:
  pending:          bg-amber-50   text-amber-700   border-amber-200
  assigned:         bg-blue-50    text-blue-700    border-blue-200
  out_for_delivery: bg-indigo-50  text-indigo-700  border-indigo-200
  delivered:        bg-green-50   text-green-700   border-green-200
  failed:           bg-red-50     text-red-700     border-red-200
  returned:         bg-slate-50   text-slate-600   border-slate-200

Capacity bar:
  0-50%:   bg-green-500
  51-80%:  bg-amber-500
  81-100%: bg-red-500
```

---

## 3. Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (w-56, fixed left, full height)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🚚 RouteWise                                          │ │
│  │     Chennai Hub                                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  ○ Overview (Dashboard)                                │ │
│  │  ● AI Dispatch  ← active                               │ │
│  │  ○ Deliveries                                          │ │
│  │  ○ Riders                                              │ │
│  │  ○ Activity                                            │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Anitha V · D01                                        │ │
│  │  [Log out]                                             │ │
│  └────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  MAIN CONTENT AREA (flex-1, overflow-auto)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TOP NAV: "Overview" title  |  12 Nov 2026  |  🔔      │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  [page content]                                        │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Page Designs

### 4.1 Dashboard (`/dashboard`)

```
[KPI CARDS ROW]
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Total    │ │ Pending  │ │ Assigned │ │ Out for  │ │Delivered │ │  Failed  │
│ 21       │ │ 11       │ │ 5        │ │ delivery │ │ 1        │ │ 3        │
│ today    │ │ ⚠ action │ │          │ │ 2        │ │          │ │ ⚠ urgent │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

[TWO-COLUMN DISPATCH OVERVIEW]
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Pending Assignments          │  │ Rider Availability           │
│ ─────────────────────────── │  │ ─────────────────────────── │
│ Z1 Velachery  2 deliveries   │  │ Suresh Kumar   Z1  5/6 ████▒│
│ Z2 Adyar      2 deliveries   │  │ M. Irfan       Z2  0/6 ░░░░░│
│ Z3 Anna Nagar 2 deliveries   │  │ Vignesh M      Z3  1/12████░│
│ Z4 T Nagar    2 deliveries   │  │ Kavya S        Z4  0/6 ░░░░░│
│ Z5 Tambaram   1 delivery     │  │ Ramesh B       Z5  1/12████░│
└──────────────────────────────┘  └──────────────────────────────┘

[FAILED DELIVERIES REQUIRING ATTENTION]
┌──────────────────────────────────────────────────────────────┐
│ Failed Deliveries                                            │
│ ─────────────────────────────────────────────────────────── │
│ ORD-4990  Karthik Raja  Z1 Velachery  1/3 attempts  ⚠ Reschedule │
│ ORD-4991  Swathi P      Z2 Adyar      2/3 attempts  ⚠ Reschedule │
│ ORD-4992  Naveen J      Z3 Anna Nagar 3/3 attempts  🚫 Return    │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 AI Dispatch (`/dispatch`)

Full-height layout. Left column = chat. Right column = live context panel.

```
┌─────────────────────────────────┬──────────────────────────┐
│ AI DISPATCH ASSISTANT           │ QUICK CONTEXT            │
│ ─────────────────────────────── │ ─────────────────────── │
│                                 │ Today's Pending: 11      │
│ [Suggested prompts when empty]  │ Failed: 3                │
│ • "Assign pending Velachery..." │ Riders on shift: 6       │
│ • "Show failed deliveries"      │                          │
│ • "What's Suresh's load?"       │ Zones with pending:      │
│                                 │ Z1 ██ 2  Z2 ██ 2        │
│ [Chat messages]                 │ Z3 ██ 2  Z4 ██ 2        │
│                                 │ Z5 █ 1                   │
│ User: Assign all pending        │                          │
│       Velachery deliveries      │                          │
│       for this evening          │                          │
│                                 │                          │
│ ┌─ Agent Activity ────────────┐ │                          │
│ │ ✅ getPendingDeliveries     │ │                          │
│ │ ✅ getAvailableRiders       │ │                          │
│ │ ✅ getRiderLoad             │ │                          │
│ │ ✅ assignDelivery [writes]  │ │                          │
│ └─────────────────────────────┘ │                          │
│                                 │                          │
│ Agent: I assigned ORD-5006 to   │                          │
│ Suresh Kumar (now 6/6 capacity).│                          │
│ ORD-5007 could not be assigned  │                          │
│ — R01 is now full and no other  │                          │
│ Velachery rider has a shift     │                          │
│ today.                          │                          │
│                                 │                          │
│ ─────────────────────────────── │                          │
│ [Type your request...]  [Send]  │                          │
└─────────────────────────────────┴──────────────────────────┘
```

**Sample prompts (displayed when chat is empty):**
1. "Assign all pending Velachery deliveries for this evening"
2. "Show all failed deliveries that can be rescheduled"
3. "Reschedule yesterday's failed Adyar deliveries to tomorrow morning"
4. "Which riders have free capacity today?"
5. "What is Suresh Kumar's current workload?"

### 4.3 Deliveries Board (`/deliveries`)

```
[FILTER BAR]
Search: [____________]  Zone: [All ▼]  Date: [Today ▼]  Status: [All ▼]

[STATUS TABS]
[All (21)] [Pending (11)] [Assigned (5)] [Out for Delivery (2)] [Delivered (1)] [Failed (3)]

[TABLE]
Order Ref  │ Customer       │ Zone          │ Date    │ Window    │ Rider        │ Status     │ Attempts
───────────┼────────────────┼───────────────┼─────────┼───────────┼──────────────┼────────────┼─────────
ORD-5001   │ Nisha K        │ Z1 Velachery  │ Today   │ morning   │ Suresh Kumar │ 🟣 Out     │ 0
ORD-5002   │ Arun Prakash   │ Z1 Velachery  │ Today   │ morning   │ Suresh Kumar │ 🔵 Assigned│ 0
ORD-5006   │ Balaji T       │ Z1 Velachery  │ Today   │ evening   │ —            │ 🟡 Pending │ 0
ORD-4990   │ Karthik Raja   │ Z1 Velachery  │ Yest.   │ evening   │ Suresh Kumar │ 🔴 Failed  │ 1
```

### 4.4 Riders (`/riders`)

```
[FILTER BAR]
Zone: [All ▼]  Shift today: [All ▼]

[TABLE]
Rider      │ ID  │ Zone          │ Vehicle  │ Shift Today   │ Load       │ Status
───────────┼─────┼───────────────┼──────────┼───────────────┼────────────┼────────
Suresh K.  │ R01 │ Z1 Velachery  │ 🏍 Bike  │ 08:00 – 17:00│ ████████ 5/6 83%  │ On Shift
Lakshmi P. │ R02 │ Z1 Velachery  │ 🛵 Scoot │ No shift      │ — / 5          │ Off Today
M. Irfan   │ R03 │ Z2 Adyar      │ 🏍 Bike  │ 09:00 – 18:00│ ░░░░░░░░ 0/6  0%  │ On Shift
...
Gokul P.   │ R08 │ Z2 Adyar      │ 🏍 Bike  │ No shift      │ — / 6          │ Inactive
```

Capacity bar:
- Green (0–50%): rider has plenty of room
- Amber (51–80%): getting busy
- Red (81–100%): nearly or fully full

### 4.5 Activity Log (`/activity`)

Displays past agent interactions with full tool execution details. This is primarily for hackathon judges to verify the agent is real.

```
[Today's Agent Activity]

11:23 AM — Dispatcher: "Assign all pending Velachery deliveries for this evening"
  ├── ✅ getPendingDeliveries({ zone_id: "Z1", delivery_date: "2026-11-12", time_window: "evening" })
  │      → 2 deliveries found
  ├── ✅ getAvailableRiders({ zone_id: "Z1", date: "2026-11-12" })
  │      → 1 rider: Suresh Kumar (5/6 capacity)
  ├── ✅ getRiderLoad({ rider_id: "R01", date: "2026-11-12" })
  │      → 5 active, 1 remaining
  ├── ✅ assignDelivery({ delivery_id: 103, rider_id: "R01" }) [WRITES DATA]
  │      → ORD-5006 assigned to Suresh Kumar (6/6)
  └── Agent: "Assigned ORD-5006 to Suresh Kumar. R01 is now at full capacity..."
```

---

## 5. Component Specifications

### KpiCard
```tsx
interface KpiCardProps {
  label: string;
  value: number;
  highlight?: "warning" | "danger" | "success" | "normal";
  icon?: React.ReactNode;
}
```

Renders a white card with large number, label, optional coloured left border.

### StatusBadge
```tsx
// Maps status string to Tailwind classes
const STATUS_CONFIG = {
  pending:          { label: "Pending",      classes: "bg-amber-50 text-amber-700 border-amber-200" },
  assigned:         { label: "Assigned",     classes: "bg-blue-50 text-blue-700 border-blue-200" },
  out_for_delivery: { label: "Out",          classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered:        { label: "Delivered",    classes: "bg-green-50 text-green-700 border-green-200" },
  failed:           { label: "Failed",       classes: "bg-red-50 text-red-700 border-red-200" },
  returned:         { label: "Returned",     classes: "bg-slate-50 text-slate-600 border-slate-200" },
};
```

### CapacityBar
```tsx
// Renders a coloured progress bar based on active/capacity ratio
<CapacityBar active={5} capacity={6} />
// Shows: ████████▒ 5/6  (red because 83%)
```

### DispatchChat
Based on the existing `AgentChat.tsx` pattern. Key additions:
- RouteWise-branded header
- Delivery-specific sample prompts
- Tool steps rendered as `ToolActivityPanel`
- Triggers `onDataChanged` when writes succeed (refreshes KPIs, deliveries, riders)

### ToolActivityPanel (upgraded from ToolSteps in starter)
```
┌─────────────────────────────────────────────────┐
│ ✅ getPendingDeliveries                          │
│    Args: { zone_id: "Z1", delivery_date: "..." }│
│    Result: 2 deliveries                         │
├─────────────────────────────────────────────────┤
│ ✅ assignDelivery  [writes data]                 │
│    Args: { delivery_id: 103, rider_id: "R01" }  │
│    Result: { order_ref: "ORD-5006", rider: ...  │
└─────────────────────────────────────────────────┘
```

---

## 6. Responsive Behaviour

| Breakpoint | Layout |
|---|---|
| Mobile (<768px) | Sidebar hidden (hamburger or bottom nav), single column |
| Tablet (768-1024px) | Sidebar narrow (icons only), content full width |
| Desktop (>1024px) | Full sidebar + content side by side |

The app is primarily designed for desktop (dispatcher at a workstation) but must not break on mobile.

---

## 7. Loading and Error States

Every data-fetching component handles:
- **Loading:** skeleton placeholder (grey animated bars) or spinner
- **Error:** red border card with message + retry button
- **Empty:** friendly empty state with contextual message

Agent processing state:
- Typing indicator while agent is running
- "Agent is working..." spinner in the chat
- Each tool step appears progressively (or all at once when response arrives)

