# FlowForge — Real-Time Critical Path Orchestration Engine

> "It tells you exactly which tasks will kill your deadline — before they do."

**Live Demo:** [your-url.vercel.app](https://your-url.vercel.app)  
**API:** [your-api.onrender.com/api/health](https://your-api.onrender.com/api/health)

## What It Solves

Software teams manage complex projects as task lists, but miss the hidden dependency graph that determines whether deadlines slip. FlowForge models your project as a directed graph and runs Critical Path Method (CPM) analysis in real time — so you always know which tasks are on the critical path and what happens when one gets blocked.

When any team member updates a task, the entire graph recalculates and broadcasts to all connected clients via WebSocket within milliseconds.

## Tech Stack

- **Frontend:** React 18, React Flow, Zustand, Socket.io-client, Vite
- **Backend:** Node.js, Express.js, Socket.io, Bull, Redis
- **Database:** MongoDB with Mongoose
- **Auth:** JWT + Refresh Token Rotation
- **Deployment:** Vercel (frontend) + MongoDB Atlas + Upstash Redis

## Core Algorithms (Implemented from Scratch)

- Topological Sort (Kahn's Algorithm)
- DFS Cycle Detection
- CPM Forward Pass (EST/EFT computation)
- CPM Backward Pass (LST/LFT/Float computation)
- Cascade Impact BFS (Blast Radius propagation)

## Unique Features

1. Blast Radius — shows deadline impact when a task is blocked
2. What-If Sandbox — simulate project changes without affecting real data
3. Velocity Drift Detection — realistic deadlines based on team history
4. Deadline Pressure Score — predicts which tasks are about to become critical
5. Dependency Smell Detector — flags structural problems in the task graph
6. Parallel Opportunity Finder — suggests tasks that can run simultaneously
7. Handoff Lag Tracker — measures invisible time lost between tasks
8. **Ghost Critical Path** — world-first: predicts tasks that will silently join the critical path
9. **Semantic Dependency Radar** — AI detects hidden task links your team forgot to draw
10. **Delay Prophet** — ranks slip probability using graph position + velocity + DPS
11. **Neural Standup Brief** — LangChain-generated standup from live graph state
12. **Project Pulse Timeline** — animated Gantt-style critical path visualization
13. **Command Palette (⌘K)** — power-user navigation across all features

## Live Demo (Local)

```bash
# 1. Start MongoDB (required)
# 2. Seed demo data
npm run seed:demo

# 3. Start app
npm run dev
```

Open http://localhost:5173 → click **Launch Live Demo**

**Demo credentials:** `demo@flowforge.dev` / `demo12345`

## AI Setup (LangChain + OpenAI)

Add to `server/.env`:
```
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

Without an API key, AI features use intelligent rule-based fallbacks so the demo still works.

## Project Structure

```
flowforge/
├── client/          → React frontend (Vercel deploys client/dist)
├── server/          → Express API (Render)
├── vercel.json      → Vercel config (output: client/dist)
├── render.yaml      → Render config for API
└── package.json     → Root scripts (dev, build, install:all)
```

## Running Locally

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional — app works without it)

### Setup

```bash
# Install all dependencies
npm run install:all

# Copy env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Start both client and server
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health

### Run Algorithm Tests

```bash
cd server && npm test
```

## Deploy to Vercel (Frontend)

1. Push this repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. **Root Directory:** leave as repo root (default)
4. Vercel reads `vercel.json` which builds `client/` → outputs `client/dist`
5. Set environment variables in Vercel:
   - `VITE_API_URL` = `https://your-api.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://your-api.onrender.com`

## Deploy API to Render

1. Connect repo to [Render](https://render.com)
2. Use `render.yaml` or create a Web Service with root dir `server`
3. Set env vars: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `CLIENT_URL`

### MongoDB Atlas

1. Create free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create M0 cluster, database user, allow IP `0.0.0.0/0`
3. Copy connection string → `MONGODB_URI`

### Upstash Redis

1. Create free account at [upstash.com](https://upstash.com)
2. Create Redis database, copy URL → `REDIS_URL`

## Architecture

```
┌─────────────┐     REST/WS      ┌─────────────┐
│   Vercel    │ ◄──────────────► │   Render    │
│  React App  │                  │  Express API│
│ client/dist │                  │  + Socket.io│
└─────────────┘                  └──────┬──────┘
                                        │
                         ┌──────────────┼──────────────┐
                         ▼              ▼              ▼
                   MongoDB Atlas   Upstash Redis   CPM Engine
```

## Pre-Deploy Checklist

- [ ] All `.env` files in `.gitignore`
- [ ] No hardcoded URLs (all from env vars)
- [ ] CORS `CLIENT_URL` set to production Vercel URL
- [ ] Rate limiting enabled
- [ ] JWT secrets are long random strings
- [ ] MongoDB Atlas user has read/write (not root)
