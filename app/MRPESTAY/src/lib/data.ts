import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawPo } from "@/lib/mrp";

const PO_SELECT = `
  id, po_number, customer, plan_date, target_ship_date, actual_ship_date, created_at,
  items:po_items(id, type, model, qty, parts_target, parts_actual, white_target, white_actual, seat_target, seat_actual),
  table_rm(id, item_id, component, target_date, actual_date),
  chair_rm(id, item_id, component, target_date, actual_date),
  lines:production_status(line, target_date, actual_date),
  materials:material_status(material, estimate_receive_date, actual_receive_date),
  revisions:ship_date_revisions(id, old_date, new_date, changed_at)
`;

export async function fetchPos(supabase: SupabaseClient): Promise<RawPo[]> {
  const { data, error } = await supabase
    .from("pos")
    .select(PO_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RawPo[];
}

export async function fetchPo(supabase: SupabaseClient, id: string): Promise<RawPo | null> {
  const { data, error } = await supabase
    .from("pos")
    .select(PO_SELECT)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as RawPo;
}
