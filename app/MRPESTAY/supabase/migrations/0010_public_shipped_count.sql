-- The public landing page mirrors the dashboard's stat cards, one of which is
-- "Shipped This Month". Ship dates alone are enough to count them, so this
-- view carries no PO number, customer or status.

create view public_shipped_pos as
select p.id, p.actual_ship_date
from pos p
where p.actual_ship_date is not null;

grant select on public_shipped_pos to anon, authenticated;
