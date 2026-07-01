# ============================================================
# FLOWFORGE — CURSOR PROMPT PACK
# READ THIS FIRST BEFORE ANYTHING ELSE
# ============================================================

## What Is This?
This is a complete prompt pack for building FlowForge inside Cursor IDE.
Each file contains one prompt to paste into Cursor Agent mode (Ctrl+I / Cmd+I).
Follow the steps IN ORDER. Do not skip.

## The Files & What Order To Use Them

```
STEP0_READ-ME-FIRST.md         ← You are here
STEP1_cursor-rules.md          ← Set up FIRST — paste into .cursorrules file
STEP2_phase1A-setup.md         ← Project structure + package install
STEP3_phase1B-auth.md          ← Full authentication (register, login, JWT)
STEP4_phase1C-algorithms.md    ← The 5 CPM algorithms + 17 unit tests ⭐ MOST IMPORTANT
STEP5_phase1D-crud-api.md      ← Projects + Tasks REST API
STEP6_phase1E-frontend.md      ← React UI + Graph Canvas
STEP7_phase2-realtime.md       ← Velocity Drift, DPS, Redis, What-If Sandbox
STEP8_phase3-advanced.md       ← Graph Health, Parallel Finder, Handoff Lag, Deploy
```

## How To Use Each Prompt

1. Open Cursor IDE
2. Open Agent mode: press Ctrl+I (Windows/Linux) or Cmd+I (Mac)
3. Make sure Agent toggle is ON (not Chat mode — Agent mode)
4. Copy everything between the ----PASTE---- markers
5. Paste into Agent input and press Enter
6. Watch Cursor build the feature
7. Review what was built — READ the code, understand it
8. Run the manual tests listed at the bottom of each prompt
9. Only move to the next step when current step works

## CRITICAL RULES — READ THESE

### Rule 1: Understand Before Moving Forward
Cursor will generate code. Before pasting the next prompt, READ the code it wrote.
Especially for the algorithms (STEP4). You should be able to explain:
- What topologicalSort() does
- What the forward pass calculates
- What float/slack means
These will be asked in interviews.

### Rule 2: Commit After Every Step
After each step works and tests pass:
```bash
git add .
git commit -m "feat: [what was built]"
```
This gives you safe checkpoints to roll back to if something breaks.

### Rule 3: Run Tests After STEP4
After the algorithm step, run:
```bash
cd server && npx jest algorithms --verbose
```
All 17 tests MUST pass. If any fail, paste the error into Cursor Agent:
"This Jest test is failing: [paste error]. Fix it without changing the test."

### Rule 4: Test API Routes Manually
After STEP5, use Postman or Thunder Client (VS Code extension) to test:
- Register a user
- Login and get token
- Create a project
- Create 3 tasks with dependencies
- Verify CPM values are computed (check MongoDB or API response)

### Rule 5: Don't Let Cursor Skip Complexity
If Cursor tries to simplify the algorithm (e.g., using a library instead of implementing
the algorithm yourself), tell it:
"Do not use any library for this. Implement [algorithm name] from scratch in pure JavaScript."

### Rule 6: If Something Breaks
Don't panic. Paste this into Cursor Agent:
"The following error appeared: [paste error]. Check what might be causing it
and fix it, but don't change the overall architecture or remove any features."

## Estimated Build Timeline

| Step | What | Time |
|------|------|------|
| STEP1 | Rules setup | 10 min |
| STEP2 | Project structure | 20 min |
| STEP3 | Auth system | 45 min |
| STEP4 | Algorithms ⭐ | 60 min |
| STEP5 | CRUD API | 45 min |
| STEP6 | React Frontend | 90 min |
| Deploy Phase 1 | Get live URL | 30 min |
| STEP7 | Phase 2 Features | 2-3 days |
| STEP8 | Phase 3 + Final Deploy | 2-3 days |

**Minimum for CV:** Complete STEP1–STEP6 + deploy. That's Phase 1.

## Quick Cursor Tips

- **Ask mode** (Ctrl+L): When you want to ask a question about existing code
- **Agent mode** (Ctrl+I): When you want Cursor to BUILD something
- **Inline edit** (Ctrl+K): When you want to edit a specific section of a file
- **@file**: Reference a specific file in your prompt (e.g., "@models/Task.js")
- **@codebase**: Ask about your entire codebase (useful for debugging)

## When You're Stuck

Paste this template into Cursor Agent:
```
Context: I'm building FlowForge, a MERN app with CPM algorithms and real-time WebSocket updates.
Current step: [which step you're on]
What I'm trying to do: [describe the feature]
The problem: [describe what's wrong]
Error message: [paste the error]
Relevant file: @[filename]
Please fix this without breaking any existing functionality.
```

## What To Say In Interviews

When asked about this project, say:
"I built FlowForge, a real-time Critical Path Method orchestration engine.
The interesting part is I implemented 5 graph algorithms from scratch in Node.js —
topological sort, DFS cycle detection, CPM forward and backward pass, and BFS cascade
propagation — and connected them to a real-time WebSocket layer so the entire team
sees the updated critical path within milliseconds of any task change."

Then walk them through ONE algorithm in detail. The forward pass is the clearest one to explain.

---

Good luck. Build it. Ship it. Put the URL on your CV.
```
