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

### Now (in scope)
- Selector: contracts whose `end_date` is within N days (default 30), for rent/rahn. Surface on the dashboard as a list.
- Selector: open requests past or near their `deadline` — a follow-up list.

### Future (O3 — do not build yet)
- Push/SMS/email delivery.
- Recommendation engine beyond hard matching (O2).

## Acceptance criteria (in-scope only)
- [ ] Dashboard renders all stats with Persian digits; empty DB → zeros. ⚠️
- [ ] `قراردادهای نزدیک به پایان` lists rent/rahn contracts within the window, sorted by soonest end. ⚠️
- [ ] Follow-up list surfaces requests at/near deadline.
- [ ] Windows are configurable (constant/setting), not hardcoded magic numbers.
- [ ] Unauth → 401. Visual matches design both widths.

## Edge cases ⚠️
No contracts/requests → empty states; contract ending exactly today / already ended; request with no deadline excluded; timezone = Asia/Tehran boundary (end-of-day).
