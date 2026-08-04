-- Plan Date: the date set when a PO is created, separate from the working
-- ship date (target_ship_date, revised as production progresses) and the
-- actual ship date (entered once it truly ships). Existing rows backfill
-- from target_ship_date — the closest thing to an original plan we have.

alter table pos add column plan_date date;
update pos set plan_date = target_ship_date where plan_date is null;
alter table pos alter column plan_date set not null;
