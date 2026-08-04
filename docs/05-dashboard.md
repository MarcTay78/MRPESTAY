# Dashboard

## Purpose

Single-glance view for management (and both roles) of whether each container is on track to ship. Two views layered here: a summary/list view (ship-date risk) and a Katana-style production board (floor + material visibility). They answer different questions — don't conflate them: the list view's badge is ship-date-driven only, the board is pure visualization of line/material progress.

## Layout

### Summary counts

- On-track count vs late count — **pre-ship POs only** (shipped POs excluded from this count).
- Shipped-this-month count.

### Container lists

- **Planned** — POs not yet shipped (`actual_ship_date IS NULL`), each showing status badge.
- **Shipped** — history, `actual_ship_date IS NOT NULL`, badge always neutral/grey here.

### Status badge (2-level, pre-ship only)

- **Green** — on track: `today <= target_ship_date`.
- **Red** — late: `today > target_ship_date` and not yet shipped.
- **Grey** — once shipped, regardless of on-time or late — no retroactive judgement.

Computed client-side or via a view (`current_date <= target_ship_date`) — no stored status column, always derived so it's never stale.

### Production board (Katana-style)

- Columns: Chair parts, Table top, Table leg, Finishing, Packing + a Material swimlane (or 6 sub-columns, one per material category).
- Cards: one per PO, positioned/labelled per line showing target/actual date.
- Purely informational — clicking a card goes to PO detail; the board itself computes nothing that feeds the ship-status badge.

## Rules & Permissions

- Both PPC and Purchaser see the full dashboard (read access to everything, per [06-data-model.md](06-data-model.md) RLS policies).
- No write actions happen on the dashboard itself — it's a jumping-off point to PO detail pages ([02](02-po-management.md), [03](03-production-tracking.md), [04](04-material-tracking.md)) where role-gated edits happen.

## UX Flow

1. Either role logs in → lands on `/dashboard`.
2. Sees summary counts at top (on-track / late / shipped-this-month).
3. Scrolls Planned list, scanning badges — red ones are the ones needing attention today.
4. Clicks a PO card → goes to PO detail page showing ship date, revision history, production lines, material rows — edit controls shown/hidden per role.
5. Switches to production board view (tab or toggle) → sees all in-flight POs across the 5 line columns + material swimlane, spots which containers are stuck at which stage.
6. Toggles to Shipped list → history view, all badges grey, useful for looking back at what happened without judgement framing.

## Open Questions / Later

- No filtering/sorting spec beyond Planned/Shipped split — add search/filter later if PO volume grows.
- No export (CSV/PDF) of dashboard data — out of scope for this version.
