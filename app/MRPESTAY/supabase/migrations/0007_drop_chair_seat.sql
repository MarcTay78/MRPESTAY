-- Chair Seat is no longer tracked per model: it was auto-created alongside
-- every Chair WP row and never used. The board column and the Production
-- Lines row are gone, so the columns behind them go too.
--
-- Destructive: any dates already entered in these two columns are lost.
-- The chair_seat material_status category is a different thing (purchasing)
-- and is deliberately left alone.

alter table po_items drop column seat_target;
alter table po_items drop column seat_actual;
