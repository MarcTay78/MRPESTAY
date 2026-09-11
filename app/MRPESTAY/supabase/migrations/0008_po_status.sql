-- PO status becomes a value PPC enters, replacing the On Track / Late badge
-- that was derived from the target ship date alone. Shipped is still derived
-- (a PO with an actual ship date is shipped, whatever its status says).

create type po_status as enum ('ready', 'in_progress', 'pending_material');

alter table pos add column status po_status not null default 'in_progress';
