# 🚚 RouteWise — AI-Powered Delivery Dispatch Agent

> **SRM Agentic AI Hackathon | Problem Statement PS7 — Delivery Dispatch Agent**

An autonomous logistics dispatch assistant that helps delivery operators manage pending deliveries, identify eligible riders, assign deliveries intelligently and recover failed delivery attempts using natural-language instructions and AI-powered tool execution.

## 🌐 Live Deployment

**Live Application:** https://delivery-dispatch-agent.vercel.app/

The application is deployed on Vercel.

## 📌 Project Overview

RouteWise is an AI-powered delivery dispatch management system designed to simplify last-mile delivery operations.

Traditional delivery dispatch workflows often require operators to manually inspect pending orders, check rider availability, verify delivery zones, consider rider capacity and assign deliveries individually.

RouteWise introduces an Agentic AI assistant that can understand dispatch requests, retrieve operational information, evaluate available riders and execute dispatch actions through connected backend tools.

The system uses Google's Gemini models with function calling to interact with a Supabase PostgreSQL database through validated application tools.

### Example Scenario

A delivery dispatcher, Anitha V (D01), needs to assign pending deliveries in a particular delivery zone.

Instead of manually checking every delivery and rider, she can ask the RouteWise AI assistant:

- "Show me all pending deliveries in Zone 1."
- "Find available riders for these deliveries."
- "Assign the pending deliveries to suitable riders."
- "Show me deliveries that failed today."
- "Reschedule the failed delivery attempts."

The AI assistant understands the request, invokes the relevant tools, retrieves database information and performs permitted operations through validated backend functions.

## 🎯 Problem Statement

**PS7 — Delivery Dispatch Agent**

Develop an autonomous delivery dispatch assistant capable of helping logistics operators manage delivery assignments and exceptions.

The system should:
- Identify pending deliveries.
- Retrieve eligible delivery riders.
- Consider rider availability and delivery capacity.
- Assign deliveries to suitable riders.
- Handle failed delivery attempts.
- Support delivery rescheduling.
- Use an AI agent capable of interacting with operational tools.

RouteWise addresses these requirements through an integrated web application and Agentic AI architecture.

## ✨ Key Features

### 1. 📊 Dispatch Dashboard

- Centralised delivery operations dashboard.
- Overview of delivery statuses.
- Pending, assigned, completed and failed delivery information.
- Rider availability and workload visibility.
- Zone-based operational overview.

### 2. 📦 Delivery Management

- View and manage delivery records.
- Identify pending and failed deliveries.
- Filter delivery information by operational status and zone.
- Track delivery attempts and assignment history.

### 3. 🤖 Agentic AI Dispatch Copilot

The RouteWise AI assistant allows dispatchers to interact with the delivery management system using natural language.

The agent can:
- Understand dispatch-related requests.
- Retrieve delivery information.
- Check rider availability.
- Retrieve zone information.
- Inspect delivery history.
- Assign deliveries through validated backend operations.
- Reschedule failed deliveries.

### 4. 🛵 Rider Management

- View registered delivery riders.
- Check rider availability.
- Inspect rider workloads and delivery assignments.
- Identify riders eligible for new assignments.

### 5. ⚠️ Exception Management

- Identify unsuccessful delivery attempts.
- Retrieve delivery history.
- Support failed-delivery recovery.
- Reschedule deliveries through validated operations.

### 6. 🗺️ Zone-Based Dispatch

- Organise deliveries according to operational zones.
- Retrieve zone information.
- Consider delivery-zone eligibility when selecting riders.

## 🧠 Agentic AI Architecture

RouteWise uses Google's Gemini models with function calling to allow the AI agent to interact with real application tools.

Instead of generating responses from text alone, the agent can request structured operational information and invoke backend functions to perform supported actions.

### AI Agent Tools

| Tool | Description |
|---|---|
| `getDispatchOverview` | Retrieves the overall dispatch summary. |
| `getDeliveries` | Retrieves delivery records based on supported filters. |
| `getAvailableRiders` | Retrieves available riders and their operational information. |
| `getDeliveryHistory` | Retrieves delivery attempt and status history. |
| `getZones` | Retrieves delivery-zone information. |
| `assignDelivery` | Assigns a delivery through a validated backend operation. |
| `rescheduleDelivery` | Reschedules a failed delivery through a validated backend operation. |

### Agent Workflow

1. Dispatcher submits a natural-language request.
2. Gemini interprets the request and identifies the required operation.
3. The model selects the appropriate application tool.
4. The backend validates the requested operation.
5. Supabase retrieves or updates the relevant records.
6. The result is returned to the AI agent.
7. The agent presents the outcome in a human-readable response.

### Example Workflow

`Dispatcher Request → Gemini AI → Tool Selection → Backend Validation → Supabase Database → Tool Result → AI Response`

## 🗄️ Database Architecture

RouteWise uses Supabase PostgreSQL as its operational database.

### Core Database Tables

| Table | Purpose |
|---|---|
| `zones` | Stores delivery-zone information. |
| `riders` | Stores rider details and availability. |
| `rider_shifts` | Maintains rider shift information. |
| `deliveries` | Stores delivery records and assignment information. |
| `delivery_attempts` | Maintains delivery attempt history and outcomes. |

### Database Operations

The application uses Supabase to:
- Retrieve operational delivery information.
- Check rider availability.
- Validate delivery assignment operations.
- Maintain delivery attempt records.
- Support delivery rescheduling.
- Preserve operational consistency through database-side operations.

Assignment and rescheduling operations use validated database operations, including RPC-based workflows where applicable.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js |
| UI Library | React |
| Programming Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Backend Integration | Supabase |
| AI Model | Google Gemini |
| AI Integration | Gemini Function Calling |
| Validation | Zod |
| Deployment | Vercel |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

```text
                 DISPATCH OPERATOR
                        |
                        v
              NEXT.JS WEB APPLICATION
                        |
             +----------+----------+
             |                     |
             v                     v
       DISPATCH DASHBOARD     AI DISPATCH COPILOT
                                   |
                                   v
                              GEMINI AI
                                   |
                           FUNCTION CALLING
                                   |
             +----------+----------+----------+
             |          |          |          |
             v          v          v          v
          Delivery    Rider      Zone      Dispatch
           Tools      Tools      Tools      Tools
             |          |          |          |
             +----------+----------+----------+
                                   |
                                   v
                         BACKEND VALIDATION
                                   |
                                   v
                         SUPABASE POSTGRESQL
                                   |
             +----------+----------+----------+
             |          |          |          |
             v          v          v          v
           Zones      Riders    Deliveries  Attempts
                                   |
                                   v
                            TOOL RESPONSE
                                   |
                                   v
                              GEMINI AI
                                   |
                                   v
                         DISPATCHER RESPONSE
```

## 📂 Project Structure

The project is organised around the Next.js application, reusable UI components, application logic, AI integration and Supabase database configuration.

```text
RouteWise/
│
├── app/
│   ├── (application routes and pages)
│   └── (layout and application entry points)
│
├── components/
│   ├── (dashboard components)
│   ├── (delivery components)
│   ├── (rider components)
│   └── (AI copilot components)
│
├── lib/
│   ├── (Supabase integration)
│   ├── (Gemini integration)
│   ├── (dispatch tools)
│   └── (validation and utilities)
│
├── supabase/
│   └── (database scripts and migrations)
│
├── public/
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.example
└── README.md
```

*Note: The directory overview is logical; retain the actual filenames and folders in the repository when updating this section.*

## ⚙️ Local Installation and Setup

### Prerequisites

- Node.js (LTS recommended).
- npm.
- Git.
- Supabase project.
- Google AI Studio API key.

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd RouteWise
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

Create a Supabase project and open its SQL Editor.

Execute the database scripts in the following order:

1. `00_starter_example.sql`
2. `ps7_delivery_dispatch.sql`

This initializes the required database structure and delivery-dispatch data.

### 4. Configure Environment Variables

Create a `.env.local` file in the project root.

Add the required environment variables using the names defined in the project's `.env.example` and application configuration.

Typical configuration includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_api_key
```

Use the exact variable names expected by the source code. Do not commit real API keys or database credentials to GitHub.

### 5. Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 🚀 Deployment

RouteWise is deployed using Vercel.

**Production URL:**

https://delivery-dispatch-agent.vercel.app/

### Deployment Steps

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Deploy the Next.js application.
5. Verify the application and Supabase connectivity.

## 🔐 Security and Validation

RouteWise uses application-side validation and controlled database operations to help ensure that dispatch actions are performed correctly.

Important considerations include:

- Validate tool inputs using Zod.
- Keep API keys and database credentials in environment variables.
- Validate rider eligibility before assigning deliveries.
- Validate delivery status before rescheduling.
- Use database-side operations for critical state changes.
- Apply appropriate Supabase Row Level Security policies.

## 👥 Team Members and Responsibilities

The RouteWise project was developed collaboratively by the following team members:

| Team Member | Registration Number | Role |
|---|---|---|
| **Sigeni Tejas** | RA2411003011282 | Team Lead — System Architecture, Project Coordination and Integration |
| **Saket Badie** | RA2411003011271 | Frontend Development and User Interface |
| **Pranav J** | RA2411003011292 | Backend Development and Database Integration |
| **Anil** | RA2411003011098 | Agentic AI Integration and Gemini Function Calling |

## 🎯 Expected Outcomes

RouteWise aims to demonstrate how Agentic AI can support real-world logistics operations through natural-language interaction and controlled tool execution.

The expected outcomes include:

- Reduced manual effort in delivery dispatch operations.
- Faster identification of eligible delivery riders.
- Structured delivery assignment workflows.
- Improved handling of failed delivery attempts.
- Natural-language interaction with operational data.
- An integrated AI-powered delivery dispatch application.

## 🔮 Future Enhancements

Potential future improvements include:

- Advanced route optimisation.
- Predictive delivery-delay analysis.
- Real-time rider location tracking.
- Automated delivery exception detection.
- Advanced operational analytics.
- Multi-agent logistics coordination.
- Enhanced delivery performance prediction.

## 🌍 Project Information

| Detail | Information |
|---|---|
| Project Name | RouteWise |
| Hackathon | SRM Agentic AI Hackathon |
| Problem Statement | PS7 — Delivery Dispatch Agent |
| Domain | Logistics and Supply Chain |
| Project Category | Agentic AI |
| Frontend | Next.js, React and TypeScript |
| AI | Google Gemini |
| Database | Supabase PostgreSQL |
| Deployment | Vercel |

---

**RouteWise — Making Last-Mile Delivery Dispatch Smarter with Agentic AI.** 🚚
