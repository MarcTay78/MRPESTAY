# Material Tracking

## Purpose

Track raw material readiness per PO across 6 fixed categories. Purchaser own this — it's their only write surface in the whole system. Same as production tracking, this feeds the visual board but doesn't drive the PO's ship-status badge.

## Fields / Schema

Table `material_status` — one row per PO per category (6 rows per PO):

- `id`, `po_id`
- `material` — enum: `table_top`, `table_leg`, `chair_parts`, `chair_seat`, `chemical`, `carton`
- `estimate_receive_date`
- `actual_receive_date` — nullable

Rows for all 6 categories get created when a PO is created, same reasoning as production lines — board always shows full shape.

## Rules & Permissions

- **Purchaser**: write `estimate_receive_date` and `actual_receive_date` for any category, any PO. This is the only table Purchaser can write.
- **PPC**: read-only.

## UX Flow

1. Purchaser open a PO detail → sees 6 material rows: Table top, Table leg, Chair parts, Chair seat, Chemical (spraying), Carton (packing).
2. For each category, Purchaser enters an estimated receive date as soon as a PO comes in (planning what to order/when).
3. As materials arrive, Purchaser enters actual receive date per category.
4. Dashboard's material swimlane (see [05-dashboard.md](05-dashboard.md)) shows this alongside production lines — visual only.
5. PPC can view material status on PO detail (e.g., to gauge if a material delay explains a production slip) but has no edit controls here.

## Open Questions / Later

- No supplier tracking, no PO-to-supplier linkage, no quantity/valuation — dates only, matching the no-costing/no-inventory-valuation scope decision.
