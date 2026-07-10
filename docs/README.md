# docs/ — DealEstate flow specs

Canonical, field-level specs for every flow, written **for coding agents**. When you implement or change a flow, read its doc here first, then [AGENTS.md](../AGENTS.md) for the golden rules, then [TASKS.md](../TASKS.md) for the numbered work item.

**Precedence when sources disagree:** these docs → `AGENTS.md` → the `Design/` HTML. The design is intentionally incomplete in places; where a field or rule here is missing from the design, this doc wins and you should build it to match the doc.

## Index

| Doc | Covers |
|---|---|
| [domain-model.md](domain-model.md) | Every entity + every field, with the exact backend field name, type, required/optional, and Persian UI label. **Single source of truth for data.** |
| [decisions.md](decisions.md) | Locked architecture decisions (ADR) + open questions. Read before changing a model. |
| [flows/add-property.md](flows/add-property.md) | Add-property wizard (apartment / kalnagi / land branches, deal types, occupancy, owner, media). |
| [flows/contract.md](flows/contract.md) | Contract registration + how it flips property owner/tenant/status and writes history. |
| [flows/request.md](flows/request.md) | Customer requests (rent / rahn / sale), constraints, matching, marking done. |
| [flows/persons.md](flows/persons.md) | People (owners/customers): quick-add, uniqueness, linked objects. |
| [flows/dashboard-notifications.md](flows/dashboard-notifications.md) | Dashboard stats + follow-up / contract-ending notifications (partly future). |

## How each flow doc is structured

1. **Purpose** — one line.
2. **Screens / steps** — the UI path, mapped to the design section.
3. **Fields** — table: Persian label · backend field · type · required · rules.
4. **Backend contract** — endpoints, services, selectors involved.
5. **Acceptance criteria** — a checklist an agent must satisfy for the task to be "done". Tests must cover every ⚠️ line.
6. **Edge cases** — the sad paths to test.

Never mark a task done with an unmet acceptance line or a skipped test.
