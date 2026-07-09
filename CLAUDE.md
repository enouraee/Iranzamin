# CLAUDE.md

All working instructions for this repo live in **[AGENTS.md](AGENTS.md)** — a single source of truth shared by every coding agent. Read it fully before writing any code.

@AGENTS.md

## Quick reminders (see AGENTS.md for detail)

- **DealEstate / املاک ایران زمین** — Persian, RTL, mobile-first real-estate office app.
- **Backend**: Django + DRF in `backend/`, strict **HackSoft Styleguide** (services/selectors/thin apis), packaged with **uv**, on **MySQL** (`iranzamin` @ `127.0.0.1`, `root`/`abcd@1234`).
- **Frontend**: React + TypeScript (Vite) in `frontend/`, must be **pixel-faithful to `design/`**.
- After every frontend change: **run it, open a browser, screenshot, verify vs design** (mobile ≤480px + desktop ≥920px).
- **Tests required** for everything changed — including behavioral/edge-case tests.
- **Commit after each edit** with a Conventional Commits prefix. **Never** mention an AI/agent in commits or code.
- Design is **read-only** at `design/DealEstate/DealEstate.dc.html` + `_ds/`.
