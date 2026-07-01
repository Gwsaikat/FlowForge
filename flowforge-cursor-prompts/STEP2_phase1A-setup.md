# ============================================================
# PHASE 1A — PROJECT SETUP & FOLDER STRUCTURE
# ============================================================
# WHEN TO USE: Very first thing. Fresh empty folder.
# HOW TO USE: Open Cursor Agent (Ctrl+I or Cmd+I), paste prompt below.
# EXPECTED RESULT: Full folder structure + all packages installed.
# TIME: ~10 minutes
# ============================================================

------- PASTE INTO CURSOR AGENT -------

I am building FlowForge — a real-time Critical Path Method orchestration engine.
Set up the complete project structure from scratch. Do the following steps in order:

## Step 1: Create Root Structure
Create a monorepo with two folders: `client` (React frontend) and `server` (Node.js backend).
Create a root `package.json` with scripts to run both concurrently.
Install `concurrently` at the root level.

Root package.json scripts:
- "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\""
- "install:all": "npm install && npm install --prefix client && npm install --prefix server"

## Step 2: Setup the Server (Node.js + Express)
Inside `/server`, initialize a Node.js project with ES Modules (set "type": "module" in package.json).

Install these packages:
- express
- mongoose
- dotenv
- cors
- bcryptjs
- jsonwebtoken
- cookie-parser
- express-validator
- express-mongo-sanitize
- express-rate-limit
- ioredis
- socket.io
- bull
- nodemon (dev dependency)

Create this exact folder structure inside `/server/src/`:
```
routes/
controllers/
middleware/
models/
algorithms/
algorithms/__tests__/
services/
socket/
utils/
```

Create `server/src/app.js` — the Express app setup file (middleware, routes, error handler).
Create `server/src/server.js` — the entry point that creates HTTP server + Socket.io server.
Create `server/src/config/db.js` — MongoDB connection function using mongoose.
Create `server/src/config/redis.js` — Redis connection using ioredis.
Create `server/.env.example` with these variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/flowforge
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

In app.js, set up:
- cors() with origin from CLIENT_URL env var and credentials: true
- express.json()
- cookie-parser()
- express-mongo-sanitize()
- A global error handling middleware at the bottom that catches errors and returns:
  { success: false, error: error.message } with the appropriate status code
- A 404 handler for unknown routes

In server.js:
- Import app.js
- Create http server from app
- Initialize Socket.io on the http server with cors config
- Connect to MongoDB (call db.js)
- Connect to Redis (call redis.js)
- Start listening on PORT

## Step 3: Setup the Client (React)
Inside `/client`, create a React app using Vite:
```
npm create vite@latest . -- --template react
```

Install these packages:
- axios
- socket.io-client
- zustand
- react-router-dom
- reactflow
- react-hot-toast (for notifications)
- lucide-react (for icons)

Create this exact folder structure inside `/client/src/`:
```
components/
components/ui/
pages/
store/
hooks/
services/
socket/
utils/
```

Create `client/src/services/api.js` — Axios instance with:
- baseURL from import.meta.env.VITE_API_URL
- withCredentials: true (for cookies)
- Request interceptor that adds Authorization: Bearer {token} header from Zustand store
- Response interceptor that catches 401 errors and attempts token refresh

Create `client/src/socket/socket.js` — Socket.io client singleton:
- Connect to server URL from env
- withCredentials: true
- autoConnect: false (connect only after login)
- Export the socket instance

Create `client/.env.example`:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Step 4: Create the Main Zustand Store
Create `client/src/store/useAuthStore.js` with these state values and actions:
- State: { user: null, accessToken: null, isAuthenticated: false, isLoading: false }
- Actions: setUser(user), setAccessToken(token), logout(), setLoading(bool)

Create `client/src/store/useProjectStore.js` with:
- State: { projects: [], currentProject: null, isLoading: false }
- Actions: setProjects(projects), setCurrentProject(project), addProject(project)

Create `client/src/store/useGraphStore.js` with:
- State: { tasks: [], nodes: [], edges: [], criticalPath: [], isRecalculating: false }
- Actions: setTasks(tasks), setNodes(nodes), setEdges(edges), setCriticalPath(ids), updateTask(task)

## Step 5: Setup React Router
In `client/src/App.jsx`, set up react-router-dom with these routes:
- / → redirect to /login if not authenticated, else /dashboard
- /login → LoginPage
- /register → RegisterPage
- /dashboard → DashboardPage (protected)
- /projects/:projectId → ProjectPage (protected)

Create empty placeholder page components for: LoginPage, RegisterPage, DashboardPage, ProjectPage.
Create a ProtectedRoute component that checks useAuthStore for isAuthenticated.

## Step 6: Create a README.md at the root with:
- Project title and one-line description
- Tech stack list
- How to install and run locally (step by step)
- Folder structure diagram
- "Live Demo: [coming soon]" placeholder

## Final Check
After all files are created:
1. Run `npm run install:all` from the root
2. Verify no errors in installation
3. Show me the complete folder tree of what was created

Do not start coding features yet. Just the structure, packages, and skeleton files.

------- END OF PROMPT -------
