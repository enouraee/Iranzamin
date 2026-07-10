# Flow — Add property (افزودن فایل جدید)

**Purpose:** office adds a property ("فایل") fast, in a 4-step wizard that branches by type.

Field types/rules: see [../domain-model.md](../domain-model.md#property--file-ملک--فایل). Decisions: [../decisions.md](../decisions.md).

## Steps (design: `APARTMENT/KALNAGI/LAND STEP 1..4`)

### Step 1 — type + location (all types)
- Type picker: آپارتمان / کلنگی / زمین (+ تجاری/اداری/ویلا exist in model; treat like apartment unless told otherwise).
- `region` — searchable Picker with inline **افزودن منطقه جدید** (calls region create).
- `address` (R), `plak` (O), `title` (O — auto-filled if blank).
- Branch: apartment → apartment step 2; kalnagi/land → their step 2.

### Step 2 — type-specific specs
- **Apartment:** `floor`, `unit`, `area`, `beds`, amenities `has_parking`/`has_obstructive_parking`/`has_balcony`/`has_backyard`/`has_elevator`, `cabinet_material` (اوپن/MDF), `has_storage` → (`storage_deed`, `storage_area`), `build_year`.
- **Kalnagi:** `area`, `has_aqab_neshini` → `aqab_neshini_desc`, `taadad_bar`, `gozar_kooche` (m), `taadad_tabaghat`, `has_hayat` → `hayat_area`.
- **Land:** `area`, `has_aqab_neshini` → `aqab_neshini_desc`, `taadad_bar`, `gozar_kooche` (m).
- Conditional sub-fields (`storage_deed`/`storage_area`, `aqab_neshini_desc`, `hayat_area`) appear only when their toggle is on, and become required then.

### Step 3 — deal types + status
- Multi-select deal types (≥1): فروش (`price_per_meter`+`total_price`), اجاره (`deposit`+`monthly_rent`), رهن کامل (`rahn_amount`).
- **Land = sale only** — hide/disable rent & rahn; reject server-side.
- Status خالی/پر. If پر: `tenant` (Picker/quick-add), `occupancy_start`, `occupancy_end`, occupancy kind (اجاره/رهن) → actual amounts `occupancy_deposit`+`occupancy_monthly_rent` or `occupancy_rahn`.
- Price inputs show a spelled-out helper line under the number (e.g. `۱٬۰۰۰٬۰۰۰` → «یک میلیون تومان»).

### Step 4 — owner + media + submit
- `owner` (مالک) Picker or quick-add (min: first name + phone).
- Photos (gallery), video, all optional. Upload validates type/size.
- Review summary → submit → `property_create` → redirect to detail.

## Backend contract
- `region_create`, `PropertyCreateApi` (`property_create`), media add.
- `property_create` auto-fills `title` if blank (D5); enforces land-sale-only, deal-amount requirements, occupied-requires-tenant+dates+amounts.

## Acceptance criteria
- [ ] All three branches render exactly their fields; conditional sub-fields toggle. ⚠️
- [ ] ≥1 deal type required; per-type amount fields required when selected. ⚠️
- [ ] Land: rent/rahn impossible in UI **and** rejected by server. ⚠️
- [ ] Occupied (پر) requires tenant + start/end + occupancy actual amount for the chosen kind; end > start. ⚠️
- [ ] Amenities persist as the D1 boolean columns; round-trip to detail. ⚠️
- [ ] Inline region add works and selects the new region.
- [ ] Owner quick-add with only name+phone succeeds.
- [ ] Price fields format Persian digits + show spelled-out helper.
- [ ] Blank `title` → sensible auto-fill; provided `title` is kept and is searchable.
- [ ] Media optional; missing media still creates the property; detail shows placeholder.
- [ ] Back nav preserves entered state across steps. ⚠️
- [ ] Visual: matches design at ≤480px and ≥920px; console clean.

## Edge cases to test ⚠️
Empty required fields per step; land+rent; occupied without dates/tenant/amount; end ≤ start; huge Toman value stored as int; invalid Persian/Latin digit entry; duplicate owner phone on quick-add; oversized/invalid upload; region name duplicate.
