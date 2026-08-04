-- Ship Date (target_ship_date) becomes clearable from the PO detail page —
-- PPC can reset it to empty rather than being forced to always carry a date.
alter table pos alter column target_ship_date drop not null;
