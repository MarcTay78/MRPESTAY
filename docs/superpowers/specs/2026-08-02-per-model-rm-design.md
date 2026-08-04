# Per-Model Raw Material Tracking — Design

## Purpose

Today `table_rm` / `chair_rm` are free-text rows PPC adds at the PO level — not tied to any specific table/chair model. On a PO with multiple models this makes it impossible to tell which raw material belongs to which model. This change links each RM row to a specific `po_items` row, and merges the display so the board shows each model followed by its RM instead of RM as a separate column.

## Scope

- Both table and chair sides get the same treatment: `table_rm` → `po_items` (type=table), `chair_rm` → `po_items` (type=chair).
- Materials tracking (`material_status`, purchaser-owned, fixed 6 categories) is untouched — unrelated table.

## Data Model

```sql
alter table table_rm add column item_id uuid references po_items(id) on delete cascade;
alter table chair_rm add column item_id uuid references po_items(id) on delete cascade;

update table_rm t set item_id = (
  select id from po_items i where i.po_id = t.po_id and i.type = 'table' order by i.id limit 1
) where item_id is null;

update chair_rm t set item_id = (
  select id from po_items i where i.po_id = t.po_id and i.type = 'chair' order by i.id limit 1
) where item_id is null;
```

`item_id` stays **nullable**. Migration assigns existing rows to the first item of matching type on their PO, ordered by `id` (no `created_at` column confirmed on `po_items`, so this is an arbitrary-but-deterministic tiebreak, not a true creation-order pick) — correct for the common single-model-per-PO case; multi-model POs may need a manual fix-up after. If a PO has RM rows but zero items of the matching type, the row can't be backfilled — it stays with `item_id = null` and surfaces as "Unassigned" in the UI rather than being dropped, per requirement to preserve existing data.

New RM rows going forward always require an `item_id` at insert time (enforced in the `addRmRow` action, not a DB constraint, since legacy null rows must remain valid).

## Types (`lib/mrp.ts`)

- `RawComponent` gains `item_id: string | null`.
- `withParts(i: RawItem)` (or a new step in `buildPo`) attaches each item's own RM rows: group `table_rm`/`chair_rm` by `item_id`, keyed to the matching `tableItems`/`chairItems` entry. Each RM entry gets a single display value: `displayDate = hasActual ? actual : target` (actual wins, matching the board rule), keeping `hasActual`/`hasTarget` for color coding.
- Rows with `item_id === null` are collected separately as `unassignedTableRM` / `unassignedChairRM` for the detail-page fallback block.

## Actions (`po/actions.ts`)

- `addRmRow`: now reads `itemId` from `formData`, inserts `{ po_id, item_id: itemId, component }`. Rejects if `itemId` missing.
- `updateComponentDate`, `deleteRmRow`: unchanged (keyed by row `id`).
- New `assignRmItem(formData)`: PPC-only, sets `item_id` on an existing row (`poId`, `table`, `id`, `itemId` in formData). Used only for the legacy "Unassigned" fallback.

## PO Detail Page (`po/[id]/page.tsx`)

- `RmSection` restructures: instead of one flat table, rows group under their model. Each model gets its own mini table (Name / Target / Actual / delete) plus its own "+ Add" form with a hidden `itemId`.
- If `unassignedTableRM`/`unassignedChairRM` is non-empty, a small "Unassigned" block renders below with a `<select>` of that PO's items + a save button wired to `assignRmItem`. Hidden when empty — this is a rare-data-anomaly fallback, not a primary flow.

## Board Page (`board/page.tsx`)

- `COLUMN_HEADERS` drops "Table RM" and "Chair RM" (9 → 7 columns... already 7 after the earlier QC/Ship merge, so this drops it further).
- Table WP / Chair WP cells (currently `ListCell` over `tableItems`/`chairItems`) extend: under each model's name + WP status line, list its RM component names, each showing one date (actual if present else target) with the same green/yellow/red `StatusDot` coding used elsewhere.
- Grid `gridTemplateColumns` loses 2 columns' worth of width; WP columns widen slightly (e.g. 160px → 190px) to fit the nested RM lines.

## Edge Cases

- PO with a table model but no RM added yet: model row shows with no RM sub-lines (same as "None yet" today, just inline instead of a separate empty section).
- Orphaned RM row (migration couldn't assign it): shown in board? No — board only renders RM nested under a real item, so orphans are invisible on the board until reassigned via the detail-page "Unassigned" block. This is acceptable since it's a rare migration artifact, not a normal state.
- Deleting an item (no UI for this today) would cascade-delete its RM rows — matches existing `on delete cascade` pattern used elsewhere in the schema.

## Out of Scope

- No UI to delete/merge duplicate RM rows beyond existing per-row delete.
- No bulk-reassign for unassigned rows — one at a time via the dropdown, acceptable given expected rarity.
