# Travel Planner — Multi-Agent Demo (Frontend + Backend)

> Demo project: AI-powered Travel Planning Assistant with multi-agent orchestration, interruption/cancellation support, and LangGraph integration skeleton.

---

## Table of Contents

1. [Overview](#overview)
2. [Repository Contents](#repository-contents)
3. [Quickstart (Run locally)](#quickstart-run-locally)
4. [Architecture Overview](#architecture-overview)
5. [Agent Design & Workflows](#agent-design--workflows)
6. [Interruption / Double-Texting Behavior](#interruption--double-texting-behavior)
7. [LangGraph Integration](#langgraph-integration)
8. [Environment Variables](#environment-variables)
9. [Demo Scenarios & Sample Queries](#demo-scenarios--sample-queries)
10. [How to swap demo-mode for real APIs](#how-to-swap-demo-mode-for-real-apis)
11. [Docker (optional)](#docker-optional)
12. [Troubleshooting](#troubleshooting)
13. [Credits & License](#credits--license)

---

# Overview

This project is a **hackathon-ready demo** of a Travel Planning Assistant with three main parts:

* **Frontend**: React + Vite + Tailwind single-page chat UI (left sidebar, center chat, right itinerary) with light/dark themes inspired by provided screenshots.
* **Backend**: FastAPI server that hosts a demo orchestrator (Coordinator + Flight Agent + Hotel Agent) and implements Server-Sent Events (SSE) streaming for partial & final results.
* **LangGraph integration skeleton**: a commented, optional module that shows how to swap the demo orchestrator for LangGraph-based nodes and workflows.

The default repo runs **entirely in demo-mode** (no paid API keys required) and simulates streaming partial results and cancellation behaviour to make your demo crisp, deterministic, and fast.

> If you uploaded a ZIP of the project, it is available here for convenience: `/mnt/data/fly-hotel-whisper-main.zip`

---

# Repository Contents

```
travel-planner/
├─ backend/
│  ├─ app/
│  │  ├─ main.py               # FastAPI app (endpoints: /chat, /stream/{session}, /cancel)
│  │  ├─ agents_demo.py        # Demo Coordinator + Flight/Hotel agents (async simulated streaming)
│  │  ├─ api_utils.py          # SSE helper & session/task management helpers
│  │  ├─ demo_data.py          # Sample FLIGHTS and HOTELS used in demo-mode
│  │  └─ langgraph_integration.py  # Skeleton and instructions for LangGraph
│  ├─ requirements.txt
│  └─ .env.example
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tailwind.config.cjs
│  ├─ postcss.config.cjs
│  └─ src/
│     ├─ main.jsx
│     ├─ index.css
│     ├─ App.jsx
│     ├─ components/           # Sidebar, ChatWindow, MessageBubble, InputBar, ItineraryPanel, FlightCard, etc.
│     ├─ utils/api.js          # startChat, startStream (SSE), cancelSession
│     └─ demoData.js
└─ README.md
```

---

# Quickstart (Run locally)

> Minimum requirements: Python 3.10+, Node 18+, npm/yarn

## 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # macOS / Linux
# OR  .venv\Scripts\activate  (Windows)

pip install -r requirements.txt
# start the backend
uvicorn app.main:app --reload --port 8000
```

This starts the demo backend on `http://localhost:8000`.

## 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend (Vite) URL printed in the terminal (usually `http://localhost:5173`). The UI will be in **demo-mode** and will connect to the local backend via SSE.

---

# Architecture Overview

This demo implements a compact multi-agent architecture with the following components:

* **Coordinator** (backend): receives user queries, detects intent (flight / hotel / both), and orchestrates agent runs.
* **Flight Agent** (backend): simulated flight search that streams partial flight cards.
* **Hotel Agent** (backend): simulated hotel search that streams partial hotel cards.
* **Frontend**: shows agent status pills, streaming partial results, preserves partials on cancellation, and supports light/dark themes.
* **SSE Streaming**: `GET /stream/{session_id}` streams JSON events of types `system`, `flight_partial`, `flight_done`, `hotel_partial`, `hotel_done`.

State is stored in an in-memory `SESSIONS` dictionary for demo purposes. Each session holds a queue (asyncio.Queue) used by SSE, current running asyncio Task, a cancellation Event, and an array of preserved partials.

For production, replace `SESSIONS` with Redis or a persistent database for durability and multi-instance support.

---

# Agent Design & Workflows

## Coordinator

* **Input**: free-text user query (e.g., "Find flights from Delhi to Dubai next Friday")
* **Responsibility**: intent detection (keywords), start Flight and/or Hotel agents (possibly in parallel), stream partials to frontend, and gracefully handle cancellations.

## Flight Agent (demo)

* Simulates network/LLM latency and emits a sequence of `flight_partial` events (one flight card at a time). When finished, emits `flight_done` with the final items.
* Each partial item includes `partial: true`. When finalized, items are re-emitted or marked `partial: false`.

## Hotel Agent (demo)

* Same behavior as Flight Agent but with hotel cards (`hotel_partial`, `hotel_done`).

---

# Interruption / Double-Texting Behavior

Key challenge solved in demo:

* **Detection**: When a new `POST /chat` arrives for an existing `session_id`, backend sets a `cancel_event` for the in-progress task(s).
* **Cancellation**: Running coroutines observe `cancel_event` and cancel gracefully. The backend will cancel tasks and close SSE when appropriate.
* **Partial Result Preservation**: Partial items streamed before cancellation are preserved in `SESSIONS[session_id]["partials"]` and remain visible in the frontend labeled as `(partial)`.
* **Continuation**: Frontend displays preserved partials and user can resume or re-run the previous query; Coordinator can re-invoke agents with preserved context.

Frontend flow on interruption:

1. User sends new message while search is running.
2. Frontend posts to `/chat`; backend sets `cancel_event` on running task and streams a `system` event: `"🔄 New request received — switching tasks..."`.
3. Frontend closes old SSE, preserves UI partials, and opens a new SSE stream for the new session_id returned.

---

# LangGraph Integration

`backend/app/langgraph_integration.py` contains two things:

1. **Skeleton** — commented pseudocode showing how to map Coordinator, FlightAgent, and HotelAgent into LangGraph nodes and edges. This demonstrates how to use LangGraph's execution, streaming, and state features.
2. **Optional runnable example (gated)** — a code path that only runs when `USE_LANGGRAPH=true` in environment. This example explains how to create LangGraph nodes that call an LLM (OpenAI) and/or tools (web search, provider SDKs).

**How to enable**:

* Install LangGraph: `pip install langgraph langchain-openai` (or follow provider-specific docs).
* Set `OPENAI_API_KEY` in `backend/.env`.
* Update `langgraph_integration.py` with provider-specific tool adapters and enable the feature flag.

**Important**: LangGraph's API & package names may evolve; follow LangGraph docs and examples linked in the file.

---

# Environment Variables

A sample `.env.example` is included in `backend/`.

For demo-mode you **do not need** real API keys. Use placeholders (or leave unset) unless you want to enable LangGraph or real travel APIs.

Example (safe placeholders):

```env
ENVIRONMENT=development
DEBUG=true
AMADEUS_API_KEY=demo_amadeus_key_dummy
BOOKING_COM_API_KEY=demo_booking_key_dummy
GOOGLE_MAPS_API_KEY=demo_google_maps_key_dummy
SKYSCANNER_API_KEY=demo_skyscanner_key_dummy
OPENAI_API_KEY=demo_openai_key_dummy
USE_LANGGRAPH=false
```

When you later switch to real APIs, set the real keys in a secure environment and do NOT commit them to git.

---

# Demo Scenarios & Sample Queries

Use these flows during your demo. They show streaming, partials, and interruption behavior.

### Flow A — Flight search

1. Type: `Find flights from Delhi to Dubai tomorrow` → press Enter.
2. Frontend should show agent status: `✈️ Flight Agent — Searching...` and then stream partial flight cards.

### Flow B — Add hotels while flights stream

1. After flights start, type: `Also find hotels in Dubai for those dates` → press Enter.
2. Backend cancels or re-routes as configured. You should see a system message about switching tasks and preserved partials remain.

### Flow C — Interrupt & change destination

1. Start: `Find flights to Goa next weekend`.
2. Immediately: `Make it Mumbai instead`.
3. The system cancels current run, shows `interrupted` status for cancelled agent (red pill), preserves partials, and starts a new search for the updated destination.

---

# How to swap demo-mode for real APIs

1. Replace `agents_demo.py` functions with actual API calls or LangGraph nodes that call tools/LLMs.
2. For flights/hotels, consider providers:

   * **Amadeus** for flights and some hotel data
   * **Booking.com** or **Hotels.com** via partner APIs or RapidAPI
   * **Skyscanner** via RapidAPI
   * **Google Places / Maps** for place images and distances
3. Update `api_utils` and SSE contract if you need different payload shapes. Keep `partial` flags so frontend logic remains unchanged.
4. For production: persist sessions in Redis and run the app behind a process manager (gunicorn/uvicorn workers). Use HTTPS.

---

# Docker (optional)

You can containerize both services. Example docker tasks to add (not included by default):

* `backend/Dockerfile`
* `frontend/Dockerfile`
* `docker-compose.yml` combining both services and a Redis instance for session state

---

# Troubleshooting

* **SSE not working**: ensure backend CORS allows your frontend origin and your browser supports EventSource. Check console logs for network errors.
* **No partials appear**: confirm the backend `agents_demo` is running and streaming items. Check backend logs.
* **Cancelled tasks not finishing**: ensure Python version >=3.10 and that `asyncio` cancellation points exist in any long-running loops.

---

# Credits & License

This demo was generated to help with a multi-agent travel planning hackathon project. Use and modify freely for hackathons and prototypes. Add an open-source license of your choice for production use.

---

If you want, I can now:

* Generate `README.md` as a downloadable file (zip the repo) or
* Paste any of the missing frontend or backend files directly into the chat so you can copy/paste them into your project.

Which would you like next?
