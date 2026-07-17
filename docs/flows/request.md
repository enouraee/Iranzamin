# Flow — Customer request (درخواست)

**Purpose:** record what a walk-in customer wants; auto-suggest matching files; let the admin mark the request done against the property that satisfied it.

Fields: [../domain-model.md](../domain-model.md#request-درخواست--appsrequests). Decision D2 (3 types).

## Steps (design: `REQUEST STEP 1..4`)

1. **Customer** — existing (search) or quick-add (first name + phone).
2. **Type** — `rent` اجاره / `rahn` رهن کامل / `sale` فروش.
3. **Constraints** (branches):
   - **rent** (اجاره): `persons_count`, `wants_parking`, `wants_storage`, `beds`, `wants_elevator`, `preferred_floor`, `min/max_area`, `max_deposit` (پیش), `max_rent` (کرایه), `region`, `deadline`.
   - **rahn** (رهن): same as rent but the money constraint is `max_deposit` = max رهن; `max_rent` unused.
   - **sale** (فروش): `target_property_type` (apartment/kalnagi/land), `min/max_build_year`, `units_count`, `preferred_floor`, `min/max_area`, `beds`, `budget` (نقدینگی), `wants_elevator`, `wants_parking`, `wants_storage`, `region`, `deadline`.
4. **Summary + matches** — show `request_matches` auto-suggested files; empty state `ملکی با این مشخصات یافت نشد.`

## Marking done
Admin picks the property that satisfied the request (searchable by title/owner/region) → `status=done`, `matched_property=<id>`. Done requests are filtered out of the open list.

## Backend contract
- `RequestCreateApi` → `request_create` (+ quick-add customer). `request_list`/filters (by type, status, region). `RequestMatchesApi` → `request_matches`. `request_mark_done(*, request, property)`.
- Matching respects: type→deal flag (rent→is_for_rent, rahn→is_for_rahn, sale→is_for_sale), area range, beds, budget/deposit/rent ceilings, region, `wants_*`→amenity columns, and only `status=vacant`.

## Acceptance criteria
- [x] Three type branches render their correct field sets. ⚠️
- [x] rent vs rahn money fields differ (پیش+کرایه vs رهن). ⚠️
- [x] sale branch collects target type / units / build year / budget. ⚠️
- [x] Quick-add customer with name+phone works.
- [x] `wants_parking/elevator/storage` narrow the match set. ⚠️
- [x] Matches exclude occupied and over-budget properties; empty → empty state. ⚠️
- [x] Mark-done sets status+matched_property; done requests leave the open list.
- [x] Budget/area/deadline validation (max ≥ min; deadline not in past).
- [x] Unauth → 401. Visual matches design both widths.

## Edge cases ⚠️
Min>max area/build-year; no matches; matching a land request that asks for beds/elevator (ignore N/A constraints); marking done twice; quick-add duplicate phone; deadline in the past.
