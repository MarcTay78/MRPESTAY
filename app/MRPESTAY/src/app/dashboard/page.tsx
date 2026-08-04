import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { fetchPos } from "@/lib/data";
import { buildPo } from "@/lib/mrp";
import NavBar from "@/components/NavBar";

export default async function DashboardPage() {
  const { supabase, role } = await requireSession();
  const raw = await fetchPos(supabase);
  const pos = raw.map(buildPo);

  const plannedPos = pos.filter((p) => !p.actual_ship_date);
  const shippedPos = pos.filter((p) => !!p.actual_ship_date);
  const onTrackCount = plannedPos.filter((p) => p.status === "green").length;
  const lateCount = plannedPos.filter((p) => p.status === "red").length;

  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7); // YYYY-MM
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shippedThisMonthCount = shippedPos.filter((p) => p.actual_ship_date?.startsWith(monthPrefix)).length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar role={role} />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 60px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>Dashboard</div>
            <div style={{ color: "var(--color-neutral-600)", fontSize: 13, marginTop: 4 }}>
              Ship-date risk at a glance — {role === "ppc" ? "PPC" : "Purchaser"} view
            </div>
          </div>
          <Link href="/po/new" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New PO
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
          <div className="card elev-sm" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--mrp-green)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.2 2.2 4.8-5.4" /></svg>On Track
            </div>
            <div style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 500 }}>{onTrackCount}</div>
            <div style={{ color: "var(--color-neutral-600)", fontSize: 12, marginTop: 4 }}>pre-ship containers</div>
          </div>
          <div className="card elev-sm" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--mrp-red)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20L12 3z" /><line x1="12" y1="9" x2="12" y2="14" /></svg>Late
            </div>
            <div style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 500 }}>{lateCount}</div>
            <div style={{ color: "var(--color-neutral-600)", fontSize: 12, marginTop: 4 }}>past target ship date</div>
          </div>
          <div className="card elev-sm" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-neutral-700)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></svg>Shipped This Month
            </div>
            <div style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 500 }}>{shippedThisMonthCount}</div>
            <div style={{ color: "var(--color-neutral-600)", fontSize: 12, marginTop: 4 }}>{monthLabel}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12" /><path d="M6 21h12" /><path d="M8 3c0 5 8 5 8 0" /><path d="M8 21c0-5 8-5 8 0" /></svg>
          <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Planned</div>
          <span className="tag tag-outline" style={{ fontSize: 11 }}>{plannedPos.length}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 36 }}>
          {plannedPos.map((po) => (
            <Link key={po.id} href={`/po/${po.id}`} className="card elev-sm" style={{ padding: "16px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{po.po_number}</div>
                <div style={{ color: "var(--color-neutral-600)", fontSize: 12, marginTop: 2 }}>{po.customer}</div>
                <div style={{ color: "var(--color-neutral-500)", fontSize: 11, marginTop: 8 }}>Target ship: {po.targetShipDisplay}</div>
              </div>
              <div style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: `1px solid ${po.badgeBorder}`, background: po.badgeBg, color: po.badgeColor, whiteSpace: "nowrap", flexShrink: 0 }}>
                {po.statusLabel}
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M8 12l3 3 5-6" /></svg>
          <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Shipped</div>
          <span className="tag tag-outline" style={{ fontSize: 11 }}>{shippedPos.length}</span>
        </div>
        <div className="card elev-sm" style={{ overflow: "hidden" }}>
          <table className="table" style={{ width: "100%" }}>
            <thead><tr><th>PO</th><th>Customer</th><th>Target Ship</th><th>Actual Ship</th><th>Status</th></tr></thead>
            <tbody>
              {shippedPos.map((po) => (
                <tr key={po.id}>
                  <td><Link href={`/po/${po.id}`}>{po.po_number}</Link></td>
                  <td>{po.customer}</td>
                  <td>{po.targetShipDisplay}</td>
                  <td>{po.actualShipDisplay}</td>
                  <td><span className="tag tag-neutral" style={{ fontSize: 11 }}>Shipped</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
