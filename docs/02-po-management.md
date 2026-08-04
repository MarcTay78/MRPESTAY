# PO / Container Management

## Purpose

Core entity of the system. Each PO represent one export container — no splitting a PO across containers, no consolidating multiple POs into one. PPC own this data: create the PO, set the target ship date, revise it as things slip, and log the actual ship date once it goes out. Revision history matter here — management want to see slippage pattern over time, not just current state.

## Fields / Schema

Table `pos` (see [06-data-model.md](06-data-model.md) for full SQL):

- `id`
- `po_number` — unique identifier from the customer PO
- `customer`
- `table_qty`, `chair_qty` — product breakdown
- `target_ship_date` — revisable
- `actual_ship_date` — nullable, set once shipped
- `created_at`

Table `ship_date_revisions` — append-only log:

- `id`, `po_id`, `old_date`, `new_date`, `changed_at`

Every time PPC change `target_ship_date`, a row get inserted here before the update — old value preserved. This is what let dashboard show slippage history per PO.

## Rules & Permissions

- **PPC**: create PO, edit all PO fields, revise target ship date (triggers revision log), set actual ship date.
- **Purchaser**: read-only on `pos` and `ship_date_revisions`.
- `ship_date_revisions` insert-only from app side — no updates/deletes, history stays honest.

## UX Flow

1. PPC click "New PO" → form: PO number, customer, table qty, chair qty, target ship date → save.
2. New PO appear in dashboard's **Planned** list, status badge green (today ≤ target ship date).
3. Ship date slips → PPC open PO detail → edit target ship date → system logs old→new in `ship_date_revisions` → dashboard badge recalculates (red if today now past new target, still green if not).
4. PPC can open a "Revision History" panel on PO detail → see full old-date/new-date/changed-at timeline.
5. Container actually ships → PPC enter actual ship date → PO moves from **Planned** to **Shipped** list, badge turns neutral/grey regardless of whether it shipped late.
6. Purchaser can open any PO detail to check ship-date context (e.g., is a shipment urgent) but sees no edit controls on PO fields.

## Open Questions / Later

- No PO splitting/consolidation, no partial shipments — 1 PO = 1 container = 1 actual ship date.
- No customer-facing view — internal tool only.
