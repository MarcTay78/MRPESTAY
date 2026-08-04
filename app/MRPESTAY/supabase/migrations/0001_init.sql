-- MRP-Lite schema. Matches the approved "MRP Mockups.dc.html" design, which
-- supersedes the earlier docs/06-data-model.md sketch: production is tracked
-- as raw-material readiness (table_rm/chair_rm, fixed components) plus
-- per-model work-in-progress (po_items) plus three floor lines
-- (finishing/packing/qc), and materials are the 4 categories not already
-- covered by table_rm/chair_rm.

create type app_role as enum ('ppc', 'purchaser');
create type item_type as enum ('table', 'chair');
create type production_line as enum ('finishing', 'packing', 'qc');
create type material_category as enum ('chair_parts', 'chair_seat', 'chemical', 'carton');
create type table_rm_component as enum ('table_top', 'table_leg', 'table_apron');
create type chair_rm_component as enum ('chair_back_leg', 'chair_back', 'chair_front_leg');

-- role lookup, keyed to Supabase auth users
create table profiles (
  id uuid primary key references auth.users(id),
  role app_role not null
);

create table pos (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  customer text not null,
  target_ship_date date not null,
  actual_ship_date date,
  created_at timestamptz not null default now()
);

create table po_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references pos(id) on delete cascade,
  type item_type not null,
  model text not null,
  qty int not null default 0,
  parts_target date,
  parts_actual date,
  white_target date,
  white_actual date,
  seat_target date,
  seat_actual date
);

create table table_rm (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references pos(id) on delete cascade,
  component table_rm_component not null,
  target_date date,
  actual_date date,
  unique (po_id, component)
);

create table chair_rm (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references pos(id) on delete cascade,
  component chair_rm_component not null,
  target_date date,
  actual_date date,
  unique (po_id, component)
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

-- Seed the fixed-shape rows (3 line, 4 material, 3+3 RM component) whenever a
-- PO is created, so every screen can assume the full shape exists.
create function seed_po_children() returns trigger
language plpgsql security definer as $$
begin
  insert into production_status (po_id, line)
    select new.id, l from unnest(enum_range(null::production_line)) as l;
  insert into material_status (po_id, material)
    select new.id, m from unnest(enum_range(null::material_category)) as m;
  insert into table_rm (po_id, component)
    select new.id, c from unnest(enum_range(null::table_rm_component)) as c;
  insert into chair_rm (po_id, component)
    select new.id, c from unnest(enum_range(null::chair_rm_component)) as c;
  return new;
end;
$$;

create trigger trg_seed_po_children
  after insert on pos
  for each row execute function seed_po_children();

create function auth_role() returns app_role
language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

alter table profiles enable row level security;
alter table pos enable row level security;
alter table po_items enable row level security;
alter table table_rm enable row level security;
alter table chair_rm enable row level security;
alter table ship_date_revisions enable row level security;
alter table production_status enable row level security;
alter table material_status enable row level security;

-- everyone authenticated can read everything
create policy "read own profile" on profiles for select using (auth.uid() = id);
create policy "read all - pos" on pos for select using (auth.role() = 'authenticated');
create policy "read all - items" on po_items for select using (auth.role() = 'authenticated');
create policy "read all - table_rm" on table_rm for select using (auth.role() = 'authenticated');
create policy "read all - chair_rm" on chair_rm for select using (auth.role() = 'authenticated');
create policy "read all - revisions" on ship_date_revisions for select using (auth.role() = 'authenticated');
create policy "read all - production" on production_status for select using (auth.role() = 'authenticated');
create policy "read all - material" on material_status for select using (auth.role() = 'authenticated');

-- PPC write access: PO master data + all production-side tracking
create policy "ppc write pos" on pos for all using (auth_role() = 'ppc') with check (auth_role() = 'ppc');
create policy "ppc write items" on po_items for all using (auth_role() = 'ppc') with check (auth_role() = 'ppc');
create policy "ppc write table_rm" on table_rm for all using (auth_role() = 'ppc') with check (auth_role() = 'ppc');
create policy "ppc write chair_rm" on chair_rm for all using (auth_role() = 'ppc') with check (auth_role() = 'ppc');
create policy "ppc write revisions" on ship_date_revisions for insert with check (auth_role() = 'ppc');
create policy "ppc write production" on production_status for all using (auth_role() = 'ppc') with check (auth_role() = 'ppc');

-- Purchaser write access: materials only
create policy "purchaser write material" on material_status for all using (auth_role() = 'purchaser') with check (auth_role() = 'purchaser');

-- ship_date_revisions has no update/delete policy: insert-only, append-only history by design.
