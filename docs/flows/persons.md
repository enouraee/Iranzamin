# Flow — People (اشخاص: مالک / مشتری)

**Purpose:** one table for owners and customers; fast quick-add from anywhere (property owner, contract party, request customer); a detail page showing everything the person is linked to.

Fields: [../domain-model.md](../domain-model.md#person-شخص--apspeople).

## Screens
- **List** — search by name / phone / national id; filter by role (مالک/مشتری); empty state `شخصی با این مشخصات یافت نشد.`
- **Detail** — profile + linked owned properties, contracts (as party_a/party_b), and requests.
- **Add / edit** — full form; **quick-add** is the same form reduced to first name + phone + role.

## Uniqueness
- `phone` unique — duplicate is rejected with a clear Persian message; the UI should offer to open the existing person instead of erroring blindly.
- `national_id` unique when provided; blank stays NULL so many people can lack one.

## Backend contract
`person_list` (+search/filter), `person_get` (with linked objects), `person_create`, `person_update`.

## Acceptance criteria
- [ ] Search matches name / phone / national id. ⚠️
- [ ] Role filter works; empty state shows the exact copy.
- [ ] Detail lists linked properties/contracts/requests; links resolve. ⚠️
- [ ] Quick-add (name+phone+role) succeeds; full add validates national id.
- [ ] Duplicate phone rejected; UI points to the existing record. ⚠️
- [ ] Invalid national id rejected in `full_clean`. ⚠️
- [ ] Unauth → 401. Visual matches design both widths.

## Edge cases ⚠️
Duplicate phone; duplicate national id; invalid national-id checksum; person linked to many objects (list renders); editing phone to collide with another person; birth date parse (Jalali↔Gregorian).
