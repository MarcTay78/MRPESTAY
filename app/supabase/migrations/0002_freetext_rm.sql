-- Table RM / Chair RM stop being a fixed 3-item enum shape and become
-- free-text rows PPC adds on the PO detail page (name + target/actual date),
-- similar to how po_items already work. Existing seeded rows keep their
-- data, just reformatted from snake_case enum values to plain text.

alter table table_rm alter column component type text using component::text;
alter table chair_rm alter column component type text using component::text;

update table_rm set component = initcap(replace(component, '_', ' '));
update chair_rm set component = initcap(replace(component, '_', ' '));

drop type if exists table_rm_component;
drop type if exists chair_rm_component;

-- Stop auto-seeding table_rm/chair_rm on PO creation — PPC adds rows as
-- needed instead. production_status and material_status keep their fixed
-- shape (unchanged, out of scope for this change).
create or replace function seed_po_children() returns trigger
language plpgsql security definer as $$
begin
  insert into production_status (po_id, line)
    select new.id, l from unnest(enum_range(null::production_line)) as l;
  insert into material_status (po_id, material)
    select new.id, m from unnest(enum_range(null::material_category)) as m;
  return new;
end;
$$;
