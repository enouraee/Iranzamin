# Flow — Contract (قرارداد)

**Purpose:** register a deal (فروش/اجاره/رهن کامل) on a property; registering it updates the property's owner/tenant/status and writes an audit history.

Fields: [../domain-model.md](../domain-model.md#contract-قرارداد--appscontracts). Decisions: D3 (history), D4 (occupancy amounts), D6 (multi-photo).

## Steps (design: `CONTRACT STEP 1..4`)

1. **Pick property** — searchable by `title` / owner name / region.
2. **Parties (طرفین قرارداد)** — find each by phone / name / national id, or quick-add. Assign roles: sale → `party_a`=seller/owner, `party_b`=buyer; rent/rahn → `party_a`=owner, `party_b`=tenant.
3. **Type + dates + amounts** — `contract_type` فروش/اجاره/رهن; Jalali `start_date` (+ `end_date` for rent/rahn); amounts per type (sale→`sale_price`; rent→`deposit_amount`+`monthly_rent`; rahn→`rahn_amount`).
4. **Docs + notes** — one or more contract photos (`ContractPhoto`), `notes`, and the confirmation/warning banner.

## Side effects (all inside one `transaction.atomic()`)
- **Sale:** set `property.owner = party_b` (new owner). Log `PropertyHistory(change_type=owner, source=contract)`.
- **Rent/Rahn:** set `property.tenant = party_b`, `status = occupied`, `occupancy_start/end` from the contract, and occupancy actual amounts (`occupancy_deposit`+`occupancy_monthly_rent` for rent, `occupancy_rahn` for rahn) (D4). Log `PropertyHistory` rows for tenant + status + price.
- Rollback on any failure — contract must not persist if the property update fails.

## Backend contract
- `ContractCreateApi` → `contract_create(*, property, party_a, party_b, contract_type, dates, amounts, photos, notes)`.
- `contract_update` / `contract_delete` — on delete, reverse the status side-effect where sensible and log a reversing `PropertyHistory`.

## Acceptance criteria
- [x] Property search finds by title / owner / region. ⚠️
- [x] Parties resolvable by phone/name/national id; quick-add works.
- [x] Amount required per type; `end_date` required + > `start_date` for rent/rahn. ⚠️
- [x] Sale registration updates `owner`; rent/rahn updates tenant+status+occupancy amounts. ⚠️ (assert on returned property)
- [x] Every owner/tenant/status/price change appears in `PropertyHistory` with source=contract. ⚠️
- [x] Atomic: forced failure in the property update leaves **no** contract row. ⚠️
- [x] ≥1 contract photo enforced at the flow level; multiple accepted.
- [~] Delete reverses status where appropriate and logs it. ⚠️ (reversal done; reversing `PropertyHistory` NOT written — gap in `contract_delete`)
- [x] Unauth → 401.
- [ ] Visual: wizard matches design both widths. (needs live screenshot verification)

## Edge cases ⚠️
Missing party; same person on both sides; end ≤ start; wrong/missing amount for the chosen type; contract on land with rent/rahn (reject — land is sale only); registering while already occupied; delete of a contract whose property later changed again.
