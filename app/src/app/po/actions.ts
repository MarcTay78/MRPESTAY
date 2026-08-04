"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";

function touch(poId: string) {
  revalidatePath(`/po/${poId}`);
  revalidatePath("/dashboard");
  revalidatePath("/board");
}

function val(formData: FormData) {
  return String(formData.get("value") || "") || null;
}

export async function updateLineDate(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const poId = String(formData.get("poId"));
  const line = String(formData.get("line"));
  const field = String(formData.get("field"));
  await supabase.from("production_status").update({ [field]: val(formData) }).eq("po_id", poId).eq("line", line);
  touch(poId);
}

const RM_TABLES = ["table_rm", "chair_rm"] as const;
const RM_FIELDS = ["target_date", "actual_date"] as const;

function rmTable(formData: FormData) {
  const table = String(formData.get("table"));
  return (RM_TABLES as readonly string[]).includes(table) ? table : null;
}

export async function updateComponentDate(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const table = rmTable(formData);
  const field = String(formData.get("field"));
  if (!table || !(RM_FIELDS as readonly string[]).includes(field)) return;
  const poId = String(formData.get("poId"));
  const id = String(formData.get("id"));
  await supabase.from(table).update({ [field]: val(formData) }).eq("id", id).eq("po_id", poId);
  touch(poId);
}

export async function addRmRow(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const table = rmTable(formData);
  const poId = String(formData.get("poId"));
  const itemId = String(formData.get("itemId") || "");
  const component = String(formData.get("component") || "").trim();
  if (!table || !itemId || !component) return;
  await supabase.from(table).insert({ po_id: poId, item_id: itemId, component });
  touch(poId);
}

export async function assignRmItem(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const table = rmTable(formData);
  const poId = String(formData.get("poId"));
  const id = String(formData.get("id"));
  const itemId = String(formData.get("itemId") || "");
  if (!table || !itemId) return;
  await supabase.from(table).update({ item_id: itemId }).eq("id", id).eq("po_id", poId);
  touch(poId);
}

export async function deleteRmRow(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const table = rmTable(formData);
  if (!table) return;
  const poId = String(formData.get("poId"));
  const id = String(formData.get("id"));
  await supabase.from(table).delete().eq("id", id).eq("po_id", poId);
  touch(poId);
}

export async function updateItemDate(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const poId = String(formData.get("poId"));
  const itemId = String(formData.get("itemId"));
  const field = String(formData.get("field"));
  await supabase.from("po_items").update({ [field]: val(formData) }).eq("id", itemId);
  touch(poId);
}

export async function updateMaterialDate(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "purchaser") return;
  const poId = String(formData.get("poId"));
  const material = String(formData.get("material"));
  const field = String(formData.get("field"));
  await supabase.from("material_status").update({ [field]: val(formData) }).eq("po_id", poId).eq("material", material);
  touch(poId);
}

export async function reviseTargetShipDate(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const poId = String(formData.get("poId"));
  const newDate = val(formData);
  const { data: po } = await supabase.from("pos").select("target_ship_date").eq("id", poId).single();
  if (!po || po.target_ship_date === newDate) return;
  // Only log a revision when going date-to-date — clearing or first-setting
  // the ship date isn't a "revision" (ship_date_revisions columns are
  // not-null, so a null endpoint couldn't be logged anyway).
  if (newDate && po.target_ship_date) {
    await supabase.from("ship_date_revisions").insert({ po_id: poId, old_date: po.target_ship_date, new_date: newDate });
  }
  await supabase.from("pos").update({ target_ship_date: newDate }).eq("id", poId);
  touch(poId);
}

export async function setActualShipDate(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const poId = String(formData.get("poId"));
  await supabase.from("pos").update({ actual_ship_date: val(formData) }).eq("id", poId);
  touch(poId);
}

export async function updatePlanDate(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;
  const poId = String(formData.get("poId"));
  const newDate = val(formData);
  if (!newDate) return;
  await supabase.from("pos").update({ plan_date: newDate }).eq("id", poId);
  touch(poId);
}

export async function createPo(formData: FormData) {
  const { supabase, role } = await requireSession();
  if (role !== "ppc") return;

  const po_number = String(formData.get("po_number") || "").trim();
  const customer = String(formData.get("customer") || "").trim();
  const target_ship_date = String(formData.get("target_ship_date") || "");
  if (!po_number || !customer || !target_ship_date) return;

  const { data: po, error } = await supabase
    .from("pos")
    .insert({ po_number, customer, plan_date: target_ship_date, target_ship_date })
    .select("id")
    .single();
  if (error || !po) return;

  const items = [];
  for (const [type, prefix] of [["table", "table"], ["chair", "chair"]] as const) {
    for (let i = 0; ; i++) {
      const model = formData.get(`${prefix}_model_${i}`);
      const qty = formData.get(`${prefix}_qty_${i}`);
      if (model == null) break;
      if (String(model).trim()) {
        items.push({ po_id: po.id, type, model: String(model).trim(), qty: Number(qty) || 0 });
      }
    }
  }
  if (items.length) await supabase.from("po_items").insert(items);

  revalidatePath("/dashboard");
  revalidatePath("/board");
  redirect(`/po/${po.id}?from=board`);
}
