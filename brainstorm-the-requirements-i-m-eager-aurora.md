# Simple MRP System — Solid Wood Dining Set Manufacturer

## Context

Company makes solid wood dining sets (tables + chairs) for export, PO-driven (1 PO = 1 container). Currently no digital system to track production floor status or material readiness against ship dates — need a simple, cloud-accessible tool so PPC and Purchasing can log dates and management can see at a glance whether each order is on track to ship. Inspired by katanamrp.com's dashboard/production-board look, but scoped much smaller (no BOM costing, no inventory valuation, no multi-warehouse — just date tracking against a fixed set of production lines and material categories).

This is a greenfield build in an empty project folder.

## Requirements (confirmed via brainstorming)

**Roles (2, shared login per role, no per-user accounts):**
- **PPC** — owns PO master data, sets/revises target ship date, inputs production line target + actual completion dates (relayed from production supervisor), inputs actual ship date.
- **Purchaser** — inputs material estimate + actual receive dates. Read-only elsewhere.
- Both roles can view the dashboard.

**PO / Container**
- 1 PO = 1 container (no split/consolidation).
- Fields: PO number, customer, product qty (table/chair breakdown), target_ship_date, actual_ship_date (nullable).
- target_ship_date is revisable by PPC; **each revision is logged** (old date, new date, changed-at) so slippage history is visible.

**Production tracking** — per PO, one row per line:
- Lines: Chair parts, Table top, Table leg, Finishing (spraying), Packing.
- Each row: target_date, actual_date (PPC-entered).

**Material tracking** — per PO, one row per material category:
- Categories: Table top, Table leg, Chair parts, Chair seat, Chemical (spraying), Carton (packing).
- Each row: estimate_receive_date, actual_receive_date (Purchaser-entered).

**Dashboard**
- Summary counts: on-track vs late (pre-ship POs only), shipped this month.
- Container list, split into **Planned** (not yet shipped) and **Shipped** (history).
- Status badge, 2-level, pre-ship only:
  - Green = on track (today ≤ current target_ship_date)
  - Red = late (today > target_ship_date, not yet shipped)
  - Once shipped: badge goes **neutral/grey** regardless of whether it shipped late — no red/green judgement post-ship.
- Katana-style production board: columns per production line (+ material swimlane), cards = PO with target/actual date per line. Visual/informational only — does **not** drive the PO-level Green/Red status (that's ship-date-only, per explicit decision).

## Recommended Approach

Custom coded web app (chosen over no-code/spreadsheet options for long-term customization and to match the Katana-style dashboard feel):
- **Next.js** (React, App Router) — single deployable for frontend + backend API routes.
- **Postgres** (Neon or Supabase free tier) as the database — small scale, no need for anything heavier.
- **Prisma** as ORM.
- Auth: 2 hardcoded role accounts (PPC, Purchaser), password + session cookie — deliberately skip a full user-management system since shared logins were explicitly chosen over per-user accounts.
- Hosting: Vercel (pairs naturally with Next.js, free tier covers this scale) — satisfies the remote/cloud access requirement (phone/laptop browser from anywhere).
- Responsive layout for phone use.

### Data model sketch
- `PO`: id, po_number, customer, table_qty, chair_qty, target_ship_date, actual_ship_date?, created_at
- `ShipDateRevision`: id, po_id, old_date, new_date, changed_at
- `ProductionStatus`: id, po_id, line (enum: chair_parts, table_top, table_leg, finishing, packing), target_date, actual_date?
- `MaterialStatus`: id, po_id, material (enum: table_top, table_leg, chair_parts, chair_seat, chemical, carton), estimate_date, actual_date?

### Not building (explicitly out of scope for this version)
- BOM/costing, inventory valuation, multi-warehouse
- Per-user accounts/audit trail
- Per-line status affecting overall PO status (informational only)
- Container consolidation / PO splitting across containers

## Next Step

This plan captures the brainstormed design/requirements. Once approved, the next step is a detailed implementation plan (project scaffolding, schema, pages, API routes, deployment steps) via the writing-plans process, followed by actual build.
