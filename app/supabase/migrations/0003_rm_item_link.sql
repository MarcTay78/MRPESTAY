-- Link table_rm/chair_rm rows to a specific po_items row so RM can be
-- tracked per model instead of once per PO. item_id stays nullable: a PO
-- with RM rows but zero items of the matching type can't be backfilled,
-- and those rows surface as "Unassigned" in the UI instead of being lost.

alter table table_rm add column item_id uuid references po_items(id) on delete cascade;
alter table chair_rm add column item_id uuid references po_items(id) on delete cascade;

-- Backfill: assign each existing row to the first item of matching type on
-- its PO (ordered by id — po_items has no created_at to order by, so this
-- is an arbitrary-but-deterministic tiebreak, not true creation order).
update table_rm t set item_id = (
  select id from po_items i where i.po_id = t.po_id and i.type = 'table' order by i.id limit 1
) where item_id is null;

update chair_rm t set item_id = (
  select id from po_items i where i.po_id = t.po_id and i.type = 'chair' order by i.id limit 1
) where item_id is null;
