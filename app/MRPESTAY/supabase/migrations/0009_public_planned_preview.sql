-- Public preview for the login page: anyone who opens the app, signed in or
-- not, sees the Planned list. Exposure is deliberately narrowed to two views
-- rather than opening the base tables to the anon role:
--   * no customer names, no quantities, no ship-date revision history
--   * shipped POs are excluded entirely
-- Views are security definer by default (security_invoker is off), so they
-- read past the base tables' RLS; the grants below are the whole access story.

create view public_planned_pos as
select
  p.id,
  p.po_number,
  p.status,
  p.plan_date,
  p.target_ship_date,
  (select ps.target_date from production_status ps where ps.po_id = p.id and ps.line = 'qc') as qc_target_date,
  (select ps.actual_date from production_status ps where ps.po_id = p.id and ps.line = 'qc') as qc_actual_date
from pos p
where p.actual_ship_date is null;

-- Table RM and Chair RM rows PPC entered that have no actual date yet.
create view public_planned_rm as
select r.po_id, r.component, r.target_date
from (
  select po_id, component, target_date, actual_date from table_rm
  union all
  select po_id, component, target_date, actual_date from chair_rm
) r
join pos p on p.id = r.po_id and p.actual_ship_date is null
where r.actual_date is null;

grant select on public_planned_pos to anon, authenticated;
grant select on public_planned_rm to anon, authenticated;
