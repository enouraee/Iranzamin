# TASKS — DealEstate / املاک ایران زمین

Build checklist for coding agents. **Single source of truth for "what's left".**

## How to use this file

- Say **"implement task N"** (e.g. *"implement task 3"*). The agent does only that task.
- When a task is done, the agent flips `- [ ]` → `- [x]` **and** fills the `Done:` date + commit hash.
- Read **[AGENTS.md](AGENTS.md)** fully before any task. Every golden rule there applies here.
- Tasks are numbered **1..N, continuous**, so a number is never ambiguous.
- **Frontend tasks come first (1–20), Backend tasks second (21–41)** per request. But note the **dependency**: a frontend task that needs live data depends on its backend task — build against mock data first, then wire up when the backend task lands. Each frontend data-task lists its backend dependency.
- Do tasks **in order within a section** unless a task says otherwise. Later tasks assume earlier ones exist.
- Every task: **tests required** (see AGENTS.md §7) and **commit after** (Conventional Commits, no AI mention).

Legend: 🎨 = design fidelity critical · 🔒 = auth-gated · ⚠️ = has edge cases to cover in tests.

---

# FRONTEND (React + TS + Vite) — tasks 1–20

> All frontend work is **RTL, mobile-first, Vazirmatn, Persian digits, no emoji**, pixel-faithful to `Design/DealEstate/DealEstate.dc.html`. After **every** frontend task: run dev server, screenshot mobile (≤480px) + desktop (≥920px), compare to design, check console. See AGENTS.md §6.

## Foundation

- [x] **1. Scaffold frontend project** 🎨
  - **Scope:** Vite + React + TypeScript app in `frontend/`. Add deps: `react-router-dom`, `@tanstack/react-query`, `axios`, `vitest` + `@testing-library/react`, `@playwright/test`. Set `dir="rtl"`, `lang="fa"` on root. Base folder structure: `src/{components,screens,lib,styles,api}`.
  - **Design:** none yet — just the shell.
  - **Tests:** app boots, root renders, one smoke test green.
  - **Done:** 2026-07-10 / commit a77ba63

- [x] **2. Import design tokens + global styles** 🎨
  - **Scope:** Copy the token CSS from `Design/DealEstate/_ds/.../tokens/*.css` + `styles.css` into `frontend/src/styles/`. Load Vazirmatn. Expose CSS vars (`--color-primary`, `--radius-lg`, `--space-4`, status colors خالی/پر…). Set app background `#F5F7FA`, surfaces white.
  - **Design:** DS readme "Visual foundations".
  - **Tests:** a probe component reads `--color-primary` = `#1F4A6B`; snapshot of `:root` vars.
  - **Done:** 2026-07-10 / commit 3ef0963

- [x] **3. Persian/format helpers** ⚠️
  - **Scope:** `src/lib/fmt.ts`: Latin→Persian digits, Toman formatting with `٬` thousands / `٫` decimal, scale words (`میلیون`/`میلیارد`), rent `۴۵ میلیون / ماه`, Jalali date format+parse (use `jalaali-js`). Phone formatting.
  - **Design:** DS readme "Numerals"/"Money".
  - **Tests:** ⚠️ `1248` → `۱٬۲۴۸`; `8500000000` → `۸٫۵ میلیارد`; empty/NaN/negative; round-trip Jalali↔Gregorian; huge numbers.
  - **Done:** 2026-07-10 / commit 76778b3

- [x] **4. UI primitives (design-system components)** 🎨
  - **Scope:** Build reusable primitives matching the DS: `Button`, `IconButton`, `Input`, `Select`, `Switch`, `Badge`, `Card`, `Avatar`, `StatCard`, `PropertyCard`, `Tabs`. Lucide outline icons (stroke 2, `currentColor`). Hover/focus/disabled states per DS "States".
  - **Design:** DS `components/` + specimen cards.
  - **Tests:** render each; Badge خالی=green / پر=red; Button disabled has `opacity .5`, no hover; RTL layout.
  - **Done:** 2026-07-10 / commit ca80949

- [x] **5. App shell: routing + bottom nav + desktop sidebar** 🎨
  - **Scope:** React Router routes for every screen. Chrome: 56px top app bar, **64px bottom nav** on mobile; at ≥920px switch to fixed **right-side sidebar** (RTL) and hide bottom nav — exactly as the design. Nav items: داشبورد · فایل‌ها · (+) · قراردادها/درخواست‌ها · پروفایل. Active item bumps icon stroke.
  - **Design:** whole-page chrome in `DealEstate.dc.html`.
  - **Tests:** active route highlights; bottom nav hidden ≥920px, sidebar shown; nav navigates.
  - **Done:** 2026-07-10 / commit b11922f

- [x] **6. Typed API client + React Query setup** ⚠️
  - **Scope:** `src/api/client.ts` axios instance (base `/api/`, JWT header from storage, 401 → login redirect). React Query provider. Typed request helpers + shared TS domain types (`Property`, `Person`, `Contract`, `Request`, `Region`). Error-toast on network failure.
  - **Design:** n/a (infra).
  - **Depends on backend:** task 22 (JWT), 24 (error shape). Build against a mock adapter until then.
  - **Tests:** ⚠️ attaches token; 401 clears token + redirects; network error surfaces toast.
  - **Done:** 2026-07-10 / commit e08a60e

## Screens

- [ ] **7. Login screen** 🎨🔒
  - **Scope:** mobile-number + password login, gradient header block per design, validation messages in Persian. On success store JWT, go to Dashboard.
  - **Design:** login screen (`DealEstate.dc.html`, ~line 889).
  - **Depends on backend:** task 22.
  - **Tests:** ⚠️ empty fields, wrong creds error, invalid phone format, successful login redirect (mock).
  - **Done:** matches design; flow works. `_____ / commit _____`

- [ ] **8. Dashboard screen** 🎨
  - **Scope:** greeting header (`سلام، رضا 👋` — the one allowed emoji), StatCards, quick actions, recent files. Persian digits throughout.
  - **Design:** dashboard (~line 56).
  - **Depends on backend:** task 32 (dashboard stats selector).
  - **Tests:** renders stats, Persian digits, empty state.
  - **Done:** pixel-match both widths. `_____ / commit _____`

- [ ] **9. Files / Properties list screen** 🎨⚠️
  - **Scope:** searchable/filterable list of `PropertyCard`s. Filters: type, region, deal type, status خالی/پر. Empty state `ملکی با این مشخصات یافت نشد.` Pagination/infinite scroll.
  - **Design:** files list (~line 60).
  - **Depends on backend:** task 27 (list+filter api).
  - **Tests:** ⚠️ filter by status, search, empty state, pagination boundary.
  - **Done:** matches design; filters work. `_____ / commit _____`

- [ ] **10. Property detail screen** 🎨
  - **Scope:** gallery placeholder (blue-500→700 gradient), title `{{typeLabel}} {{region}}`, specs (area/beds/floor/amenities…), price block, owner, status pill, contact action, photo-count chip.
  - **Design:** detail (~line 1132).
  - **Depends on backend:** task 28 (detail api).
  - **Tests:** renders all spec types, occupied shows tenant+dates, missing photos shows placeholder.
  - **Done:** pixel-match. `_____ / commit _____`

- [ ] **11. Add-property wizard — shared frame + Step 1** 🎨⚠️
  - **Scope:** multi-step wizard shell (progress, next/back, `افزودن فایل جدید`). Step 1 = **type picker** (آپارتمان/کلنگی/زمین/تجاری/اداری/ویلا) + region (with inline **افزودن منطقه جدید** Picker) + address + پلاک. Branch logic for the type-specific steps.
  - **Design:** `<!-- APARTMENT STEP 1 -->` / `<!-- KALNAGI / LAND STEP 1 -->`.
  - **Depends on backend:** task 25 (region create), 29 (property create).
  - **Tests:** ⚠️ required-field validation, inline region add, branch routing per type, back nav preserves state.
  - **Done:** step 1 matches all branches. `_____ / commit _____`

- [ ] **12. Add-property wizard — Step 2 (type-specific specs)** 🎨⚠️
  - **Scope:** Apartment: floor/unit/area/beds/amenities/cabinet/build-year/انباری(+سندی+area)/تبدیل. Kalnagi: area/عقب‌نشینی(+desc)/تعداد بر/گذر کوچه/تعداد طبقات/حیاط(+area). Land: area/عقب‌نشینی(+desc)/تعداد بر/گذر کوچه.
  - **Design:** `APARTMENT STEP 2` / `KALNAGI STEP 2` / `LAND STEP 2`.
  - **Tests:** ⚠️ each branch's fields render + validate; conditional sub-fields (سندی, حیاط) toggle.
  - **Done:** all three branches match. `_____ / commit _____`

- [ ] **13. Add-property wizard — Step 3 (deal types + status)** 🎨⚠️
  - **Scope:** multi-select deal types: `فروش` (price/m² + total), `اجاره` (پول پیش + monthly), `رهن کامل` (پول رهن). **Land = sale only.** Status خالی/پر; پر → start/end Jalali dates + مستأجر.
  - **Design:** `APARTMENT / KALNAGI STEP 3` + `LAND STEP 3 (sale only)`.
  - **Tests:** ⚠️ land hides rent/rahn; occupied requires dates+tenant; price Persian formatting; multi-select combos.
  - **Done:** matches; land constraint enforced client-side. `_____ / commit _____`

- [ ] **14. Add-property wizard — Step 4 (owner + media) + submit** 🎨⚠️
  - **Scope:** owner (مالک) picker/quick-add, photos/video/gallery uploader, review + submit → create property.
  - **Design:** `PROPERTY STEP 4 (owner + media)`.
  - **Depends on backend:** task 29.
  - **Tests:** ⚠️ owner required, upload validation (type/size), successful create redirects to detail, server error toast.
  - **Done:** full wizard creates a property end-to-end (mock then real). `_____ / commit _____`

- [ ] **15. Persons screen (list + detail + quick-add)** 🎨⚠️
  - **Scope:** list of اشخاص (مالک/مشتری), search, detail with linked properties/contracts/requests, add/edit person (name/phone/کد ملی/birth Jalali).
  - **Design:** persons (~line 1132 area / اشخاص).
  - **Depends on backend:** tasks 33–34.
  - **Tests:** ⚠️ duplicate phone, invalid کد ملی, empty state, links resolve.
  - **Done:** matches design. `_____ / commit _____`

- [ ] **16. Contract wizard (4 steps)** 🎨⚠️
  - **Scope:** Step 1 pick property; Step 2 parties (seller/owner + buyer/renter, quick-add); Step 3 type فروش/اجاره/رهن + Jalali dates + amounts; Step 4 docs + notes + the warning banner. On submit, register contract.
  - **Design:** `CONTRACT STEP 1..4`.
  - **Depends on backend:** task 36 (contract create — flips property status).
  - **Tests:** ⚠️ missing party, end<start dates, amount validation per type, submit updates property status (assert on returned data).
  - **Done:** wizard matches; registration reflected. `_____ / commit _____`

- [ ] **17. Request wizard (4 steps) + matching** 🎨⚠️
  - **Scope:** Step 1 customer (existing/quick-add); Step 2 type (rent/mortgage vs buy); Step 3a rent/mortgage constraints, 3b buy constraints (persons/beds/needs/floor/area/build-year/max deposit/max rent/budget/مهلت); Step 4 summary + **auto-suggested matching files**.
  - **Design:** `REQUEST STEP 1..4`.
  - **Depends on backend:** tasks 38–39 (request create + matching selector).
  - **Tests:** ⚠️ branch 3a vs 3b, budget/deadline validation, matching list renders + empty state.
  - **Done:** wizard matches; matches shown. `_____ / commit _____`

- [ ] **18. Profile screen** 🎨
  - **Scope:** name/phone, notification toggle, dark-mode toggle (Switch), logout.
  - **Design:** profile (~line 99).
  - **Depends on backend:** task 23 (me/profile).
  - **Tests:** toggles persist, logout clears token + redirects.
  - **Done:** matches design. `_____ / commit _____`

- [ ] **19. Dark mode** 🎨
  - **Scope:** wire the profile dark-mode toggle to a theme (token overrides). Respect `prefers-color-scheme` default. No layout shift.
  - **Design:** DS "Backgrounds"/"States"; logo works on `--blue-800`.
  - **Tests:** toggle flips `data-theme`; key colors invert; snapshot both themes.
  - **Done:** clean dark theme both widths. `_____ / commit _____`

- [ ] **20. Frontend E2E pass (Playwright)** ⚠️
  - **Scope:** full behavioral flows against the running backend: login → dashboard → add-property (each type branch) → detail → create contract → create request → search/filter → logout. Assert user-visible behavior + edge cases (back nav, invalid form, network-error toast).
  - **Tests:** ⚠️ this task *is* the tests. All green, none skipped.
  - **Done:** `npm run test:e2e` green; visual verification screenshots attached. `_____ / commit _____`

---

# BACKEND (Django + DRF, HackSoft style, uv) — tasks 21–41

> Strict **HackSoft Styleguide**: thin models, `services.py` (writes/logic), `selectors.py` (reads), thin `apis.py` (one APIView/action, nested In/Out serializers), explicit named `urls.py`, `filters.py`. **PyMySQL**. **uv** only. Tests for every task (services/selectors/apis + edge cases). See AGENTS.md §5 & §7.
>
> **Backend can be built before the frontend** — the "frontend first" numbering is presentation only. If implementing in dependency order, do the backend foundation (21–26) early so frontend data-tasks can wire up.

## Foundation

- [x] **21. Scaffold Django project (uv, split settings, PyMySQL)**
  - **Scope:** `backend/` project via **uv**. Deps: `django`, `djangorestframework`, `django-cors-headers`, `django-filter`, `django-environ`, `PyMySQL`, `djangorestframework-simplejwt`, `django-jalali`; dev: `pytest`, `pytest-django`, `factory_boy`, `pytest-cov`, `ruff`, `mypy`. Split settings `config/settings/{base,local,test,production}.py`. `pymysql.install_as_MySQLdb()` in `config/__init__.py`. `.env` (gitignored) + `.env.example` with `DATABASE_URL=mysql://root:abcd%401234@127.0.0.1:3306/iranzamin`. Base `apps/` package.
  - **Tests:** `uv run pytest` runs (0 tests ok); `migrate` connects to MySQL.
  - **Done:** 2026-07-09 / commit e67add3

- [x] **22. Auth (JWT) — login by mobile + password** 🔒⚠️
  - **Scope:** custom User keyed on mobile number. `simplejwt` login/refresh. `services.py` for user create/password. Thin login api.
  - **Tests:** ⚠️ valid login returns tokens, wrong password 401, unknown mobile 401, malformed phone 400, refresh works.
  - **Done:** 2026-07-09 / commit 250a431

- [x] **23. Profile / me endpoint + settings** 🔒
  - **Scope:** `GET/PATCH /api/me/` — name, phone, notification pref, dark-mode pref. Selector `user_get`, service `user_update`.
  - **Tests:** unauth 401, get shape, patch persists, invalid field rejected.
  - **Done:** 2026-07-09 / commit 250a431

- [x] **24. Core: BaseModel, ApplicationError, exception handler, pagination**
  - **Scope:** `apps/common/`: `BaseModel` (`created_at`/`updated_at`), `ApplicationError`, DRF custom exception handler → structured errors, shared pagination + base serializers. Wire in settings.
  - **Tests:** ⚠️ ApplicationError → structured JSON; pagination boundaries; validation error shape.
  - **Done:** 2026-07-10 / commit 3a56735

- [x] **25. Region (منطقه) — model + CRUD** ⚠️
  - **Scope:** `apps/regions/`: thin model, `region_create`/`region_list`, list + create apis (inline-add from the property wizard).
  - **Tests:** ⚠️ create, duplicate name, list ordering, unauth 401.
  - **Done:** 2026-07-10 / commit 0cdfff7

- [x] **26. Person (شخص) — model** ⚠️
  - **Scope:** `apps/people/`: model (first/last name, phone, کد ملی, birth date Jalali, role مالک/مشتری), `clean()` invariants (valid کد ملی, phone). Migration. No apis yet (task 33/34).
  - **Tests:** ⚠️ valid create, invalid کد ملی rejected in `full_clean`, duplicate phone rule, birth date parse.
  - **Done:** 2026-07-10 / commit d6c3b1a

## Domain: Properties

- [x] **27. Property list selector + filters + api** ⚠️
  - **Scope:** `apps/properties/`: Property model (thin, all fields from AGENTS.md §4 domain incl. type-specific + deal types + status), migration. `selectors.property_list(*, filters)`, `filters.py` (type/region/deal/status/search), `PropertyListApi` (paginated OutputSerializer).
  - **Tests:** ⚠️ filter by status خالی/پر, region, deal type, search, pagination boundary, empty result.
  - **Done:** 2026-07-10 / commit 2964944

- [x] **28. Property detail selector + api**
  - **Scope:** `selectors.property_get`, `PropertyDetailApi` with full nested output (specs, owner, media, status/tenant/dates).
  - **Tests:** existing id 200 shape, missing id 404 via ApplicationError, occupied includes tenant+dates.
  - **Done:** 2026-07-10 / commit ca80949

- [x] **29. Property create service + api** ⚠️
  - **Scope:** `services.property_create(*, agent, type, region, ...)` — `full_clean()` + `transaction.atomic()`, type-specific field handling, owner link, media. `PropertyCreateApi`.
  - **Tests:** ⚠️ happy path per type, **land + rent/rahn rejected**, occupied-without-dates rejected, missing owner rejected, huge price stored as int, atomic rollback on failure.
  - **Done:** 2026-07-10 / commit 47ba4cc

- [x] **30. Property update + status/media services** ⚠️
  - **Scope:** `property_update`, `property_set_status` (خالی/پر + tenant/dates), media add/remove. Update apis.
  - **Tests:** ⚠️ status flip validation, tenant required when پر, partial update, unauthorized agent rejected.
  - **Done:** 2026-07-10 / commit a524f44

- [x] **31. Property delete + urls wiring**
  - **Scope:** `property_delete` service, delete api, `apps/properties/urls.py` explicit named patterns under `/api/`.
  - **Tests:** delete removes + cascades correctly, 404 on missing, unauth 401.
  - **Done:** full property CRUD routed. `2026-07-10 / commit fa4e299`

- [ ] **32. Dashboard stats selector + api**
  - **Scope:** `selectors.dashboard_stats` (counts: total files, خالی/پر, contracts, open requests, recent files). Thin api.
  - **Tests:** counts correct on seeded data, empty DB → zeros, unauth 401.
  - **Done:** dashboard api works. `_____ / commit _____`

## Domain: People, Contracts, Requests

- [ ] **33. Person selectors + list/detail apis** ⚠️
  - **Scope:** `people/selectors` (list+search+filter role, get with linked properties/contracts/requests), `filters.py`, list+detail apis.
  - **Tests:** ⚠️ search, filter role, linked objects present, pagination, empty state.
  - **Done:** person read apis work. `_____ / commit _____`

- [ ] **34. Person create/update service + apis** ⚠️
  - **Scope:** `person_create`/`person_update` (validation, quick-add path), apis + urls.
  - **Tests:** ⚠️ duplicate phone, invalid کد ملی, quick-add minimal fields, update, unauth.
  - **Done:** person write apis work. `_____ / commit _____`

- [ ] **35. Contract model + selectors**
  - **Scope:** `apps/contracts/`: model (property + parties + type فروش/اجاره/رهن + Jalali start/end + amounts + image + notes), migration. `selectors.contract_list`/`contract_get`, filters, list+detail apis.
  - **Tests:** list/filter by type & property, detail shape, date range filter, 404.
  - **Done:** contract read apis work. `_____ / commit _____`

- [ ] **36. Contract create service — registers + flips property status** ⚠️
  - **Scope:** `services.contract_create(*, property, parties, type, dates, amounts, ...)` — `transaction.atomic()`: create contract **and** update the property's owner/tenant + status (خالی→پر for rent/rahn; ownership transfer for sale). `ContractCreateApi`.
  - **Tests:** ⚠️ **registration flips property status + updates owner/tenant**, end<start rejected, amount required per type, atomic rollback (contract not saved if status update fails), unauth.
  - **Done:** contract registration side-effects proven by tests. `_____ / commit _____`

- [ ] **37. Contract update/delete + urls**
  - **Scope:** update/delete services (reverse status side-effects on delete where sensible), apis, `contracts/urls.py`.
  - **Tests:** ⚠️ delete reverts status if appropriate, update validation, 404, unauth.
  - **Done:** contract CRUD routed. `_____ / commit _____`

- [ ] **38. Request model + create service + apis** ⚠️
  - **Scope:** `apps/requests/`: model (customer, type rent/mortgage vs buy, constraints: persons/beds/needs/floor/area/build-year/max deposit/max rent/budget/مهلت), migration. `request_create` (+ quick-add customer), list/detail/create apis, filters, urls.
  - **Tests:** ⚠️ create both types, quick-add customer, invalid budget/deadline, list/filter, 404, unauth.
  - **Done:** request CRUD works. `_____ / commit _____`

- [ ] **39. Request → property matching selector + api** ⚠️
  - **Scope:** `selectors.request_matches(*, request)` — auto-suggest properties matching a request's constraints (type, area, beds, budget/deposit/rent, region, status خالی). Matching api.
  - **Tests:** ⚠️ matches respect every constraint, budget over-limit excluded, occupied excluded, no matches → empty, ordering by best fit.
  - **Done:** matching api works. `_____ / commit _____`

## Cross-cutting

- [ ] **40. Admin + factories + seed data**
  - **Scope:** register all models in `admin.py`; `factory_boy` factories for every model (used by all tests); a management command to seed realistic Persian demo data for local frontend work.
  - **Tests:** factories build valid objects; seed command runs idempotently.
  - **Done:** admin usable, factories cover all models, seed populates DB. `_____ / commit _____`

- [ ] **41. Lint, types, coverage gate, CORS**
  - **Scope:** `ruff check .` + `mypy .` clean; `pytest --cov` with a coverage threshold; `django-cors-headers` configured for the frontend origin; CI-ready `pyproject` scripts.
  - **Tests:** ⚠️ full suite green, coverage ≥ threshold, no ruff/mypy errors.
  - **Done:** `uv run ruff check . && uv run mypy . && uv run pytest --cov` all green. `_____ / commit _____`

---

## Suggested order if building for real

Backend foundation **21→22→24→25→26** first (so frontend can authenticate + read tokens), then interleave: frontend **1→6** foundation, then pair each screen with its backend dependency (e.g. **27** before wiring **9**, **29** before **14**, **36** before **16**, **39** before **17**). Finish with **20** (E2E) and **41** (backend gate).
