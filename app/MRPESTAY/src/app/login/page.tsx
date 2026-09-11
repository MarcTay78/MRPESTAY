import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchPublicOverview } from "@/lib/data";
import PlannedCard from "@/components/PlannedCard";
import StatCards from "@/components/StatCards";

// Public landing page: the dashboard's top cards and Planned list, readable
// without a session. Everything else is behind the Log In button.
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const { planned, shippedThisMonth } = await fetchPublicOverview(supabase);
  const count = (s: string) => planned.filter((p) => p.statusLabel === s).length;
  const lateCount = planned.filter((p) => p.isLate).length;
  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px 60px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>ESTAY MRP</div>
            <div style={{ color: "var(--color-neutral-600)", fontSize: 13, marginTop: 4 }}>
              Solid Wood Dining Set Production Tracker
            </div>
          </div>
          <Link href="/login/signin" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h6v18h-6" />
            </svg>
            Log In
          </Link>
        </div>

        <StatCards
          ready={count("Ready")}
          inProgress={count("In Progress")}
          pendingMaterial={count("Pending Material")}
          shippedThisMonth={shippedThisMonth}
          monthLabel={monthLabel}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12" /><path d="M6 21h12" /><path d="M8 3c0 5 8 5 8 0" /><path d="M8 21c0-5 8-5 8 0" /></svg>
          <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--font-heading)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Planned</div>
          <span className="tag tag-outline" style={{ fontSize: 11 }}>{planned.length}</span>
          {lateCount > 0 && (
            <span style={{ fontSize: 11, color: "var(--mrp-red)" }}>{lateCount} past ship date</span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {planned.map((po) => (
            <PlannedCard key={po.id} po={po} />
          ))}
        </div>
        {planned.length === 0 && (
          <div style={{ color: "var(--color-neutral-500)", fontSize: 13 }}>No planned POs.</div>
        )}
      </div>
    </div>
  );
}
