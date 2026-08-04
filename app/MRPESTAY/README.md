# ESTAY MRP

MRP-lite tracker for a solid wood dining set export business — one PO = one
container, tracked against fixed production lines and material categories.
Implements the approved `MRP Mockups.dc.html` design (see `../docs/` for the
full product spec).

Two shared-login roles, no per-user accounts:
- **PPC** — owns PO master data, ship dates (+ revision log), production
  lines, raw-material readiness (table/chair RM), and per-model
  work-in-progress dates.
- **Purchaser** — owns the 4 material-receive categories. Read-only
  elsewhere.

## Stack

Next.js 16 (App Router) + Supabase (Postgres + Auth, RLS-enforced
permissions). No separate backend.

## Setup

1. Create a Supabase project.
2. Run the migrations, in order: `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_freetext_rm.sql` — paste each into the Supabase
   SQL editor (or `supabase db push` if you use the CLI).
3. Optionally load sample data: run `supabase/seed.sql` after the migrations.
4. Create the two shared-login accounts in Supabase Auth (dashboard →
   Authentication → Users → Add user, or `supabase.auth.admin.createUser`):
   - `ppc@yourcompany.com`
   - `purchaser@yourcompany.com`
5. For each user, insert their role into `profiles` (SQL editor):
   ```sql
   insert into profiles (id, role) values ('<ppc-user-uuid>', 'ppc');
   insert into profiles (id, role) values ('<purchaser-user-uuid>', 'purchaser');
   ```
6. In Supabase Auth settings, disable signups so nobody else can register.
7. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon key (Project Settings → API).
8. `npm install && npm run dev`

## Notes

- Permissions are enforced by Postgres RLS (see the migration's policy
  section) — the UI hiding/disabling edit controls per role is convenience
  only, not the security boundary.
- `ship_date_revisions` is insert-only by policy; there's no edit/delete
  path, by design, so slippage history stays honest.
- The production-lines table on a PO's detail page is a combined list of
  per-model work-in-progress dates, the three floor lines, and ship date —
  matches the approved mockup rather than the earlier, simpler sketch in
  `docs/06-data-model.md`.
- Table RM / Chair RM are their own section on the detail page, not fixed
  categories — PPC types a name and adds a row, with target/actual dates
  entered the same way as everywhere else. `0002_freetext_rm.sql` converts
  these from a 3-item enum to free text; existing rows get reformatted
  (`table_top` → `Table Top`), not dropped.
