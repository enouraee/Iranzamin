# TASKS — DealEstate Frontend (`frontend/`)

Build checklist for the frontend. **Single source of truth for "what's left" on the UI.**

## How to use this file

- Say **"implement task N"**. Do only that task.
- When a task is done, flip `- [ ]` → `- [x]` and fill the `Done:` date + commit hash.
- Read **[AGENTS.md](AGENTS.md)** fully before any task — every golden rule applies.
- Per task: read the referenced screen in **`./design/DealEstate/DealEstate.dc.html`** and the
  flow doc in **`../docs/flows/`**, wire data per **[API.md](API.md)**, then verify visually
  (screenshot mobile ≤480px + desktop ≥920px, compare to design, check console).
- **Tests required** for every task (see AGENTS.md §6). **Commit after** (Conventional
  Commits, no AI mention).
- **The backend is complete and running** — every data dependency below is already available.
  Wire to the real endpoint via `API.md`; use a mock only if the backend isn't up locally.
  If an endpoint is missing/wrong, log it in [BACKEND_ISSUES.md](BACKEND_ISSUES.md).

Legend: 🎨 = design fidelity critical · 🔒 = auth-gated · ⚠️ = has edge cases to cover in tests.

Every task's **Acceptance** list is the definition of done — tests must cover every line,
and the screen must be pixel-faithful at both breakpoints. Never mark done with an unmet
line or a skipped test.

---

## Foundation (done)

- [x] **1. Scaffold frontend project** 🎨 — Vite + React + TS, RTL/`lang=fa`, folder structure, deps. `Done: 2026-07-10 / a77ba63`
- [x] **2. Import design tokens + global styles** 🎨 — token CSS in `src/styles/`, Vazirmatn, CSS vars, app bg `#F5F7FA`. `Done: 2026-07-10 / 3ef0963`
- [x] **3. Persian/format helpers** ⚠️ — `src/lib/fmt.ts` digits/Toman/scale words/Jalali/phone. `Done: 2026-07-10 / 76778b3`
- [x] **4. UI primitives** 🎨 — Button, IconButton, Input, Select, Switch, Badge, Card, Avatar, StatCard, PropertyCard, Tabs. `Done: 2026-07-10 / ca80949`
- [x] **5. App shell: routing + bottom nav + desktop sidebar** 🎨 — 56px top bar, 64px bottom nav (mobile), right sidebar ≥920px. `Done: 2026-07-10 / b11922f`
- [x] **6. Typed API client + React Query** ⚠️ — axios (`/api/`, JWT header, 401→login), Query provider, typed helpers + domain types, error toast. `Done: 2026-07-10 / e08a60e`
- [x] **7. Login screen** 🎨🔒 — mobile+password, gradient header, Persian validation, store JWT → dashboard. `Done: 2026-07-10 / 0821a90`
  - ✅ Bug fixed: `auth.ts` now sends `mobile`; Vite `/api` proxy added; Providers moved into App.

---

## Screens (to build)

- [x] **8. Dashboard screen** 🎨
  - **Scope:** greeting header (`سلام، رضا 👋` — the one allowed emoji), StatCards, quick actions, recent files. Persian digits throughout.
  - **Design:** dashboard (`./design/DealEstate/DealEstate.dc.html` ~line 56).
  - **API:** `GET /api/dashboard/stats/` → `total_properties`, `vacant_properties`, `occupied_properties`, `total_contracts`, `open_requests`, `recent_properties[]`.
  - **Acceptance:** ⚠️ renders each stat with Persian digits; recent-files list maps `recent_properties`; empty DB → zeros + empty state; loading + error (toast) states; pixel-match both widths.
  - **Done:** `2026-07-11 / commit _____`

- [ ] **9. Files / Properties list screen** 🎨⚠️
  - **Scope:** searchable/filterable list of `PropertyCard`s. Filters: type, region, deal type, status خالی/پر. Empty state `ملکی با این مشخصات یافت نشد.` Pagination/infinite scroll.
  - **Design:** files list (~line 60). Flow: `../docs/flows/add-property.md` (card fields).
  - **API:** `GET /api/properties/` — params `type`, `region`(id), `status`, `deal_type`(sale/rent/rahn), `has_parking`…, `search`(title/address/region), `page`, `page_size`. Paginated `{count,next,previous,results}`; item has `title`, `region`, `status`, `cover_photo`, deal flags + prices.
  - **Acceptance:** ⚠️ filter by status/type/region/deal narrows list; search by title matches; empty result shows the Persian empty state; pagination boundary (next/previous) works; Persian digits for area/price; pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **10. Property detail screen** 🎨
  - **Scope:** gallery placeholder (blue-500→700 gradient), title (fallback `{typeLabel} {region}`), specs (area/beds/floor/amenity columns…), price block (asking) + occupancy actual amounts when پر, owner, status pill, contact action, photo-count chip, **video** if present, **history timeline**.
  - **Design:** detail (~line 1132). History timeline + video are **not** in the design — build per `../docs/flows/add-property.md` + `../docs/domain-model.md`.
  - **API:** `GET /api/properties/{id}/` — full object incl. `owner`, `tenant`, `occupancy_*`, all specs + amenity booleans, `photos[]`, `videos[]`, `history[]`.
  - **Acceptance:** ⚠️ renders every spec type incl. amenity booleans; occupied shows tenant + dates + actual amounts (`occupancy_deposit`/`monthly_rent`/`rahn`); missing photos/video → placeholder; history timeline renders + empty state; 404 handled; pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **11. Add-property wizard — shared frame + Step 1** 🎨⚠️
  - **Scope:** multi-step wizard shell (progress, next/back, `افزودن فایل جدید`). Step 1 = type picker (آپارتمان/کلنگی/زمین/تجاری/اداری/ویلا) + region (inline **افزودن منطقه جدید** Picker) + address + پلاک. Branch logic per type.
  - **Design:** `APARTMENT STEP 1` / `KALNAGI / LAND STEP 1`; Picker primitive: `./design/DealEstate/Picker.dc.html`.
  - **API:** `GET /api/regions/`, `POST /api/regions/create/ {name}`.
  - **Acceptance:** ⚠️ required-field validation (address, type, region); inline region add appends + selects it; branch routing per type; back nav preserves entered state; pixel-match all branches.
  - **Done:** `_____ / commit _____`

- [ ] **12. Add-property wizard — Step 2 (type-specific specs)** 🎨⚠️
  - **Scope:** Apartment: floor/unit/area/beds/amenity toggles (`has_parking`/`has_obstructive_parking`/`has_balcony`/`has_backyard`/`has_elevator`)/`cabinet_material`(اوپن/MDF)/build-year/انباری(+`storage_deed`+`storage_area`)/تبدیل. Kalnagi: area/عقب‌نشینی(+desc)/تعداد بر/گذر کوچه(float m)/تعداد طبقات/حیاط(+area). Land: area/عقب‌نشینی(+desc)/تعداد بر/گذر کوچه.
  - **Design:** `APARTMENT/KALNAGI/LAND STEP 2`. Fields: `../docs/domain-model.md`.
  - **API:** fields feed `POST /api/properties/create/` (see task 14). Enums: `cabinet_material` ∈ `open|mdf|""` (API.md §3).
  - **Acceptance:** ⚠️ each branch renders + validates its fields; amenity toggles map to their boolean fields; conditional sub-fields (`storage_deed`/`storage_area`, `aqab_neshini_desc`, `hayat_area`) appear only when their toggle is on and become required then; `gozar_kooche` accepts decimals; pixel-match all three.
  - **Done:** `_____ / commit _____`

- [ ] **13. Add-property wizard — Step 3 (deal types + status)** 🎨⚠️
  - **Scope:** multi-select deal types (≥1): `فروش`(`price_per_meter`+`total_price`), `اجاره`(`deposit`+`monthly_rent`), `رهن کامل`(`rahn_amount`). **Land = sale only.** Status خالی/پر; پر → start/end Jalali dates + مستأجر + occupancy kind (اجاره/رهن) + actual amounts (`occupancy_deposit`+`occupancy_monthly_rent` or `occupancy_rahn`). Price inputs show spelled-out helper («یک میلیون تومان»).
  - **Design:** `APARTMENT/KALNAGI STEP 3` + `LAND STEP 3 (sale only)`; JDate primitive: `./design/DealEstate/JDate.dc.html`. Flow: `../docs/flows/add-property.md`.
  - **API:** feeds `POST /api/properties/create/`. Server rejects land+rent/rahn and occupied-without-amounts (API.md §4.4) — mirror client-side.
  - **Acceptance:** ⚠️ land hides rent/rahn; occupied requires tenant + dates + the chosen-kind amount; end date > start; price Persian formatting + spelled-out helper; multi-select combinations persist; pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **14. Add-property wizard — Step 4 (owner + media) + submit** 🎨⚠️
  - **Scope:** owner (مالک) picker/quick-add, optional `title`, photos + video + gallery uploader (all optional), review + submit → create property.
  - **Design:** `PROPERTY STEP 4 (owner + media)`; Uploader primitive: `./design/DealEstate/Uploader.dc.html`.
  - **API:** `POST /api/people/create/` (quick-add owner), `POST /api/properties/create/` (all wizard fields; `photo_files`/`video_files` are **string arrays** — no binary upload endpoint yet, see BACKEND_ISSUES.md), then `GET /api/properties/{id}/`.
  - **Acceptance:** ⚠️ owner required; upload validates type/size; blank `title` accepted (server auto-fills); video optional; successful create redirects to detail; server error → toast with Persian `message`; pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **15. Persons screen (list + detail + quick-add)** 🎨⚠️
  - **Scope:** list of اشخاص (مالک/مشتری), search (name/phone), detail with linked properties, add/edit person (name/phone/کد ملی/birth Jalali). Duplicate-phone error offers to open the existing person.
  - **Design:** persons section (اشخاص). Flow: `../docs/flows/persons.md`.
  - **API:** `GET /api/people/`(params `role`,`search`,`page`), `GET /api/people/{id}/`(+`owned_properties`/`rented_properties`), `POST /api/people/create/`, `PATCH /api/people/{id}/update/`.
  - **Acceptance:** ⚠️ search + role filter work; detail shows linked properties as navigable links; create/edit validates; duplicate phone → 400 handled with "open existing" affordance; empty state; pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **16. Contract wizard (4 steps)** 🎨⚠️
  - **Scope:** Step 1 pick property (search by title/owner/region); Step 2 parties (seller/owner + buyer/renter, quick-add); Step 3 type فروش/اجاره/رهن + Jalali dates + amounts; Step 4 **multiple** contract photos + notes + warning banner. On submit → register contract (flips property owner/tenant/status, writes history).
  - **Design:** `CONTRACT STEP 1..4`. Flow: `../docs/flows/contract.md`.
  - **API:** `GET /api/properties/`(picker), `POST /api/people/create/`(quick-add), `POST /api/contracts/create/`. **≥1 `photo_files` is mandatory** (400 `حداقل یک تصویر…` otherwise). Registering mutates the property.
  - **Acceptance:** ⚠️ missing party handled; end < start rejected; amount required per type (sale→`sale_price`, rent→`deposit_amount`+`monthly_rent`, rahn→`rahn_amount`); **≥1 photo enforced client-side**; on success the property's status/owner/tenant reflect the change (re-fetch detail to prove); pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **17. Request wizard (4 steps) + matching** 🎨⚠️
  - **Scope:** Step 1 customer (existing/quick-add); Step 2 type (اجاره/رهن/فروش — 3 types); Step 3 branch by type — rent/rahn constraints (persons/beds/floor/area/`wants_parking`/`wants_elevator`/`wants_storage`/max deposit/max rent/region/مهلت) vs sale constraints (`target_property_type`/build-year/`units_count`/floor/area/beds/budget/wants_*); Step 4 summary + auto-suggested matching files + mark-done.
  - **Design:** `REQUEST STEP 1..4`. Flow: `../docs/flows/request.md`.
  - **API:** `POST /api/requests/create/` (`customer_id` OR quick-add trio; fields per type), `GET /api/requests/{id}/matches/` (paginated properties), `POST /api/requests/{id}/mark-done/ {property_id}`.
  - **Acceptance:** ⚠️ 3 type branches render distinct fields; rent vs rahn money fields differ; sale shows target-type/units; `wants_*` toggles present; budget/deadline validation; matches list + empty state; mark-done sets status done and removes it from the open list; pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **18. Profile screen** 🎨
  - **Scope:** name/phone, notification toggle, dark-mode toggle (Switch), logout.
  - **Design:** profile (~line 99).
  - **API:** `GET /api/me/`, `PATCH /api/me/` (`notifications_enabled`, `dark_mode`, `first_name`, `last_name`).
  - **Acceptance:** ⚠️ toggles persist via PATCH (optimistic + confirmed); logout clears tokens + redirects to login; pixel-match.
  - **Done:** `_____ / commit _____`

- [ ] **19. Dark mode** 🎨
  - **Scope:** wire the profile dark-mode toggle to a theme (token overrides). Respect `prefers-color-scheme` default. No layout shift.
  - **Design:** DS "Backgrounds"/"States" (`./design/DealEstate/_ds/`).
  - **Acceptance:** ⚠️ toggle flips `data-theme`; key colors invert; no layout shift; snapshot both themes; persists across reload (from `/api/me/` `dark_mode`).
  - **Done:** `_____ / commit _____`

- [ ] **20. Frontend E2E pass (Playwright)** ⚠️
  - **Scope:** full behavioral flows against the running backend: login → dashboard → add-property (each type branch) → detail → create contract → create request → search/filter → logout.
  - **Setup:** backend running (`cd ../backend && uv run python manage.py runserver`); login mobile `09121112233` / password `Dev@12345`.
  - **Acceptance:** ⚠️ this task *is* the tests — all green, none skipped; assert user-visible behavior + edge cases (back nav, invalid form, network-error toast); visual verification screenshots attached.
  - **Done:** `_____ / commit _____`

---

## Suggested order

Fix task 7's `mobile`/proxy bug first (unblocks everything), then **8 → 9 → 10** (read paths),
the add-property wizard **11 → 12 → 13 → 14**, then **15**, the **16** contract and **17**
request wizards, **18** profile, **19** dark mode, and finish with **20** E2E.
