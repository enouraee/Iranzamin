# DealEstate — Design System

Design system for **DealEstate** (`املاک ایران زمین` / Iran Zamin Real Estate), a Persian, **RTL**, **mobile-first** property-management web app used by non-technical real-estate office staff.

> **Brand personality:** professional, trustworthy, calm. Not flashy. A tool that office staff trust with high-value transactions — clarity and legibility over decoration.

This system was created **from a written brief** (no existing codebase or Figma was supplied). All foundations, components, and the UI kit are original to this brief. Re-attach a codebase or Figma file if you want the system reconciled against real product source.

---

## Sources

| Source | Provided? | Notes |
|---|---|---|
| Codebase | ✗ | None attached — built from the written brief. |
| Figma | ✗ | None attached. |
| Brand brief | ✓ | Pasted requirements: RTL Persian, deep-blue primary, خالی/پر status colors, Vazirmatn type, gentle radius. |

---

## Content fundamentals

Copy is **Persian (Farsi), RTL**, written for busy office staff who need to scan, not read.

- **Tone:** plain, professional, reassuring. No marketing fluff, no slang, no exclamation marks. Think "an experienced colleague stating facts."
- **Address:** the app speaks *neutrally / impersonally* — it labels things (`املاک`, `ثبت ملک`, `وضعیت`) rather than addressing "you". Greetings are the one exception (`خوش آمدید`).
- **Casing:** Persian has no case. Latin words (the "DealEstate" wordmark, format names like JPG) use their natural casing.
- **Numerals:** **always Persian digits** — ۰۱۲۳۴۵۶۷۸۹ — for prices, areas, counts, dates, phone numbers. Thousands separator is `٬` (e.g. `۱٬۲۴۸`), decimal is `٫` (e.g. `۸٫۵ میلیارد`).
- **Money:** prices read naturally — `۸٫۵ میلیارد` (tomans implied) or `۴۵ میلیون / ماه` for rent. Avoid raw long numbers where a scale word reads cleaner.
- **Status vocabulary (canonical):** `خالی` = available (green/success), `پر` = occupied (red/danger). Deal types: `فروش` (sale), `اجاره` (rent). Property types: `آپارتمان`, `ویلا`, `تجاری`, `اداری`.
- **Labels are nouns, actions are verbs:** fields/sections are nouns (`عنوان ملک`, `قیمت`, `محله`); buttons are verbs/imperatives (`ثبت ملک`, `ورود`, `بازدید`, `تماس با مشاور`).
- **No emoji.** Status and meaning are carried by color, the badge dot, and Lucide icons — never emoji.
- **Brevity:** card titles one line (truncate with ellipsis), helper text one short sentence, empty states one calm sentence (`ملکی با این مشخصات یافت نشد.`).

---

## Visual foundations

**Color.** A single deep, trustworthy blue carries the brand (`--color-primary` `#1F4A6B`). A warm **ochre** accent (`--color-accent` `#A87F35`, evoking a title-deed/key) is used *sparingly* — for "featured" and premium touches, never as a second UI color. Status is unambiguous: **green** `#1F8A54` for خالی, **red** `#BE3A2D` for پر. Neutrals are a cool gray ramp; the app background is a soft `#F5F7FA`, surfaces are white. Soft tints (`*-soft` tokens) back the pills.

**Type.** One family — **Vazirmatn** — for the entire UI (headings, body, numerals). Persian needs breathing room, so body line-height is generous (1.65). Weights: 400 body, 500 labels, 600 emphasis/tabs, 700 headings & prices. No letter-tracking on Persian. See `tokens/typography.css`.

**Spacing & layout.** 4px base scale. Mobile-first single column capped at ~480px. Screen gutter 16px. Fixed chrome: 28px status bar, 56px top app bar, 64px bottom nav. Content scrolls between fixed top and bottom bars.

**Shape.** Gently rounded, never sharp, never fully-pill except avatars/switches/status pills. Inputs & buttons `10px`, cards `14px`, sheets `20px`. See `tokens/radius.css`.

**Elevation.** Soft, low-spread, cool-tinted shadows (`rgba(16,30,54,…)`). Cards rest on `--shadow-sm`; hover lifts to `--shadow-md` with a 2px `translateY(-2px)`. Modals/sheets use `--shadow-lg`/`xl`. No hard or colored drop-shadows.

**Cards.** White surface, `1px` `--border-default` border, `14px` radius, `--shadow-sm`. This border+shadow combo is the signature container; interactive cards add the hover lift.

**Backgrounds.** Flat color only — no photographic hero washes, no busy textures. The **one** sanctioned gradient is the property-detail gallery placeholder (`blue-500 → blue-700`) standing in for a real photo, and the login header block. No decorative gradients in chrome.

**Motion.** Restrained and quick. Transitions 120–160ms ease on background, box-shadow, and small transforms. Hover = subtle lift + shadow; press relies on the browser default. No bounces, no infinite/looping animation, no parallax. Respect `prefers-reduced-motion`.

**States.**
- *Hover* (pointer): primary button darkens (`--color-primary-hover`) + 1px lift; ghost/secondary fill with a soft tint; cards lift.
- *Focus:* 3px focus ring `--ring-focus` (danger fields use `--ring-danger`), plus border color shifts to primary.
- *Disabled:* `opacity: 0.5`, `not-allowed` cursor, no hover.

**Transparency / blur.** Used minimally — only the translucent white icon buttons and the photo-count chip over the detail gallery. No frosted-glass chrome.

---

## Iconography

The system uses **[Lucide](https://lucide.dev)** (ISC license) — clean, consistent 24×24 outline icons at `stroke-width: 2`, round caps/joins. This stroke style matches the calm, professional tone (no filled or duotone icons).

- The real Lucide path data is **inlined** in `ui_kits/app/icons.jsx` as `window.DZIcon` (a `<DZIcon name="building-2" size={20} />` component) so the kit works fully offline. Active bottom-nav items bump stroke-width to ~2.4 instead of switching to a filled variant.
- For new work you may instead pull Lucide from CDN (`https://unpkg.com/lucide@latest`) — keep `stroke-width: 2`, `currentColor`, and the outline style.
- Icons inherit `currentColor` and are sized in px; tint with the color tokens (e.g. primary icon chips use `--color-primary` on `--color-primary-soft`).
- **No emoji, no unicode-glyph icons, no filled icon sets.** If an icon is missing from the inlined set, copy its path from lucide.dev rather than drawing a new one.

Key icons in use: `home, building-2, plus-circle, user, search, sliders, map-pin, bed, bath, ruler, banknote, phone, message-circle, bell, heart, share-2, camera, calendar, key, trending-up, car, sun, check, check-circle, log-in`.

---

## Assets

- `assets/logo-mark.svg` — the logomark: a stylized building/title-deed roof, primary blue with an ochre roof plane. Pairs with the "DealEstate" + `املاک ایران زمین` wordmark (see `guidelines/logo.card.html`). Clear-space ≥ the mark's height. Works on light and on `--blue-800` dark.

---

## Index / manifest

**Root**
- `styles.css` — global entry point (consumers link this). `@import`s only.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill wrapper for use in Claude Code.

**`tokens/`** — `fonts.css` (Vazirmatn @font-face), `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `shadows.css`, `base.css` (RTL reset).

**`components/`** — reusable React primitives. Namespace: `window.DealEstateDesignSystem_89799d`.
- `forms/` — `Button`, `IconButton`, `Input`, `Select`, `Switch`
- `data/` — `Badge`, `Card`, `Avatar`, `StatCard`, `PropertyCard`
- `navigation/` — `Tabs`, `BottomNav`

**`ui_kits/app/`** — interactive mobile app recreation (`index.html`): Login → Dashboard → Properties list → Property detail → Add property → Profile. Composes the primitives; screens in `*.jsx`, icons in `icons.jsx`, mock data in `data.jsx`.

**`guidelines/`** — foundation specimen cards (colors, type, spacing, radius, elevation, logo) shown in the Design System tab.

---

## Caveats / substitutions

- **Fonts:** Vazirmatn is loaded from the **jsDelivr CDN** (variable woff2), not self-hosted. For offline/production, download from the [Vazirmatn repo](https://github.com/rastikerdar/vazirmatn) and re-point `tokens/fonts.css`.
- **Icons:** Lucide outline set, inlined. Substitution of the real product's icon set (if any) is pending source.
- **Brand mark** is an original placeholder created for this brief — replace with the agency's official logo when available.
