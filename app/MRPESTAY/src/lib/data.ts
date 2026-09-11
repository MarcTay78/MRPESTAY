import type { SupabaseClient } from "@supabase/supabase-js";
import { badgeFor, pendingRmFrom, shipDateFor, todayIso, type PoStatus, type RawPo } from "@/lib/mrp";
import type { PlannedCardData } from "@/components/PlannedCard";

const PO_SELECT = `
  id, po_number, customer, status, plan_date, target_ship_date, actual_ship_date, created_at,
  items:po_items(id, type, model, qty, parts_target, parts_actual, white_target, white_actual),
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

// Public landing page. Reads the public_* views, which are readable without a
// session and carry no customer names (see migrations 0009 and 0010).
export async function fetchPublicOverview(supabase: SupabaseClient) {
  const [planned, shipped] = await Promise.all([
    fetchPublicPlanned(supabase),
    supabase.from("public_shipped_pos").select("actual_ship_date"),
  ]);
  const monthPrefix = todayIso().slice(0, 7);
  const rows = (shipped.data ?? []) as { actual_ship_date: string }[];
  return {
    planned,
    shippedThisMonth: rows.filter((r) => r.actual_ship_date.startsWith(monthPrefix)).length,
  };
}

async function fetchPublicPlanned(supabase: SupabaseClient): Promise<PlannedCardData[]> {
  const [pos, rm] = await Promise.all([
    supabase.from("public_planned_pos").select("id, po_number, status, plan_date, target_ship_date, qc_target_date, qc_actual_date"),
    supabase.from("public_planned_rm").select("po_id, component, target_date"),
  ]);
  if (pos.error || !pos.data) return [];
  const rmRows = (rm.data ?? []) as { po_id: string; component: string; target_date: string | null }[];

  // Same order as the dashboard: QC target first, ship date when QC is blank,
  // undated last. ISO dates sort correctly as plain strings.
  const sortKey = (p: PublicPlannedPo) => p.qc_target_date ?? p.target_ship_date ?? "9999-12-31";

  return (pos.data as PublicPlannedPo[])
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((p) => ({
      id: p.id,
      po_number: p.po_number,
      isLate: !!p.target_ship_date && todayIso() > p.target_ship_date,
      ...shipDateFor(p),
      ...badgeFor({ status: p.status, actual_ship_date: null }),
      pendingRm: pendingRmFrom(
        rmRows.filter((r) => r.po_id === p.id).map((r) => ({ label: r.component, target_date: r.target_date })),
      ),
    }));
}

type PublicPlannedPo = {
  id: string;
  po_number: string;
  status: PoStatus;
  plan_date: string;
  target_ship_date: string | null;
  qc_target_date: string | null;
  qc_actual_date: string | null;
};

export async function fetchPo(supabase: SupabaseClient, id: string): Promise<RawPo | null> {
  const { data, error } = await supabase
    .from("pos")
    .select(PO_SELECT)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as RawPo;
}
