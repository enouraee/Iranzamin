# CLAUDE.md

Working instructions for the **frontend** live in **[AGENTS.md](AGENTS.md)** — read it fully
before writing any code. This file just points there.

@AGENTS.md

## Quick reminders (see AGENTS.md for detail)

- You build **only** the frontend (`frontend/`). The backend is done and running.
- **Do not read or edit `../backend/`.** The full API contract is in **[API.md](API.md)**.
- **Do not edit `../design/`** — it is read-only and the UI source of truth.
- Backend gaps/needs go in **[BACKEND_ISSUES.md](BACKEND_ISSUES.md)** — never fix them yourself.
- Run backend for dev/tests: `cd ../backend && uv run python manage.py runserver`.
  Dev login: mobile `09121112233` / password `Dev@12345`.
- Persian, RTL, mobile-first, pixel-faithful to the design. Tests required. Commit per unit
  of work, Conventional Commits, never mention an AI.
