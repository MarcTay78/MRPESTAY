# Production Tracking

## Purpose

Track factory floor progress per PO across 5 fixed production lines. PPC don't stand on the floor — supervisor relay progress verbally/via message, PPC types it in. This module is informational for the Katana-style board; it does **not** drive the PO's green/red ship-status badge (that's ship-date-only, an explicit decision from brainstorming — a late production line doesn't auto-flag the PO red, only a late ship date does).

## Fields / Schema

Table `production_status` — one row per PO per line (5 rows per PO):

- `id`, `po_id`
- `line` — enum: `chair_parts`, `table_top`, `table_leg`, `finishing`, `packing`
- `target_date`
- `actual_date` — nullable

Rows for all 5 lines get created (empty target/actual) when a PO is created, so the board always shows a full 5-column shape per PO.

## Rules & Permissions

- **PPC**: write `target_date` and `actual_date` for any line, any PO.
- **Purchaser**: read-only.

## UX Flow

1. PPC open a PO detail → sees 5 line rows: Chair parts, Table top, Table leg, Finishing, Packing.
2. For each line, PPC sets a target completion date (planning stage, right after PO creation).
3. As production progresses, supervisor tells PPC "chair parts done today" → PPC enters actual date for that line.
4. Dashboard's production board (see [05-dashboard.md](05-dashboard.md)) shows this PO as a card in each line's column, target/actual visible at a glance — purely visual, no status computation tied to it.
5. Purchaser can view the same board/detail to understand production context (e.g., is finishing done yet, is it worth chasing a late material) but has no inputs here.

## Open Questions / Later

- No per-line status affecting the PO badge — confirmed decision, not a gap.
- No sub-line detail (e.g., no breakdown within "Finishing" by process step) — one date pair per line is enough for this version.
