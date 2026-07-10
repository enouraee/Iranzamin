# Decisions (ADR) — DealEstate

Locked calls that shape the data model and flows. Change one only with the owner's sign-off; if you change it, update the affected flow docs, `domain-model.md`, and TASKS.md in the same commit.

Date format: absolute. "Now" = 2026-07-10.

---

## D1 — Amenities are explicit boolean columns (not JSON)

**Decision:** Apartment amenities are real DB columns with **English** names, not entries in a loose `amenities` JSON blob.

| Persian UI label | Column |
|---|---|
| پارکینگ | `has_parking` |
| پارکینگ مزاحم | `has_obstructive_parking` |
| بالکن | `has_balcony` |
| حیاط خلوت | `has_backyard` |
| آسانسور | `has_elevator` |

**Why:** clean filtering and request↔property matching (a request may require parking/elevator/storage). JSON filtering in MySQL is awkward and untyped.

**Migration note:** the shipped `Property.amenities = JSONField` must be replaced by these columns. Drop `amenities` (no production data yet). See task 42.

---

## D2 — Customer requests have 3 types: rent / rahn / sale

**Decision:** `Request.request_type ∈ {rent (اجاره), rahn (رهن کامل), sale (فروش)}`. The previous 2-value `rent_mortgage | buy` is replaced.

**Why:** the office thinks in these three deal kinds; اجاره and رهن ask for different money (پیش+کرایه vs رهن), and merging them hid that.

- `rent` → constraints use `max_deposit` (پول پیش) + `max_rent` (کرایه ماهانه).
- `rahn` → constraint uses `max_deposit` as the max رهن (full-mortgage) amount; `max_rent` unused.
- `sale` → constraint uses `budget` (نقدینگی خریدار); adds property-shape fields (target type, units, build year…).

See task 44.

---

## D3 — Generic `PropertyHistory` audit table

**Decision:** every change to a property's `owner`, `tenant`, `status`, or occupancy/price amounts is logged in a `PropertyHistory` row (who, when, field, old→new, source). Shown on the property detail as a timeline.

**Why:** spec requires an auditable history of owner/tenant/status changes, whether the change came from registering a contract or from a manual edit.

- Written by `property_update`, `property_set_status`, and `contract_create` (all inside their existing `transaction.atomic()`).
- `source ∈ {manual, contract}`; when `contract`, link the `Contract`.

See task 43.

---

## D4 — Occupied property stores actual occupancy amounts

**Decision:** add `occupancy_deposit`, `occupancy_monthly_rent`, `occupancy_rahn` to `Property`. These record what the **sitting tenant actually pays**, separate from the listing's asking `deposit` / `monthly_rent` / `rahn_amount`.

**Why:** asking price ≠ current contract price. The office needs both.

- Required per occupancy kind when `status = occupied` (see add-property flow).
- On rent/rahn contract registration, `contract_create` sets these from the contract amounts.

See task 45.

---

## D5 — Properties have a searchable title

**Decision:** add `Property.title` (Persian, short, free text, indexed). Used to find a property when linking it to a completed request or a contract, alongside owner name and region.

**Why:** spec: "add name for all properties that can be searchable here."

If empty on create, auto-fill a default from `{type_label} {region} پلاک {plak}` in `property_create`. See task 46.

---

## D6 — Media: photos, videos, gallery; contracts allow multiple photos

**Decision:**
- Keep `PropertyPhoto` (gallery). Add `PropertyVideo` (url/file, optional) — all media optional for all 3 types.
- Replace single `Contract.contract_image` with a `ContractPhoto` related table (multiple images; the contract scan may be marked required at the flow level, but the model allows many/zero).

See tasks 42 (video) and 47 (contract photos).

---

## D7 — `gozar_kooche` is a measurement, not text

**Decision:** `Property.gozar_kooche` changes from `CharField` to `DecimalField(max_digits=6, decimal_places=2)` — width of the alley/passage in **meters** (float). Applies to kalnagi + land. See task 42.

---

## Open questions (not blocking; default in parentheses)

- **O1 — Cabinet material** جنس کابینت: spec lists "اوپن" and "MDF". اوپن is a kitchen style, MDF a material — they aren't mutually exclusive. Default: model `cabinet_material` as choices `{open: اوپن, mdf: MDF}` single-select until told otherwise.
- **O2 — Recommendation engine**: spec wants request→property recommendations beyond hard matching. Out of scope now; `request_matches` covers hard-constraint matching (task 39, done). Track as future.
- **O3 — Notifications**: follow-up reminders + rent-contract-ending alerts. Read model exists (`قراردادهای نزدیک به پایان` selector); delivery channel (in-app only vs push/SMS) undecided. Default: in-app list only. See dashboard-notifications flow.
