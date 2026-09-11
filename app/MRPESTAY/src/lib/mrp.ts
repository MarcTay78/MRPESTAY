export type Role = "ppc" | "purchaser";

export const LINE_LABELS: Record<string, string> = {
  finishing: "Finishing",
  packing: "Packing",
  qc: "QC",
};
export const MATERIAL_LABELS: Record<string, string> = {
  chair_parts: "Chair Parts",
  chair_seat: "Chair Seat",
  chemical: "Chemical (Spraying)",
  carton: "Carton (Packing)",
};

export function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  // slice keeps timestamptz callers (ship_date_revisions.changed_at) working —
  // appending to a full timestamp string yields an Invalid Date.
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Which date the Planned card leads with: the target ship date when one is
// set, otherwise wherever QC stands.
export function shipDateFor(po: { target_ship_date: string | null; qc_target_date: string | null; qc_actual_date: string | null }) {
  if (po.target_ship_date) return { shipDateLabel: "Target ship", shipDateDisplay: fmt(po.target_ship_date) };
  return { shipDateLabel: "QC", shipDateDisplay: fmt(po.qc_actual_date ?? po.qc_target_date) };
}

export type PendingRm = { label: string; display: string; overdue: boolean };

// "Material not yet in": Table RM / Chair RM rows PPC entered with no actual
// date. Same component under two models is listed once, keeping the earliest
// target date. Callers pass only the rows that are still outstanding.
export function pendingRmFrom(rows: { label: string; target_date: string | null }[]): PendingRm[] {
  const merged: { label: string; target_date: string | null }[] = [];
  for (const row of rows) {
    const seen = merged.find((m) => m.label === row.label);
    if (!seen) merged.push({ ...row });
    else if (row.target_date && (!seen.target_date || row.target_date < seen.target_date)) seen.target_date = row.target_date;
  }
  return merged.map((m) => ({
    label: m.label,
    display: fmt(m.target_date),
    overdue: !!m.target_date && m.target_date < todayIso(),
  }));
}

export interface RawItem {
  id: string;
  type: "table" | "chair";
  model: string;
  qty: number;
  parts_target: string | null;
  parts_actual: string | null;
  white_target: string | null;
  white_actual: string | null;
}

export interface RawComponent {
  id: string;
  item_id: string | null;
  component: string;
  target_date: string | null;
  actual_date: string | null;
}

export interface RawLine {
  line: string;
  target_date: string | null;
  actual_date: string | null;
}

export interface RawMaterial {
  material: string;
  estimate_receive_date: string | null;
  actual_receive_date: string | null;
}

export interface RawRevision {
  id: string;
  old_date: string;
  new_date: string;
  changed_at: string;
}

export interface RawPo {
  id: string;
  po_number: string;
  customer: string;
  status: PoStatus;
  plan_date: string;
  target_ship_date: string | null;
  actual_ship_date: string | null;
  items: RawItem[];
  table_rm: RawComponent[];
  chair_rm: RawComponent[];
  lines: RawLine[];
  materials: RawMaterial[];
  revisions: RawRevision[];
}

export type ProdRow = {
  label: string;
  targetDisplay: string;
  actualDisplay: string;
  target: string | null;
  actual: string | null;
} & (
  | { kind: "item"; itemId: string; part: "white" }
  | { kind: "line"; line: string }
  | { kind: "ship" }
);

// PPC sets the status by hand. Shipped stays derived: an actual ship date wins
// over whatever the stored status says.
export const PO_STATUSES = ["ready", "in_progress", "pending_material"] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

export const STATUS_LABELS: Record<PoStatus, string> = {
  ready: "Ready",
  in_progress: "In Progress",
  pending_material: "Pending Material",
};

const STATUS_TINT: Record<PoStatus, string> = {
  ready: "var(--mrp-green)",
  in_progress: "var(--mrp-yellow)",
  pending_material: "var(--mrp-red)",
};

export interface Badge {
  statusLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
}

export function badgeFor(po: { status: PoStatus; actual_ship_date: string | null }): Badge {
  if (po.actual_ship_date) {
    return {
      statusLabel: "Shipped",
      badgeBg: "var(--color-neutral-200)",
      badgeBorder: "var(--color-neutral-300)",
      badgeColor: "var(--color-neutral-700)",
    };
  }
  const tint = STATUS_TINT[po.status];
  return {
    statusLabel: STATUS_LABELS[po.status],
    badgeBg: `color-mix(in oklch, ${tint} 12%, white)`,
    badgeBorder: `color-mix(in oklch, ${tint} 40%, transparent)`,
    badgeColor: tint,
  };
}

// Table RM / Chair RM are free-text rows PPC names and adds on the fly
// (see po/actions.ts addRmRow), each tied to a specific po_items row.
// `display` is what the board shows: actual date if entered, else target.
function rmRow(r: RawComponent) {
  return {
    id: r.id,
    item_id: r.item_id,
    model: r.component,
    target: fmt(r.target_date),
    actual: fmt(r.actual_date),
    hasActual: !!r.actual_date,
    target_date: r.target_date,
    actual_date: r.actual_date,
    display: r.actual_date ? fmt(r.actual_date) : fmt(r.target_date),
  };
}
type RmRow = ReturnType<typeof rmRow>;

// Groups rm rows by item_id; rows with no item_id (migration couldn't
// place them — PO had no item of that type) come back separately so the
// detail page can surface them as "Unassigned" instead of losing them.
function groupRm(rows: RawComponent[]): { byItem: Map<string, RmRow[]>; unassigned: RmRow[] } {
  const byItem = new Map<string, RmRow[]>();
  const unassigned: RmRow[] = [];
  for (const raw of rows) {
    const row = rmRow(raw);
    if (!row.item_id) {
      unassigned.push(row);
      continue;
    }
    const list = byItem.get(row.item_id);
    if (list) list.push(row);
    else byItem.set(row.item_id, [row]);
  }
  return { byItem, unassigned };
}

export function buildPo(raw: RawPo) {
  const shipped = !!raw.actual_ship_date;
  const badge = badgeFor(raw);
  // Ship-date risk is no longer the badge, but it's still worth flagging.
  const isLate = !shipped && !!raw.target_ship_date && todayIso() > raw.target_ship_date;

  // Every PO starts with all three lines (seed_po_children), but PPC can
  // delete ones that don't apply. `exists` keeps the full shape for the board
  // (fixed columns, shows "—") while the detail page renders only live rows.
  const lines = Object.keys(LINE_LABELS).map((key) => {
    const row = raw.lines.find((l) => l.line === key);
    return {
      line: key,
      label: LINE_LABELS[key],
      exists: !!row,
      targetDisplay: fmt(row?.target_date),
      actualDisplay: fmt(row?.actual_date),
      target_date: row?.target_date ?? null,
      actual_date: row?.actual_date ?? null,
    };
  });

  const materials = Object.keys(MATERIAL_LABELS).map((key) => {
    const row = raw.materials.find((m) => m.material === key);
    return {
      material: key,
      label: MATERIAL_LABELS[key],
      estimateDisplay: fmt(row?.estimate_receive_date),
      actualDisplay: fmt(row?.actual_receive_date),
      estimate_receive_date: row?.estimate_receive_date ?? null,
      actual_receive_date: row?.actual_receive_date ?? null,
    };
  });

  const revisions = raw.revisions.map((r) => ({
    ...r,
    oldDisplay: fmt(r.old_date),
    newDisplay: fmt(r.new_date),
    changedDisplay: fmt(r.changed_at),
  }));

  const { byItem: tableRMByItem, unassigned: unassignedTableRM } = groupRm(raw.table_rm);
  const { byItem: chairRMByItem, unassigned: unassignedChairRM } = groupRm(raw.chair_rm);

  const withParts = (i: RawItem, rmByItem: Map<string, RmRow[]>) => ({
    ...i,
    hasWhiteActual: !!i.white_actual,
    whiteTargetDisplay: fmt(i.white_target),
    whiteActualDisplay: fmt(i.white_actual),
    rm: rmByItem.get(i.id) ?? [],
  });

  const tableItems = raw.items.filter((i) => i.type === "table").map((i) => withParts(i, tableRMByItem));
  const chairItems = raw.items.filter((i) => i.type === "chair").map((i) => withParts(i, chairRMByItem));
  const totalTableQty = tableItems.reduce((s, i) => s + i.qty, 0);
  const totalChairQty = chairItems.reduce((s, i) => s + i.qty, 0);

  // Every row PPC can enter a date against, in the order the detail page's
  // combined "Production Lines" table shows them. `kind` tells the page
  // which server action + hidden fields to wire the two date inputs to.
  // Table RM / Chair RM get their own section instead (see po/[id]/page.tsx).
  const prodRows: ProdRow[] = [
    ...tableItems.map((i) => ({
      kind: "item" as const, itemId: i.id, part: "white" as const,
      label: "Table WP — " + i.model,
      targetDisplay: i.whiteTargetDisplay, actualDisplay: i.whiteActualDisplay,
      target: i.white_target, actual: i.white_actual,
    })),
    ...chairItems.map((i) => ({
      kind: "item" as const, itemId: i.id, part: "white" as const,
      label: "Chair WP — " + i.model,
      targetDisplay: i.whiteTargetDisplay, actualDisplay: i.whiteActualDisplay,
      target: i.white_target, actual: i.white_actual,
    })),
    ...lines.filter((l) => l.exists).map((l) => ({
      kind: "line" as const, line: l.line,
      label: l.label, targetDisplay: l.targetDisplay, actualDisplay: l.actualDisplay,
      target: l.target_date, actual: l.actual_date,
    })),
    {
      kind: "ship" as const,
      label: "Ship Date", targetDisplay: fmt(raw.target_ship_date), actualDisplay: shipped ? fmt(raw.actual_ship_date) : "Not shipped",
      target: raw.target_ship_date, actual: raw.actual_ship_date,
    },
  ];

  // "All green" for the board's tabs: every model shipped-ready on the floor —
  // each item has a white actual, each of its RM rows an actual, and every
  // live line except QC is done. QC and the ship date are deliberately out.
  // A PO with no models at all is never green; there's nothing to be done.
  const allItems = [...tableItems, ...chairItems];
  const allGreen =
    allItems.length > 0 &&
    allItems.every((i) => !!i.white_actual && i.rm.every((r) => r.hasActual)) &&
    lines.filter((l) => l.exists && l.line !== "qc").every((l) => !!l.actual_date);

  // "Material not yet in" for the dashboard: a Table RM / Chair RM row PPC
  // entered that has no actual date yet. No row means nothing outstanding.
  // The purchaser's material_status categories are a separate track and are
  // not counted here. Same component under two models is listed once, keeping
  // the earliest target date.
  const pendingRm = pendingRmFrom(
    [...allItems.flatMap((i) => i.rm), ...unassignedTableRM, ...unassignedChairRM]
      .filter((r) => !r.hasActual)
      .map((r) => ({ label: r.model, target_date: r.target_date })),
  );

  const qcLine = lines.find((l) => l.line === "qc");
  const { shipDateLabel, shipDateDisplay } = shipDateFor({
    target_ship_date: raw.target_ship_date,
    qc_target_date: qcLine?.target_date ?? null,
    qc_actual_date: qcLine?.actual_date ?? null,
  });

  return {
    ...raw,
    ...badge,
    isLate,
    planDateDisplay: fmt(raw.plan_date),
    targetShipDisplay: fmt(raw.target_ship_date),
    actualShipDisplay: shipped ? fmt(raw.actual_ship_date) : "Not shipped",
    shipDateLabel,
    shipDateDisplay,
    // Dashboard "Planned" order: QC target first, ship date when QC is blank,
    // and undated POs last. ISO dates sort correctly as plain strings.
    qcSortDate: qcLine?.target_date ?? raw.target_ship_date ?? "9999-12-31",
    lines,
    removedLines: lines.filter((l) => !l.exists),
    materials,
    pendingRm,
    revisions,
    hasRevisions: revisions.length > 0,
    noRevisions: revisions.length === 0,
    tableItems,
    chairItems,
    totalTableQty,
    totalChairQty,
    allGreen,
    prodRows,
    unassignedTableRM,
    unassignedChairRM,
  };
}

export type BuiltPo = ReturnType<typeof buildPo>;
