import { requireSession } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import { createPo } from "@/app/po/actions";

const ITEM_ROWS = 4;

function ItemRows({ prefix }: { prefix: "table" | "chair" }) {
  return (
    <>
      {Array.from({ length: ITEM_ROWS }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
          <input className="input" name={`${prefix}_model_${i}`} placeholder="Model name" style={{ flex: 1, boxSizing: "border-box" }} />
          <input className="input" type="number" name={`${prefix}_qty_${i}`} placeholder="Qty" style={{ width: 90, boxSizing: "border-box" }} />
        </div>
      ))}
    </>
  );
}

export default async function NewPoPage() {
  const { role } = await requireSession();
  const isPpc = role === "ppc";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar role={role} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 28px 60px", width: "100%" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500, marginBottom: 6 }}>New PO</div>
        <div style={{ color: "var(--color-neutral-600)", fontSize: 13, marginBottom: 22 }}>One PO = one export container.</div>

        {!isPpc && (
          <div className="card elev-sm" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, color: "var(--color-neutral-700)", fontSize: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-accent-700)", flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /></svg>
            Read-only for Purchaser — only PPC creates and edits PO master data.
          </div>
        )}

        {isPpc && (
          <form action={createPo} className="card elev-sm" style={{ padding: 24 }}>
            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12 }}>PO Number</label>
              <input className="input" name="po_number" required style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
            <div className="field" style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12 }}>Customer</label>
              <input className="input" name="customer" placeholder="Customer name" required style={{ width: "100%", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 6, color: "var(--color-neutral-600)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em" }}>Table models</div>
            <ItemRows prefix="table" />

            <div style={{ marginBottom: 6, marginTop: 10, color: "var(--color-neutral-600)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em" }}>Chair models</div>
            <ItemRows prefix="chair" />

            <div className="field" style={{ margin: "22px 0" }}>
              <label style={{ fontSize: 12 }}>Planned Date</label>
              <input className="input" type="date" name="target_ship_date" required style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
            <button type="submit" className="btn btn-primary btn-block">Save PO</button>
          </form>
        )}
      </div>
    </div>
  );
}
