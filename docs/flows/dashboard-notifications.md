# Flow — Dashboard + notifications

**Purpose:** at-a-glance office state, quick actions, and follow-up reminders. Some of this is **future scope** (see O2/O3 in [../decisions.md](../decisions.md)).

## Dashboard (design: greeting header)
- Greeting `سلام، {name} 👋` (the one allowed emoji).
- StatCards: total files, خالی/پر counts, contracts, open requests.
- Quick actions (add file / add request / add contract).
- Recent files list.
- Backend: `dashboard_stats` selector (task 32, done).

## Notifications / follow-ups
Design already shows **`قراردادهای نزدیک به پایان`** (contracts nearing end). Build the read model now; delivery beyond in-app is future.

### Now (in scope) — implemented (task 48)
- Selector `contracts_ending_soon(*, within_days=None)` (contracts/selectors.py): rent/rahn contracts with `end_date` from today through today+window (default `CONTRACT_ENDING_WINDOW_DAYS=30`), sorted by soonest `end_date`. Ending exactly today included; already-ended excluded.
- Selector `requests_due_soon(*, within_days=None)` (requests/selectors.py): open requests with a `deadline` at/before today+window (default `REQUEST_DEADLINE_WINDOW_DAYS=30`); overdue included, no-deadline excluded, sorted by soonest `deadline`.
- Both windows are settings (`config/settings/base.py`), overridable per call. Dates via `timezone.localdate()` (Asia/Tehran).
- Surfaced on `dashboard_stats` / `GET /api/dashboard/stats/` as `ending_contracts` + `due_requests` lists.

### Future (O3 — do not build yet)
- Push/SMS/email delivery.
- Recommendation engine beyond hard matching (O2).

## Acceptance criteria (in-scope only)
- [x] Dashboard renders all stats with Persian digits; empty DB → zeros. ⚠️
- [x] `قراردادهای نزدیک به پایان` lists rent/rahn contracts within the window, sorted by soonest end. ⚠️
- [x] Follow-up list surfaces requests at/near deadline.
- [x] Windows are configurable (constant/setting), not hardcoded magic numbers.
- [x] Unauth → 401. — Visual matches design both widths: needs live screenshot verification.

## Edge cases ⚠️
No contracts/requests → empty states; contract ending exactly today / already ended; request with no deadline excluded; timezone = Asia/Tehran boundary (end-of-day).
