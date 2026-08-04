# Authentication

## Purpose

Two shared-login roles (PPC, Purchaser), no per-user accounts. Requirement explicitly say Supabase handle Auth — so instead of hardcoded cookie session (original brainstorm idea), use real **Supabase Auth** users, one per role, with role stored server-side and enforced through Row Level Security. Keep it simple: 2 accounts total, not a user-management system.

## Setup

- Create 2 users in Supabase Auth (dashboard or `supabase.auth.admin.createUser`):
  - `ppc@<company>.com`
  - `purchaser@<company>.com`
- Both use Supabase's built-in email+password auth (`signInWithPassword`) — no OAuth needed, no self-signup flow (signups disabled in Supabase Auth settings so nobody else registers).
- A `profiles` table (see [06-data-model.md](06-data-model.md)) maps `auth.users.id` → `role` (`'ppc'` | `'purchaser'`), row inserted manually for these 2 users at setup time.
- Password shared within each team the way the requirement intends (shared login per role) — rotate by resetting the Supabase Auth password, not by adding new users.

## Rules & Permissions

- Every table's RLS policy check the caller's role via a lookup against `profiles` (or a Postgres function `auth_role()` wrapping that lookup).
- **PPC**: read all tables, write `pos`, `ship_date_revisions`, `production_status`.
- **Purchaser**: read all tables, write `material_status` only.
- No anonymous access — all tables require an authenticated session.
- Session handled by `@supabase/ssr` cookies in Next.js middleware; unauthenticated requests redirect to login.

## UX Flow

1. User opens app URL → not logged in → redirected to `/login`.
2. Enters email + password for their role's shared account → `supabase.auth.signInWithPassword`.
3. On success, session cookie set, redirect to `/dashboard`.
4. App reads role from `profiles` (via session) once, used client-side to show/hide edit controls (e.g., Purchaser sees material date inputs as editable, everything else read-only) — this is UX convenience only, actual enforcement is RLS at the DB layer.
5. Logout button clears session, back to `/login`.
6. Wrong password → Supabase returns error → shown inline, no lockout logic needed at this scale.

## Open Questions / Later

- No per-user audit trail — action logs (if ever added) would attribute to role, not individual, unless per-user accounts get introduced later.
- No password-reset self-service UI planned — reset via Supabase dashboard when needed.
