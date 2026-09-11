import Link from "next/link";
import type { Badge, PendingRm } from "@/lib/mrp";

export type PlannedCardData = Badge & {
  id: string;
  po_number: string;
  shipDateLabel: string;
  shipDateDisplay: string;
  isLate: boolean;
  pendingRm: PendingRm[];
};

// Same red X the board uses for "no date entered".
const CrossIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden>
    <circle cx="12" cy="12" r="11" fill="var(--mrp-red)" />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="white" strokeWidth="2.75" strokeLinecap="round" />
  </svg>
);

export default function PlannedCard({ po }: { po: PlannedCardData }) {
  return (
    <Link href={`/po/${po.id}`} className="card elev-sm" style={{ padding: "16px 18px", cursor: "pointer", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16.8, fontWeight: 600 }}>{po.po_number}</div>
        <div style={{ color: po.isLate ? "var(--mrp-red)" : "var(--color-neutral-500)", fontSize: 16.5, marginTop: 8 }}>
          {po.shipDateLabel}: {po.shipDateDisplay}{po.isLate && " — past ship date"}
        </div>
        <div style={{ display: "inline-block", marginTop: 10, padding: "4px 10px", fontSize: 11, fontWeight: 600, border: `1px solid ${po.badgeBorder}`, background: po.badgeBg, color: po.badgeColor, whiteSpace: "nowrap" }}>
          {po.statusLabel}
        </div>
      </div>
      {po.pendingRm.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          {po.pendingRm.map((m) => (
            <span key={m.label} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13.2, whiteSpace: "nowrap", color: m.overdue ? "var(--mrp-red)" : "var(--color-neutral-600)" }}>
              <CrossIcon />{m.label} · {m.display}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
