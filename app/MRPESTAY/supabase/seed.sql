-- Sample data matching the approved "MRP Mockups.dc.html" click-through.
-- Run after 0001_init.sql. Safe to re-run against an empty `pos` table only
-- (po_number is unique, so a second run will fail on the insert — truncate
-- the tables first if you want to reseed).

insert into pos (po_number, customer, target_ship_date, actual_ship_date) values
  ('PO-2201', 'Solstice Home',        '2026-08-10', null),
  ('PO-2198', 'Nordfjord Living',     '2026-07-28', null),
  ('PO-2205', 'Alden & Rowe',         '2026-08-05', null),
  ('PO-2190', 'Meridian Trading Co.', '2026-07-15', '2026-08-01'),
  ('PO-2185', 'Casa Verde Imports',   '2026-07-01', '2026-06-28'),
  ('PO-2210', 'Solstice Home',        '2026-08-20', null);

insert into po_items (po_id, type, model, qty, white_target, white_actual, seat_target, seat_actual)
select p.id, v.type::item_type, v.model, v.qty, v.wt::date, v.wa::date, v.st::date, v.sa::date
from (values
  ('PO-2201','table','Oak Round 6-Seat',25,'2026-07-05','2026-07-04',null,null),
  ('PO-2201','table','Walnut Extension',15,'2026-07-08','2026-07-09',null,null),
  ('PO-2201','chair','Windsor Side Chair',100,'2026-07-02','2026-07-01','2026-07-01','2026-06-30'),
  ('PO-2201','chair','Ladderback Chair',60,'2026-07-06','2026-07-05','2026-07-05','2026-07-04'),

  ('PO-2198','table','Oak Round 6-Seat',40,'2026-06-28','2026-07-05',null,null),
  ('PO-2198','table','Farmhouse Rectangular',20,'2026-07-02','2026-07-10',null,null),
  ('PO-2198','chair','Windsor Side Chair',160,'2026-06-20','2026-06-25','2026-06-22','2026-06-28'),
  ('PO-2198','chair','Bench Seat',80,'2026-06-28','2026-07-02','2026-06-30','2026-07-05'),

  ('PO-2205','table','Walnut Extension',30,'2026-07-10','2026-07-10',null,null),
  ('PO-2205','chair','Ladderback Chair',120,'2026-07-10','2026-07-11','2026-07-12','2026-07-12'),

  ('PO-2190','table','Oak Round 6-Seat',35,'2026-06-05','2026-06-06',null,null),
  ('PO-2190','table','Farmhouse Rectangular',15,'2026-06-10','2026-06-12',null,null),
  ('PO-2190','chair','Windsor Side Chair',140,'2026-06-05','2026-06-07','2026-06-08','2026-06-10'),
  ('PO-2190','chair','Bench Seat',60,'2026-06-10','2026-06-11','2026-06-12','2026-06-14'),

  ('PO-2185','table','Walnut Extension',25,'2026-05-20','2026-05-19',null,null),
  ('PO-2185','chair','Ladderback Chair',100,'2026-05-20','2026-05-19','2026-05-22','2026-05-21'),

  ('PO-2210','table','Oak Round 6-Seat',20,'2026-08-01','2026-07-31',null,null),
  ('PO-2210','table','Farmhouse Rectangular',15,'2026-08-04',null,null,null),
  ('PO-2210','chair','Windsor Side Chair',90,'2026-08-01','2026-07-30','2026-08-03','2026-08-02'),
  ('PO-2210','chair','Bench Seat',50,'2026-08-04',null,'2026-08-06',null)
) as v(po_number, type, model, qty, wt, wa, st, sa)
join pos p on p.po_number = v.po_number;

update table_rm t set target_date = v.target::date, actual_date = v.actual::date
from (values
  ('PO-2201','table_top','2026-06-25','2026-06-24'),('PO-2201','table_leg','2026-06-26','2026-06-27'),('PO-2201','table_apron','2026-06-27','2026-06-26'),
  ('PO-2198','table_top','2026-06-15','2026-06-20'),('PO-2198','table_leg','2026-06-17','2026-06-24'),('PO-2198','table_apron','2026-06-18','2026-06-26'),
  ('PO-2205','table_top','2026-07-01','2026-07-01'),('PO-2205','table_leg','2026-07-02','2026-07-02'),('PO-2205','table_apron','2026-07-03','2026-07-03'),
  ('PO-2190','table_top','2026-05-20','2026-05-22'),('PO-2190','table_leg','2026-05-21','2026-05-23'),('PO-2190','table_apron','2026-05-22','2026-05-24'),
  ('PO-2185','table_top','2026-05-10','2026-05-09'),('PO-2185','table_leg','2026-05-11','2026-05-10'),('PO-2185','table_apron','2026-05-12','2026-05-11'),
  ('PO-2210','table_top','2026-07-25','2026-07-24'),('PO-2210','table_leg','2026-07-26','2026-07-25'),('PO-2210','table_apron','2026-07-27',null)
) as v(po_number, component, target, actual)
join pos p on p.po_number = v.po_number
where t.po_id = p.id and t.component = v.component::table_rm_component;

update chair_rm c set target_date = v.target::date, actual_date = v.actual::date
from (values
  ('PO-2201','chair_back_leg','2026-06-20','2026-06-19'),('PO-2201','chair_back','2026-06-21','2026-06-22'),('PO-2201','chair_front_leg','2026-06-22','2026-06-21'),
  ('PO-2198','chair_back_leg','2026-06-10','2026-06-14'),('PO-2198','chair_back','2026-06-12','2026-06-18'),('PO-2198','chair_front_leg','2026-06-13','2026-06-20'),
  ('PO-2205','chair_back_leg','2026-07-01','2026-07-02'),('PO-2205','chair_back','2026-07-02','2026-07-02'),('PO-2205','chair_front_leg','2026-07-03','2026-07-03'),
  ('PO-2190','chair_back_leg','2026-05-20','2026-05-23'),('PO-2190','chair_back','2026-05-21','2026-05-24'),('PO-2190','chair_front_leg','2026-05-22','2026-05-25'),
  ('PO-2185','chair_back_leg','2026-05-10','2026-05-09'),('PO-2185','chair_back','2026-05-11','2026-05-10'),('PO-2185','chair_front_leg','2026-05-12','2026-05-11'),
  ('PO-2210','chair_back_leg','2026-07-25','2026-07-24'),('PO-2210','chair_back','2026-07-26',null),('PO-2210','chair_front_leg','2026-07-27',null)
) as v(po_number, component, target, actual)
join pos p on p.po_number = v.po_number
where c.po_id = p.id and c.component = v.component::chair_rm_component;

update production_status ps set target_date = v.target::date, actual_date = v.actual::date
from (values
  ('PO-2201','finishing','2026-07-20','2026-07-22'),('PO-2201','packing','2026-08-05',null),('PO-2201','qc','2026-08-08',null),
  ('PO-2198','finishing','2026-07-10','2026-07-25'),('PO-2198','packing','2026-07-25',null),('PO-2198','qc','2026-07-27',null),
  ('PO-2205','finishing','2026-07-24','2026-07-26'),('PO-2205','packing','2026-08-01','2026-08-01'),('PO-2205','qc','2026-08-03','2026-08-02'),
  ('PO-2190','finishing','2026-06-25','2026-07-02'),('PO-2190','packing','2026-07-12','2026-07-18'),('PO-2190','qc','2026-07-14','2026-07-19'),
  ('PO-2185','finishing','2026-06-10','2026-06-08'),('PO-2185','packing','2026-06-25','2026-06-24'),('PO-2185','qc','2026-06-26','2026-06-25'),
  ('PO-2210','finishing','2026-08-12',null),('PO-2210','packing','2026-08-18',null),('PO-2210','qc','2026-08-19',null)
) as v(po_number, line, target, actual)
join pos p on p.po_number = v.po_number
where ps.po_id = p.id and ps.line = v.line::production_line;

update material_status ms set estimate_receive_date = v.est::date, actual_receive_date = v.actual::date
from (values
  ('PO-2201','chair_parts','2026-06-05','2026-06-05'),('PO-2201','chair_seat','2026-06-15','2026-06-14'),('PO-2201','chemical','2026-07-01','2026-07-03'),('PO-2201','carton','2026-08-01',null),
  ('PO-2198','chair_parts','2026-05-25','2026-06-02'),('PO-2198','chair_seat','2026-06-05','2026-06-20'),('PO-2198','chemical','2026-06-20','2026-07-05'),('PO-2198','carton','2026-07-15',null),
  ('PO-2205','chair_parts','2026-06-10','2026-06-10'),('PO-2205','chair_seat','2026-06-20','2026-06-19'),('PO-2205','chemical','2026-07-10','2026-07-10'),('PO-2205','carton','2026-07-28','2026-07-27'),
  ('PO-2190','chair_parts','2026-05-01','2026-05-02'),('PO-2190','chair_seat','2026-05-10','2026-05-12'),('PO-2190','chemical','2026-06-01','2026-06-05'),('PO-2190','carton','2026-07-01','2026-07-05'),
  ('PO-2185','chair_parts','2026-04-20','2026-04-19'),('PO-2185','chair_seat','2026-04-28','2026-04-27'),('PO-2185','chemical','2026-05-20','2026-05-19'),('PO-2185','carton','2026-06-15','2026-06-14'),
  ('PO-2210','chair_parts','2026-07-05','2026-07-04'),('PO-2210','chair_seat','2026-07-15',null),('PO-2210','chemical','2026-08-01',null),('PO-2210','carton','2026-08-15',null)
) as v(po_number, material, est, actual)
join pos p on p.po_number = v.po_number
where ms.po_id = p.id and ms.material = v.material::material_category;

insert into ship_date_revisions (po_id, old_date, new_date, changed_at)
select p.id, v.old_date::date, v.new_date::date, v.changed_at::timestamptz
from (values
  ('PO-2198','2026-07-10','2026-07-20','2026-07-05'),
  ('PO-2198','2026-07-20','2026-07-28','2026-07-22'),
  ('PO-2190','2026-07-05','2026-07-15','2026-06-20')
) as v(po_number, old_date, new_date, changed_at)
join pos p on p.po_number = v.po_number;
