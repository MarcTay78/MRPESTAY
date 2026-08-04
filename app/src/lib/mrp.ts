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
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
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
  seat_target: string | null;
  seat_actual: string | null;
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
  | { kind: "item"; itemId: string; part: "white" | "seat" }
  | { kind: "line"; line: string }
  | { kind: "ship" }
);

export interface Badge {
  status: "green" | "red" | "grey";
  statusLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
}

export function badgeFor(po: { target_ship_date: string | null; actual_ship_date: string | null }): Badge {
  if (po.actual_ship_date) {
    return {
      status: "grey",
      statusLabel: "Shipped",
      badgeBg: "var(--color-neutral-200)",
      badgeBorder: "var(--color-neutral-300)",
      badgeColor: "var(--color-neutral-700)",
    };
  }
  if (!po.target_ship_date) {
    return {
      status: "grey",
      statusLabel: "No Ship Date",
      badgeBg: "var(--color-neutral-200)",
      badgeBorder: "var(--color-neutral-300)",
      badgeColor: "var(--color-neutral-700)",
    };
  }
  if (todayIso() > po.target_ship_date) {
    return {
      status: "red",
      statusLabel: "Late",
      badgeBg: "color-mix(in oklch, var(--mrp-red) 12%, white)",
      badgeBorder: "color-mix(in oklch, var(--mrp-red) 40%, transparent)",
      badgeColor: "var(--mrp-red)",
    };
  }
  return {
    status: "green",
    statusLabel: "On Track",
    badgeBg: "color-mix(in oklch, var(--mrp-green) 12%, white)",
    badgeBorder: "color-mix(in oklch, var(--mrp-green) 40%, transparent)",
    badgeColor: "var(--mrp-green)",
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

  const lines = Object.keys(LINE_LABELS).map((key) => {
    const row = raw.lines.find((l) => l.line === key);
    return {
      line: key,
      label: LINE_LABELS[key],
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
    hasSeatActual: !!i.seat_actual,
    seatTargetDisplay: fmt(i.seat_target),
    seatActualDisplay: fmt(i.seat_actual),
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
    ...chairItems.map((i) => ({
      kind: "item" as const, itemId: i.id, part: "seat" as const,
      label: "Chair Seat — " + i.model,
      targetDisplay: i.seatTargetDisplay, actualDisplay: i.seatActualDisplay,
      target: i.seat_target, actual: i.seat_actual,
    })),
    ...lines.map((l) => ({
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

  return {
    ...raw,
    ...badge,
    planDateDisplay: fmt(raw.plan_date),
    targetShipDisplay: fmt(raw.target_ship_date),
    actualShipDisplay: shipped ? fmt(raw.actual_ship_date) : "Not shipped",
    lines,
    materials,
    revisions,
    hasRevisions: revisions.length > 0,
    noRevisions: revisions.length === 0,
    tableItems,
    chairItems,
    totalTableQty,
    totalChairQty,
    prodRows,
    unassignedTableRM,
    unassignedChairRM,
  };
}

export type BuiltPo = ReturnType<typeof buildPo>;
