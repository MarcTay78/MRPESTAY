// Run: node --test src/lib/mrp.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPo, type RawPo, type RawItem, type RawComponent } from "./mrp.ts";

const item = (id: string, type: "table" | "chair", white_actual: string | null): RawItem => ({
  id, type, model: `${type}-${id}`, qty: 10,
  parts_target: null, parts_actual: null,
  white_target: "2026-07-01", white_actual,
});

const rm = (id: string, item_id: string, actual_date: string | null): RawComponent => ({
  id, item_id, component: "Top", target_date: "2026-06-01", actual_date,
});

const po = (over: Partial<RawPo>): RawPo => ({
  id: "po1", po_number: "PO-1", customer: "ACME", status: "in_progress",
  plan_date: "2026-08-01", target_ship_date: "2026-08-01", actual_ship_date: null,
  items: [], table_rm: [], chair_rm: [],
  lines: [
    { line: "finishing", target_date: "2026-07-10", actual_date: "2026-07-10" },
    { line: "packing", target_date: "2026-07-20", actual_date: "2026-07-20" },
    { line: "qc", target_date: "2026-07-25", actual_date: null },
  ],
  materials: [], revisions: [],
  ...over,
});

test("allGreen ignores QC and the ship date", () => {
  const built = buildPo(po({ items: [item("i1", "table", "2026-07-02")] }));
  assert.equal(built.allGreen, true);
});

test("allGreen is false while an item has no white actual", () => {
  const built = buildPo(po({ items: [item("i1", "table", null)] }));
  assert.equal(built.allGreen, false);
});

test("allGreen is false while an RM row has no actual", () => {
  const built = buildPo(po({
    items: [item("i1", "table", "2026-07-02")],
    table_rm: [rm("r1", "i1", null)],
  }));
  assert.equal(built.allGreen, false);
});

test("allGreen is false while a live line other than QC is unfinished", () => {
  const built = buildPo(po({
    items: [item("i1", "table", "2026-07-02")],
    lines: [{ line: "packing", target_date: "2026-07-20", actual_date: null }],
  }));
  assert.equal(built.allGreen, false);
});

test("a deleted line does not hold a PO back", () => {
  const built = buildPo(po({ items: [item("i1", "table", "2026-07-02")], lines: [] }));
  assert.equal(built.allGreen, true);
});

test("qcSortDate falls back to the ship date, then to last place", () => {
  assert.equal(buildPo(po({})).qcSortDate, "2026-07-25");
  const noQc = po({ lines: [], target_ship_date: "2026-08-01" });
  assert.equal(buildPo(noQc).qcSortDate, "2026-08-01");
  assert.equal(buildPo(po({ lines: [], target_ship_date: null })).qcSortDate, "9999-12-31");
});

test("pendingRm lists RM rows with no actual date, once per component", () => {
  const built = buildPo(po({
    items: [item("i1", "chair", null), item("i2", "chair", null)],
    chair_rm: [
      { id: "r1", item_id: "i1", component: "PU Foam", target_date: "2026-07-10", actual_date: null },
      { id: "r2", item_id: "i2", component: "PU Foam", target_date: "2026-06-01", actual_date: null },
      { id: "r3", item_id: "i1", component: "Chemical", target_date: null, actual_date: null },
      { id: "r4", item_id: "i1", component: "Seat Board", target_date: "2026-07-01", actual_date: "2026-07-02" },
    ],
  }));
  assert.deepEqual(built.pendingRm.map((r) => r.label), ["PU Foam", "Chemical"]);
  assert.equal(built.pendingRm[0].display, "01/06/2026");
  assert.equal(built.pendingRm[1].display, "—");
});

test("a PO with no RM rows has nothing outstanding", () => {
  assert.deepEqual(buildPo(po({ items: [item("i1", "chair", null)] })).pendingRm, []);
});

test("an actual ship date overrides the stored status", () => {
  assert.equal(buildPo(po({ status: "ready" })).statusLabel, "Ready");
  assert.equal(buildPo(po({ status: "ready", actual_ship_date: "2026-08-02" })).statusLabel, "Shipped");
});

test("a PO with no models is never green", () => {
  assert.equal(buildPo(po({})).allGreen, false);
});
