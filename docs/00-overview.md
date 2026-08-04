# Overview — MRP-Lite for Solid Wood Dining Set Export

## Purpose

Company export solid wood dining sets (tables + chairs), one PO = one container. No digital tracking today — PPC and Purchasing log dates on paper/spreadsheet, management got no at-a-glance view of ship-date risk. This system fix that: simple date tracker against fixed production lines and material categories, dashboard show green/red/grey at a glance. Inspired by katanamrp.com look, scoped way smaller — no BOM costing, no inventory valuation, no multi-warehouse.

## Roles

Two roles, shared login per role (no per-user accounts):

- **PPC** — own PO master data, set/revise target ship date, input production line dates, input actual ship date.
- **Purchaser** — input material estimate/actual receive dates. Read-only elsewhere.

Both roles view dashboard.

## Tech stack

- **Next.js** (App Router) — single deploy, frontend + API routes.
- **Supabase** — Postgres database + Auth (both, per requirement). Auth replace old plan of hardcoded-cookie session: real Supabase users, role enforced via Row Level Security. See [01-authentication.md](01-authentication.md).
- **Supabase JS client** (`@supabase/supabase-js` + `@supabase/ssr` for Next.js) — talk to DB, RLS do permission enforcement instead of app-layer checks.
- **Vercel** — hosting, free tier fine at this scale, satisfy "access from anywhere" requirement.
- Responsive layout, phone-usable.

## Modules

| Module | File | What it tracks |
|---|---|---|
| Authentication | [01-authentication.md](01-authentication.md) | Login, role assignment, RLS |
| PO / Container | [02-po-management.md](02-po-management.md) | PO master data, ship dates, revision history |
| Production Tracking | [03-production-tracking.md](03-production-tracking.md) | 5 production line dates per PO |
| Material Tracking | [04-material-tracking.md](04-material-tracking.md) | 6 material category dates per PO |
| Dashboard | [05-dashboard.md](05-dashboard.md) | Summary counts, status badges, production board |
| Data Model | [06-data-model.md](06-data-model.md) | Supabase schema, RLS policies |

## Glossary

- **PO** = **Container** — 1:1, no split/consolidation across containers.
- **Target date** — planned/estimated date, revisable.
- **Actual date** — real date something happened, entered once it happens.

## Explicitly out of scope

- BOM/costing, inventory valuation, multi-warehouse
- Per-user accounts / per-user audit trail (role-level only)
- Per-line or per-material status affecting overall PO status badge (informational only — badge driven by ship date alone)
- Container consolidation / PO splitting across containers
