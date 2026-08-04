import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { fetchPo } from "@/lib/data";
import { buildPo, type ProdRow, type BuiltPo } from "@/lib/mrp";
import NavBar from "@/components/NavBar";
import DateField from "@/components/DateField";
import {
  updateLineDate,
  updateComponentDate,
  addRmRow,
  deleteRmRow,
  assignRmItem,
  updateItemDate,
  updateMaterialDate,
  reviseTargetShipDate,
  setActualShipDate,
  updatePlanDate,
} from "@/app/po/actions";

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-neutral-400)" }}>
    <rect x="4" y="10" width="16" height="10" rx="1" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

function RmSection({
  title, poId, table, items, unassigned, isPpc,
}: {
  title: string;
  poId: string;
  table: "table_rm" | "chair_rm";
  items: BuiltPo["tableItems"];
  unassigned: BuiltPo["unassignedTableRM"];
  isPpc: boolean;
}) {
  return (
    <div className="card elev-sm" style={{ padding: "20px 22px", marginBottom: 20 }}>
      <div style={{ fontSize: 16.9, fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {title} <span style={{ color: "var(--color-neutral-500)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— PPC entry</span>
      </div>
      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 16.25, fontWeight: 600, marginBottom: 6 }}>{item.model}</div>
          <table className="table" style={{ width: "100%" }}>
            <thead><tr><th>Material</th><th>Target Date</th><th>Actual Date</th>{isPpc && <th></th>}</tr></thead>
            <tbody>
              {item.rm.map((r) => (
                <tr key={r.id}>
                  <td>{r.model}</td>
                  <td>
                    {isPpc ? (
                      <DateField action={updateComponentDate} hidden={{ poId, table, id: r.id, field: "target_date" }} value={r.target_date} editable />
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{r.target} <LockIcon /></span>
                    )}
                  </td>
                  <td>
                    {isPpc ? (
                      <DateField action={updateComponentDate} hidden={{ poId, table, id: r.id, field: "actual_date" }} value={r.actual_date} editable />
                    ) : (
                      r.actual
                    )}
                  </td>
                  {isPpc && (
                    <td style={{ textAlign: "right" }}>
                      <form action={deleteRmRow}>
                        <input type="hidden" name="poId" value={poId} />
                        <input type="hidden" name="table" value={table} />
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" className="btn btn-ghost" title="Remove" style={{ width: 22, height: 22, minHeight: 0, padding: 0, fontSize: 18.2, lineHeight: 1, color: "var(--mrp-red)" }}>×</button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
              {item.rm.length === 0 && (
                <tr><td colSpan={isPpc ? 4 : 3} style={{ color: "var(--color-neutral-500)", fontSize: 15.6 }}>None yet.</td></tr>
              )}
            </tbody>
          </table>
          {isPpc && (
            <form action={addRmRow} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="hidden" name="poId" value={poId} />
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="itemId" value={item.id} />
              <input className="input" name="component" placeholder="e.g. Table Top" style={{ flex: 1 }} />
              <button type="submit" className="btn btn-secondary" style={{ fontSize: 15.6 }}>+ Add</button>
            </form>
          )}
        </div>
      ))}
      {items.length === 0 && (
        <div style={{ color: "var(--color-neutral-500)", fontSize: 15.6 }}>No models on this PO yet.</div>
      )}
      {isPpc && unassigned.length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-neutral-300)", paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontSize: 14.3, fontWeight: 600, color: "var(--mrp-red)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Unassigned — needs a model
          </div>
          {unassigned.map((r) => (
            <form key={r.id} action={assignRmItem} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <input type="hidden" name="poId" value={poId} />
              <input type="hidden" name="table" value={table} />
              <input type="hidden" name="id" value={r.id} />
              <span style={{ fontSize: 15.6, flex: 1 }}>{r.model} ({r.target})</span>
              <select name="itemId" className="input" style={{ fontSize: 15.6 }}>
                {items.map((it) => <option key={it.id} value={it.id}>{it.model}</option>)}
              </select>
              <button type="submit" className="btn btn-secondary" style={{ fontSize: 14.3 }}>Assign</button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}

type FieldSpec = { action: (formData: FormData) => void | Promise<void>; hidden: Record<string, string> };

function prodRowFields(row: ProdRow, poId: string): { target: FieldSpec; actual: FieldSpec } {
  switch (row.kind) {
    case "item":
      return {
        target: { action: updateItemDate, hidden: { poId, itemId: row.itemId, field: `${row.part}_target` } },
        actual: { action: updateItemDate, hidden: { poId, itemId: row.itemId, field: `${row.part}_actual` } },
      };
    case "line":
      return {
        target: { action: updateLineDate, hidden: { poId, line: row.line, field: "target_date" } },
        actual: { action: updateLineDate, hidden: { poId, line: row.line, field: "actual_date" } },
      };
    case "ship":
      return {
        target: { action: reviseTargetShipDate, hidden: { poId } },
        actual: { action: setActualShipDate, hidden: { poId } },
      };
  }
}

export default async function PoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const { supabase, role } = await requireSession();
  const raw = await fetchPo(supabase, id);
  if (!raw) notFound();
  const po = buildPo(raw);
  const isPpc = role === "ppc";
  const isPurchaser = role === "purchaser";
  const backHref = from === "board" ? "/board" : "/dashboard";
  const backLabel = from === "board" ? "Back to production board" : "Back to dashboard";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar role={role} />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 28px 60px", width: "100%" }}>
        <Link href={backHref} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-neutral-600)", fontSize: 15.6, width: "fit-content", marginBottom: 18 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg> {backLabel}
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 36.4, fontWeight: 500 }}>{po.po_number}</div>
              <div style={{ padding: "4px 10px", fontSize: 14.3, fontWeight: 600, border: `1px solid ${po.badgeBorder}`, background: po.badgeBg, color: po.badgeColor, whiteSpace: "nowrap" }}>
                {po.statusLabel}
              </div>
            </div>
            <div style={{ color: "var(--color-neutral-600)", fontSize: 16.9, marginTop: 6 }}>
              {po.customer} · {po.totalTableQty} tables / {po.totalChairQty} chairs
            </div>
          </div>
        </div>

        <div className="card elev-sm" style={{ padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 16.9, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v9l9 5 9-5V8" /></svg>Items
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ color: "var(--color-neutral-600)", fontSize: 14.3, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>Tables</div>
              {po.tableItems.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 16.9, padding: "6px 0", borderBottom: "1px solid var(--color-neutral-200)" }}>
                  <span>{item.model}</span><span style={{ color: "var(--color-neutral-700)" }}>{item.qty}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ color: "var(--color-neutral-600)", fontSize: 14.3, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>Chairs</div>
              {po.chairItems.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 16.9, padding: "6px 0", borderBottom: "1px solid var(--color-neutral-200)" }}>
                  <span>{item.model}</span><span style={{ color: "var(--color-neutral-700)" }}>{item.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <RmSection title="Table RM" poId={po.id} table="table_rm" items={po.tableItems} unassigned={po.unassignedTableRM} isPpc={isPpc} />
        <RmSection title="Chair RM" poId={po.id} table="chair_rm" items={po.chairItems} unassigned={po.unassignedChairRM} isPpc={isPpc} />

        <div className="card elev-sm" style={{ padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 16.9, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="1" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M9 15l2 2 4-4" /></svg>Ship Date
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 18 }}>
            <div>
              <div style={{ color: "var(--color-neutral-600)", fontSize: 14.3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>Plan Date</div>
              {isPpc ? (
                <DateField action={updatePlanDate} hidden={{ poId: po.id }} value={po.plan_date} editable clearable={false} />
              ) : (
                <div style={{ fontSize: 20.8 }}>{po.planDateDisplay}</div>
              )}
            </div>
            <div>
              <div style={{ color: "var(--color-neutral-600)", fontSize: 14.3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>Ship Date {isPpc && "— revise to log a change"}</div>
              {isPpc ? (
                <DateField action={reviseTargetShipDate} hidden={{ poId: po.id }} value={po.target_ship_date} editable />
              ) : (
                <div style={{ fontSize: 20.8 }}>{po.targetShipDisplay}</div>
              )}
            </div>
            <div>
              <div style={{ color: "var(--color-neutral-600)", fontSize: 14.3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.03em" }}>Actual Ship Date</div>
              {isPpc ? (
                <DateField action={setActualShipDate} hidden={{ poId: po.id }} value={po.actual_ship_date} editable />
              ) : (
                <div style={{ fontSize: 20.8 }}>{po.actualShipDisplay}</div>
              )}
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--color-neutral-300)", paddingTop: 14 }}>
            <div style={{ color: "var(--color-neutral-600)", fontSize: 14.3, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.03em" }}>Revision History</div>
            {po.hasRevisions ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {po.revisions.map((rev) => (
                  <div key={rev.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15.6, color: "var(--color-neutral-700)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-neutral-500)" }}><path d="M3 12a9 9 0 1 0 3-6.7" /><polyline points="3 3 3 8 8 8" /><path d="M12 7v5l3 2" /></svg>
                    <span style={{ textDecoration: "line-through", color: "var(--color-neutral-500)" }}>{rev.oldDisplay}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    <span>{rev.newDisplay}</span>
                    <span style={{ color: "var(--color-neutral-500)" }}>on {rev.changedDisplay}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 15.6, color: "var(--color-neutral-500)" }}>No revisions — on original target.</div>
            )}
          </div>
        </div>

        <div className="card elev-sm" style={{ padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ fontSize: 16.9, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V10l6 4v-4l6 4V7l6 4v10z" /><path d="M3 21h18" /></svg>Production Lines <span style={{ color: "var(--color-neutral-500)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— PPC entry</span>
          </div>
          <table className="table" style={{ width: "100%" }}>
            <thead><tr><th>Line</th><th>Target Date</th><th>Actual Date</th></tr></thead>
            <tbody>
              {po.prodRows.map((row, i) => {
                const fields = prodRowFields(row, po.id);
                return (
                  <tr key={i}>
                    <td>{row.label}</td>
                    <td>
                      {isPpc ? (
                        <DateField action={fields.target.action} hidden={fields.target.hidden} value={row.target} editable />
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{row.targetDisplay} <LockIcon /></span>
                      )}
                    </td>
                    <td>
                      {isPpc ? (
                        <DateField action={fields.actual.action} hidden={fields.actual.hidden} value={row.actual} editable />
                      ) : (
                        row.actualDisplay
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card elev-sm" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 16.9, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4.5v9L12 20l-8-4.5v-9z" /><path d="M4 6.5l8 4.5 8-4.5" /><path d="M12 11v9" /></svg>Materials <span style={{ color: "var(--color-neutral-500)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— Purchaser entry</span>
          </div>
          <table className="table" style={{ width: "100%" }}>
            <thead><tr><th>Category</th><th>Estimate Receive</th><th>Actual Receive</th></tr></thead>
            <tbody>
              {po.materials.map((mat) => (
                <tr key={mat.material}>
                  <td>{mat.label}</td>
                  <td>
                    {isPurchaser ? (
                      <DateField action={updateMaterialDate} hidden={{ poId: po.id, material: mat.material, field: "estimate_receive_date" }} value={mat.estimate_receive_date} editable />
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{mat.estimateDisplay} <LockIcon /></span>
                    )}
                  </td>
                  <td>
                    {isPurchaser ? (
                      <DateField action={updateMaterialDate} hidden={{ poId: po.id, material: mat.material, field: "actual_receive_date" }} value={mat.actual_receive_date} editable />
                    ) : (
                      mat.actualDisplay
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
