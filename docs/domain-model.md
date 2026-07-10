# Domain model — canonical field reference

Every entity, every field. This is the **single source of truth for data**. Backend field names are authoritative; Persian labels are the UI copy. Prices are integers in **Toman**. Dates stored as Gregorian `DateField`, entered/displayed as **Jalali** at the edges.

Legend: **R** = required on create · **O** = optional · **cond** = required only under the stated condition.

---

## Person (شخص) — `apps/people`

Owners (`owner`/مالک) and customers (`customer`/مشتری) share one table.

| Persian | field | type | R/O | rules |
|---|---|---|---|---|
| نام | `first_name` | char | **R** | |
| نام خانوادگی | `last_name` | char | O | required by UI on full add; quick-add allows blank |
| موبایل | `phone` | char | **R** | unique; `^09\d{9}$` |
| کد ملی | `national_id` | char(10) | O | unique when set; Iranian checksum; empty → NULL |
| تاریخ تولد | `birth_date` | date | O | Jalali input |
| نقش | `role` | choice | **R** | `owner` / `customer` |

**Quick-add minimum:** `first_name` + `phone` + `role`. Everything else fillable later.

---

## Region (منطقه) — `apps/regions`

| Persian | field | type | rules |
|---|---|---|---|
| نام منطقه | `name` | char | unique, non-blank; inline-addable from the property wizard Picker |

---

## Property / File (ملک / فایل) — `apps/properties`

### Core (all types)

| Persian | field | type | R/O | rules |
|---|---|---|---|---|
| عنوان | `title` | char, indexed | O | searchable; auto-filled if blank (D5) |
| نوع | `type` | choice | **R** | `apartment` آپارتمان · `kalnagi` کلنگی · `land` زمین · `commercial` تجاری · `office` اداری · `villa` ویلا |
| منطقه | `region` | FK Region | **R** | |
| آدرس | `address` | text | **R** | |
| پلاک | `plak` | char | O | |
| مشاور | `agent` | FK User | **R** | set from request user |
| مالک | `owner` | FK Person | O | required by add-property flow step 4; SET_NULL |
| وضعیت | `status` | choice | **R** | `vacant` خالی (green) · `occupied` پر (red); default vacant |

### Deal types (multi-select; ≥1 required; **land = sale only**)

| Persian | field | type | rules |
|---|---|---|---|
| فروش | `is_for_sale` | bool | if true → `price_per_meter` + `total_price` required |
| — قیمت هر متر | `price_per_meter` | bigint | Toman |
| — قیمت کل | `total_price` | bigint | Toman |
| اجاره | `is_for_rent` | bool | if true → `deposit` + `monthly_rent` required |
| — پول پیش | `deposit` | bigint | Toman |
| — اجاره ماهانه | `monthly_rent` | bigint | Toman |
| رهن کامل | `is_for_rahn` | bool | if true → `rahn_amount` required |
| — پول رهن | `rahn_amount` | bigint | Toman |
| تبدیل | `has_tobdil` | bool | |

### Occupancy (only when `status = occupied`) — see D4

| Persian | field | type | rules |
|---|---|---|---|
| مستأجر | `tenant` | FK Person | **cond** required when occupied |
| تاریخ شروع | `occupancy_start` | date | **cond** required when occupied |
| تاریخ پایان | `occupancy_end` | date | **cond** required when occupied; > start |
| نوع تصرف | (derived from رهن/اجاره) | | choose اجاره or رهن کامل for the sitting tenant |
| پول پیش فعلی | `occupancy_deposit` | bigint | cond: actual, when اجاره |
| اجاره فعلی | `occupancy_monthly_rent` | bigint | cond: actual, when اجاره |
| پول رهن فعلی | `occupancy_rahn` | bigint | cond: actual, when رهن کامل |

### Apartment-specific (آپارتمان)

| Persian | field | type | rules |
|---|---|---|---|
| طبقه | `floor` | int | |
| واحد | `unit` | char | |
| متراژ | `area` | decimal | m² |
| تعداد خواب | `beds` | small int | |
| پارکینگ | `has_parking` | bool | D1 |
| پارکینگ مزاحم | `has_obstructive_parking` | bool | D1 |
| بالکن | `has_balcony` | bool | D1 |
| حیاط خلوت | `has_backyard` | bool | D1 |
| آسانسور | `has_elevator` | bool | D1 |
| جنس کابینت | `cabinet_material` | choice | `open` اوپن / `mdf` MDF (O1) |
| انباری | `has_storage` | bool | |
| — انباری سندی | `storage_deed` | bool | only if has_storage |
| — متراژ انباری | `storage_area` | decimal | only if has_storage |
| سال ساخت | `build_year` | small int | Jalali year |

### Kalnagi-specific (کلنگی)

| Persian | field | type | rules |
|---|---|---|---|
| متراژ | `area` | decimal | m² |
| عقب‌نشینی دارد | `has_aqab_neshini` | bool | |
| — توضیح عقب‌نشینی | `aqab_neshini_desc` | text | required if has_aqab_neshini |
| تعداد بر | `taadad_bar` | small int | |
| گذر کوچه | `gozar_kooche` | decimal | meters (D7) |
| تعداد طبقات | `taadad_tabaghat` | small int | |
| حیاط دارد | `has_hayat` | bool | |
| — متراژ حیاط | `hayat_area` | decimal | required if has_hayat |

### Land-specific (زمین) — sale only

| Persian | field | type |
|---|---|---|
| متراژ | `area` | decimal |
| عقب‌نشینی دارد (+توضیح) | `has_aqab_neshini` / `aqab_neshini_desc` | bool / text |
| تعداد بر | `taadad_bar` | small int |
| گذر کوچه | `gozar_kooche` | decimal (m) |

### Media (all optional, all types)

- `PropertyPhoto` (gallery): `property`, `file`, `is_cover`.
- `PropertyVideo`: `property`, `file`. (D6)

---

## PropertyHistory (تاریخچه) — `apps/properties` (D3)

Audit row for every owner/tenant/status/price change.

| field | type | notes |
|---|---|---|
| `property` | FK Property | CASCADE |
| `changed_by` | FK User | who made the change |
| `change_type` | choice | `owner` / `tenant` / `status` / `price` / `other` |
| `field` | char | the changed field name |
| `old_value` | text | rendered old value (may be blank) |
| `new_value` | text | rendered new value |
| `source` | choice | `manual` / `contract` |
| `contract` | FK Contract | nullable; set when source=contract |
| `created_at` | datetime | from BaseModel |

Written inside the atomic block of `property_update`, `property_set_status`, and `contract_create`.

---

## Contract (قرارداد) — `apps/contracts`

| Persian | field | type | rules |
|---|---|---|---|
| ملک | `property` | FK Property | **R** |
| طرف الف | `party_a` | FK Person | seller/owner |
| طرف ب | `party_b` | FK Person | buyer/tenant |
| نوع | `contract_type` | choice | `sale` فروش / `rent` اجاره / `rahn` رهن کامل |
| تاریخ شروع | `start_date` | date | **R**, Jalali |
| تاریخ پایان | `end_date` | date | rent/rahn: required, > start |
| قیمت فروش | `sale_price` | bigint | required if sale |
| پول پیش | `deposit_amount` | bigint | required if rent |
| اجاره ماهانه | `monthly_rent` | bigint | required if rent |
| مبلغ رهن | `rahn_amount` | bigint | required if rahn |
| تصاویر قرارداد | `ContractPhoto[]` | related | multiple (D6); ≥1 enforced at flow level |
| یادداشت | `notes` | text | O |

**Side effects on create** (atomic): update property owner (sale) or tenant+occupancy+status (rent/rahn), set occupancy amounts (D4), write `PropertyHistory` rows (D3).

---

## Request (درخواست) — `apps/requests` (D2)

Customer looking for a property.

| Persian | field | type | applies to |
|---|---|---|---|
| مشتری | `customer` | FK Person | all (quick-add allowed) |
| نوع درخواست | `request_type` | choice | `rent` اجاره / `rahn` رهن / `sale` فروش |
| منطقه | `region` | FK Region (null) | all |
| وضعیت | `status` | choice `open`/`done` | all; default open |
| ملک تطبیق‌داده‌شده | `matched_property` | FK Property (null) | set when marked done |
| نوع ملک هدف | `target_property_type` | choice (null) | sale/buy: apartment/kalnagi/land |
| تعداد نفرات | `persons_count` | small int | rent/rahn |
| تعداد خواب | `beds` | small int | all |
| تعداد واحد | `units_count` | small int | sale |
| طبقه | `preferred_floor` | small int | all |
| متراژ (حداقل/حداکثر) | `min_area`/`max_area` | int | all |
| سال ساخت (حداقل/حداکثر) | `min_build_year`/`max_build_year` | small int | sale |
| پارکینگ می‌خواهد | `wants_parking` | bool | all |
| آسانسور می‌خواهد | `wants_elevator` | bool | all |
| انباری می‌خواهد | `wants_storage` | bool | all |
| حداکثر پول پیش | `max_deposit` | bigint | rent (پیش); rahn (max رهن) |
| حداکثر کرایه | `max_rent` | bigint | rent |
| بودجه | `budget` | bigint | sale (نقدینگی خریدار) |
| نیازها | `needs` | text | all |
| مهلت | `deadline` | date | all |
| یادداشت | `notes` | text | all |

**Done flow:** admin marks a request done and picks the property it was satisfied by (searchable by title/owner/region) → set `status=done` + `matched_property`.
