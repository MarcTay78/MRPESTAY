# Data Model — Supabase Schema

Supersedes the original brainstorm doc's Prisma sketch — this is Supabase-native (plain SQL + RLS), since Supabase now handle both Auth and DB.

## Enums

```sql
create type app_role as enum ('ppc', 'purchaser');
create type production_line as enum ('chair_parts', 'table_top', 'table_leg', 'finishing', 'packing');
create type material_category as enum ('table_top', 'table_leg', 'chair_parts', 'chair_seat', 'chemical', 'carton');
```

## Tables

```sql
-- role lookup, keyed to Supabase auth users
create table profiles (
  id uuid primary key references auth.users(id),
  role app_role not null
);

create table pos (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  customer text not null,
  table_qty int not null default 0,
  chair_qty int not null default 0,
  target_ship_date date not null,
  actual_ship_date date,
  created_at timestamptz not null default now()
);

create table ship_date_revisions (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references pos(id) on delete cascade,
  old_date date not null,
  new_date date not null,
  changed_at timestamptz not null default now()
);

create table production_status (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references pos(id) on delete cascade,
  line production_line not null,
  target_date date,
  actual_date date,
  unique (po_id, line)
);

create table material_status (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references pos(id) on delete cascade,
  material material_category not null,
  estimate_receive_date date,
  actual_receive_date date,
  unique (po_id, material)
);
```

## Role helper

```sql
create function auth_role() returns app_role
language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;
```

## RLS policies

```sql
alter table pos enable row level security;
alter table ship_date_revisions enable row level security;
alter table production_status enable row level security;
alter table material_status enable row level security;
alter table profiles enable row level security;

-- everyone authenticated can read everything
create policy "read all - pos" on pos for select using (auth.role() = 'authenticated');
create policy "read all - revisions" on ship_date_revisions for select using (auth.role() = 'authenticated');
create policy "read all - production" on production_status for select using (auth.role() = 'authenticated');
create policy "read all - material" on material_status for select using (auth.role() = 'authenticated');
create policy "read own profile" on profiles for select using (auth.uid() = id);

-- PPC write access
create policy "ppc write pos" on pos for all using (auth_role() = 'ppc') with check (auth_role() = 'ppc');
create policy "ppc write revisions" on ship_date_revisions for insert with check (auth_role() = 'ppc');
create policy "ppc write production" on production_status for all using (auth_role() = 'ppc') with check (auth_role() = 'ppc');

-- Purchaser write access
create policy "purchaser write material" on material_status for all using (auth_role() = 'purchaser') with check (auth_role() = 'purchaser');
```

Note: `ship_date_revisions` has no update/delete policy — insert-only, append-only history by design (see [02-po-management.md](02-po-management.md)).

## Relationships

- `pos` 1—5 `production_status` (one row per line, seeded on PO creation)
- `pos` 1—6 `material_status` (one row per category, seeded on PO creation)
- `pos` 1—N `ship_date_revisions` (one row per revision)
- `profiles.id` 1—1 `auth.users.id` (Supabase Auth)

## Open Questions / Later

- Seeding the 5+6 rows per new PO: either a Postgres trigger on `pos` insert, or app-side insert right after PO create. Trigger keeps it consistent regardless of entry point — recommended once build starts.
- No soft-delete/archival strategy defined yet — not needed until data volume becomes a concern.
