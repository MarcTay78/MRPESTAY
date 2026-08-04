-- table_rm/chair_rm still carried the original unique(po_id, component)
-- constraint from the fixed-shape schema (0001_init.sql). Now that RM is
-- per-model (0003 added item_id), that constraint wrongly blocks two
-- different models on the same PO from both having e.g. "Table Top" —
-- insert silently fails (addRmRow doesn't surface the error), so the
-- second model's material never gets added.
--
-- Replace it with unique(item_id, component): still stops duplicate
-- material names on the same model, no longer scoped to the whole PO.
-- Rows with item_id null (the "Unassigned" bucket) are unaffected —
-- Postgres treats each NULL as distinct, so they never collide.

alter table table_rm drop constraint if exists table_rm_po_id_component_key;
alter table chair_rm drop constraint if exists chair_rm_po_id_component_key;

alter table table_rm add constraint table_rm_item_id_component_key unique (item_id, component);
alter table chair_rm add constraint chair_rm_item_id_component_key unique (item_id, component);
