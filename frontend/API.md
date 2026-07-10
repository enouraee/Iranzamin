# API Reference — DealEstate / املاک ایران زمین

Single source of truth for the backend REST API, written for the frontend.
**You do not need to read `backend/` source.** Everything the UI needs is here.
If something is missing, wrong, or blocks you, **do not go read the backend** — log it in
[`BACKEND_ISSUES.md`](BACKEND_ISSUES.md) (see [AGENTS.md](AGENTS.md)).

---

## 1. Basics

- **Base URL**: `/api/` (all paths below are relative to it). In dev the backend runs at
  `http://127.0.0.1:8000/`, so the real URL is e.g. `http://127.0.0.1:8000/api/properties/`.
- **Content type**: JSON (`application/json`) for all requests and responses.
- **Auth**: JWT (SimpleJWT) Bearer tokens. Send `Authorization: Bearer <access>` on every
  request except login/refresh. Access token lifetime is **12h**.
- Every endpoint requires auth **except** `auth/login/` and `auth/refresh/`.

### Dev login user (already created)

| Field | Value |
|---|---|
| mobile | `09121112233` |
| password | `Dev@12345` |

This is a superuser (also usable at `/admin/`). Log in with it to get tokens.

---

## 2. Conventions

### Auth flow
```
POST /api/auth/login/   { "mobile": "09121112233", "password": "Dev@12345" }
  → 200 { "access": "<jwt>", "refresh": "<jwt>" }

POST /api/auth/refresh/ { "refresh": "<jwt>" }
  → 200 { "access": "<jwt>" }
```
> ⚠️ The login body field is **`mobile`**, not `phone`. (The current `src/api/auth.ts`
> sends `phone` — that's a bug; the server ignores it and login fails validation.)

### Pagination
List endpoints use page-number pagination and return:
```json
{ "count": 42, "next": "http://.../api/properties/?page=2", "previous": null, "results": [ ... ] }
```
Query params: `page` (1-based), `page_size` (default **20**, max **100**).

### Errors
Business/validation errors → **HTTP 400** with:
```json
{ "message": "متن خطا به فارسی", "extra": { } }
```
`extra` may carry per-field detail. DRF field-validation errors (e.g. missing required
field) return the standard DRF shape (`{ "field": ["msg"] }`). Auth failures → **401**.
Not found → **404**. Show `message` to the user when present (it is Persian, UI-ready).

### Money
All money fields are **integers, Toman**, no decimals. Format on the frontend
(Persian digits + `٬` thousands separator).

### Dates
- Sent/received as ISO `YYYY-MM-DD` (Gregorian). Convert to/from **Jalali** at the UI edge
  (`jalaali-js`). `created_at` / `updated_at` are ISO 8601 datetimes.

### Media (photos / videos)
`photo_files`, `video_files`, and contract `photo_files` are **arrays of strings** (stored
file paths / URLs) — **not** multipart uploads. There is currently **no binary-upload
endpoint**; the API just stores whatever string paths you send. If you need real file upload,
log it in `BACKEND_ISSUES.md`.

---

## 3. Enum reference

Send the **value** (left); the label (right) is the Persian UI text.

**Property type** (`type`): `apartment` آپارتمان · `kalnagi` کلنگی · `land` زمین ·
`commercial` تجاری · `office` اداری · `villa` ویلا
**Property status** (`status`): `vacant` خالی (green) · `occupied` پر (red)
**Cabinet material** (`cabinet_material`): `open` اوپن · `mdf` MDF · `""` (unset)
**Person role** (`role`): `owner` مالک · `customer` مشتری
**Contract type** (`contract_type`): `sale` فروش · `rent` اجاره · `rahn` رهن
**Request type** (`request_type`): `sale` فروش · `rent` اجاره · `rahn` رهن
**Request status** (`status`): `open` باز · `done` انجام‌شده
**Property-history** `change_type`: `owner` · `tenant` · `status` · `price` · `other`;
`source`: `manual` · `contract`

---

## 4. Endpoints

### 4.1 Auth & profile

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `auth/login/` | — | mobile+password → access/refresh |
| POST | `auth/refresh/` | — | refresh → new access |
| GET | `me/` | ✓ | current user profile |
| PATCH | `me/` | ✓ | update profile |

**GET `me/`** → `200`
```json
{ "id": 1, "mobile": "09121112233", "first_name": "توسعه", "last_name": "فرانت",
  "full_name": "توسعه فرانت", "notifications_enabled": true, "dark_mode": false }
```
**PATCH `me/`** body (all optional): `first_name`, `last_name`, `notifications_enabled`,
`dark_mode`. → same shape as GET.

---

### 4.2 Regions (منطقه)

| Method | Path | Purpose |
|---|---|---|
| GET | `regions/` | list (paginated) |
| POST | `regions/create/` | add region |

Region object: `{ "id", "name", "created_at" }`.
**POST `regions/create/`** body: `{ "name": "شهرک غرب" }` → `201` region object.

---

### 4.3 People (اشخاص)

| Method | Path | Purpose |
|---|---|---|
| GET | `people/` | list (paginated) |
| POST | `people/create/` | create |
| GET | `people/{id}/` | detail |
| PATCH | `people/{id}/update/` | update |

**List filters** (query params): `role` (`owner`/`customer`), `search` (matches first/last
name or phone).

**List item / create output**:
```json
{ "id", "first_name", "last_name", "full_name", "phone",
  "national_id": "…|null", "role": "owner", "created_at" }
```
**Detail** adds: `birth_date` (`null` ok), `owned_properties` and `rented_properties`
(arrays of `{ id, address, type, status }`).

**POST `people/create/`** body: required `first_name`, `last_name`, `phone`, `role`;
optional `national_id`, `birth_date` (`YYYY-MM-DD`). → `201`.
**PATCH `people/{id}/update/`** — any subset of the same fields.

---

### 4.4 Properties (ملک / فایل) — core entity

| Method | Path | Purpose |
|---|---|---|
| GET | `properties/` | list (paginated) |
| POST | `properties/create/` | create |
| GET | `properties/{id}/` | detail (full spec + history + media) |
| PATCH | `properties/{id}/update/` | update fields |
| DELETE | `properties/{id}/delete/` | delete → `204` |
| PATCH | `properties/{id}/status/` | set vacant/occupied |
| POST | `properties/{id}/photos/` | add photos |
| DELETE | `properties/{id}/photos/{photo_id}/` | remove photo → `204` |
| POST | `properties/{id}/videos/` | add videos |
| DELETE | `properties/{id}/videos/{video_id}/` | remove video → `204` |

**List filters**: `type`, `region` (id), `status`, `deal_type` (`sale`/`rent`/`rahn`),
`search` (title/address/region name), and booleans `has_parking`,
`has_obstructive_parking`, `has_balcony`, `has_backyard`, `has_elevator`.

**List item**:
```json
{ "id", "title", "type", "region": { "id", "name" }, "address", "plak", "status",
  "area": "120.00|null", "is_for_sale", "is_for_rent", "is_for_rahn",
  "total_price": "int|null", "monthly_rent": "int|null", "rahn_amount": "int|null",
  "cover_photo": "path|null", "created_at" }
```

**Detail** — everything in list plus:
- Parties: `agent {id,first_name,last_name}`, `owner {id,first_name,last_name,phone}|null`,
  `tenant {…}|null`.
- Occupancy: `occupancy_start`, `occupancy_end`, `occupancy_deposit`,
  `occupancy_monthly_rent`, `occupancy_rahn` (all nullable).
- Deal pricing: `price_per_meter`, `total_price`, `deposit`, `monthly_rent`, `rahn_amount`.
- Apartment specs: `floor`, `unit`, `beds`, `has_parking`, `has_obstructive_parking`,
  `has_balcony`, `has_backyard`, `has_elevator`, `cabinet_material`, `build_year`,
  `has_storage`, `storage_deed`, `storage_area`, `has_tobdil`.
- Kalnagi/Land: `has_aqab_neshini`, `aqab_neshini_desc`, `taadad_bar`, `gozar_kooche`.
- Kalnagi only: `taadad_tabaghat`, `has_hayat`, `hayat_area`.
- `photos`: `[{ id, file, is_cover }]`, `videos`: `[{ id, file }]`.
- `history`: `[{ id, change_type, field, old_value, new_value, source, contract_id,
  changed_by: {id,first_name,last_name}|null, created_at }]`.
- `created_at`, `updated_at`.

**POST `properties/create/`** — required: `type`, `region_id`, `address`. Optional (with
defaults): `title` (`""` → auto-filled `{type} {region} پلاک {plak}`), `plak` (`""`),
`owner_id`, `status` (`vacant`), occupancy fields (`tenant_id`, `occupancy_start`,
`occupancy_end`, `occupancy_deposit`, `occupancy_monthly_rent`, `occupancy_rahn`), deal flags
+ amounts (`is_for_sale`+`price_per_meter`+`total_price`, `is_for_rent`+`deposit`+
`monthly_rent`, `is_for_rahn`+`rahn_amount`), all specs above, and `photo_files` /
`video_files` (string arrays). → `201 { id, type, status, created_at }`.

**Business rules to expect (errors come back as 400 + Persian `message`)**:
- **Land is sale-only** — rent/rahn on `land` is rejected.
- `occupied` requires tenant + dates + at least one occupancy amount.
- Missing region/owner/tenant id → 400 with a Persian message.

**PATCH `properties/{id}/update/`** — any subset of: `title`, `region_id`, `address`,
`plak`, `owner_id` (send `null` to clear), all deal flags/amounts, and all specs. →
`200 { id, type, status, updated_at }`.

**PATCH `properties/{id}/status/`** body: `status` (`vacant`|`occupied`), plus when occupied
`tenant_id`, `occupancy_start`, `occupancy_end`, `occupancy_deposit`,
`occupancy_monthly_rent`, `occupancy_rahn`. → `{ id, status }`.

**POST `properties/{id}/photos/`** body `{ "photo_files": ["a.jpg", …] }` (min 1) →
`201 [{ id, file, is_cover }]`. Videos analogous with `video_files`.

---

### 4.5 Contracts (قرارداد)

| Method | Path | Purpose |
|---|---|---|
| GET | `contracts/` | list (paginated) |
| POST | `contracts/create/` | create (updates property owner/tenant/status) |
| GET | `contracts/{id}/` | detail |
| PATCH | `contracts/{id}/update/` | update |
| DELETE | `contracts/{id}/delete/` | delete → `204` (reverts property occupancy) |

**List filters**: `contract_type`, `property` (id), `start_date__gte`, `start_date__lte`.

**Object**:
```json
{ "id", "property": { "id", "address", "type", "region": {id,name} },
  "contract_type", "party_a": {id,full_name,phone}|null,
  "party_b": {id,full_name,phone}|null,
  "start_date", "end_date": "…|null",
  "sale_price": "int|null", "deposit_amount": "int|null",
  "monthly_rent": "int|null", "rahn_amount": "int|null",
  "photos": [{ id, file, order }], "notes", "created_at" }
```
Detail adds `updated_at`.

**POST `contracts/create/`** — required: `property_id`, `contract_type`, `start_date`.
Optional: `party_a_id` (seller/owner), `party_b_id` (buyer/renter), `end_date`,
`sale_price`, `deposit_amount`, `monthly_rent`, `rahn_amount` (all `min 1`), `notes`,
and **`photo_files`** (string array). → `201`.
> ⚠️ Contract photos are **mandatory** — at least one `photo_files` entry, else 400
> `حداقل یک تصویر برای قرارداد الزامی است.`
> Registering a contract **mutates the property**: sets owner (sale) or tenant + occupancy
> (rent/rahn) and flips status. Deleting reverts it.

**PATCH `contracts/{id}/update/`** — subset of party ids, dates, amounts, `photo_files`,
`notes`. (Cannot change `property_id`/`contract_type`.)

---

### 4.6 Requests (درخواست) — buyer/renter looking for a property

| Method | Path | Purpose |
|---|---|---|
| GET | `requests/` | list (paginated) |
| POST | `requests/create/` | create (customer may be existing or quick-added) |
| GET | `requests/{id}/` | detail |
| PATCH | `requests/{id}/update/` | update |
| DELETE | `requests/{id}/delete/` | delete → `204` |
| POST | `requests/{id}/mark-done/` | close, linking matched property |
| GET | `requests/{id}/matches/` | auto-suggested matching properties (paginated) |

**List filters**: `request_type`, `status`, `customer` (id), `region` (id),
`deadline__lte`, `deadline__gte`.

**Object**:
```json
{ "id", "customer": {id,full_name,phone}, "region": {id,name}|null,
  "matched_property": {id,address}|null, "request_type", "status",
  "target_property_type": "…|null", "units_count", "persons_count", "beds",
  "needs", "preferred_floor", "min_area", "max_area", "min_build_year",
  "max_build_year", "wants_parking", "wants_elevator", "wants_storage",
  "max_deposit", "max_rent", "budget", "deadline": "…|null", "notes", "created_at" }
```
Detail adds `updated_at`.

**POST `requests/create/`** — required: `request_type`. Customer is **either**
`customer_id` **or** quick-add trio `customer_first_name` + `customer_last_name` +
`customer_phone`. Optional: `region_id`, `target_property_type`, `units_count`,
`persons_count`, `beds`, `needs`, `preferred_floor`, `min_area`, `max_area`,
`min_build_year`, `max_build_year`, `wants_parking`, `wants_elevator`, `wants_storage`,
`max_deposit`, `max_rent`, `budget`, `deadline`, `notes`. → `201`.

**POST `requests/{id}/mark-done/`** body `{ "property_id": <id> }` → sets status `done`
and links matched property.

**GET `requests/{id}/matches/`** → paginated properties (list-item-like shape with `area`,
`beds`, `floor`, `build_year`, deal flags/amounts, `cover_photo`).

---

### 4.7 Dashboard

**GET `dashboard/stats/`** → `200`
```json
{ "total_properties", "vacant_properties", "occupied_properties",
  "total_contracts", "open_requests",
  "recent_properties": [ { "id", "type", "address", "region_name", "status", "created_at" } ] }
```

---

## 5. Quick map (all routes)

```
POST   auth/login/                          POST   properties/{id}/photos/
POST   auth/refresh/                         DELETE properties/{id}/photos/{photo_id}/
GET    me/   PATCH me/                        POST   properties/{id}/videos/
GET    regions/   POST regions/create/        DELETE properties/{id}/videos/{video_id}/
GET    people/   POST people/create/          GET    contracts/   POST contracts/create/
GET    people/{id}/   PATCH people/{id}/update/  GET  contracts/{id}/  PATCH contracts/{id}/update/
GET    properties/   POST properties/create/   DELETE contracts/{id}/delete/
GET    properties/{id}/                        GET    requests/   POST requests/create/
PATCH  properties/{id}/update/                 GET    requests/{id}/  PATCH requests/{id}/update/
DELETE properties/{id}/delete/                 DELETE requests/{id}/delete/
PATCH  properties/{id}/status/                 POST   requests/{id}/mark-done/
GET    dashboard/stats/                        GET    requests/{id}/matches/
```
