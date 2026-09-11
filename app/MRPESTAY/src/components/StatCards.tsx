const LABEL_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14.3,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 10,
} as const;

function Stat({ label, color, icon, value, note }: { label: string; color: string; icon: React.ReactNode; value: number; note: string }) {
  return (
    <div className="card elev-sm" style={{ padding: 20 }}>
      <div style={{ ...LABEL_STYLE, color }}>{icon}{label}</div>
      <div style={{ fontSize: 34, fontFamily: "var(--font-heading)", fontWeight: 500 }}>{value}</div>
      <div style={{ color: "var(--color-neutral-600)", fontSize: 12, marginTop: 4 }}>{note}</div>
    </div>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function StatCards({
  ready, inProgress, pendingMaterial, shippedThisMonth, monthLabel,
}: {
  ready: number;
  inProgress: number;
  pendingMaterial: number;
  shippedThisMonth: number;
  monthLabel: string;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
      <Stat
        label="Ready" color="var(--mrp-green)" value={ready} note="pre-ship containers"
        icon={<svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.2 2.2 4.8-5.4" /></svg>}
      />
      <Stat
        label="In Progress" color="var(--mrp-yellow)" value={inProgress} note="on the floor"
        icon={<svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.3l3.3 2" /></svg>}
      />
      <Stat
        label="Pending Material" color="var(--mrp-red)" value={pendingMaterial} note="waiting on purchasing"
        icon={<svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><path d="M12 3 2 20h20L12 3z" /><line x1="12" y1="9" x2="12" y2="14" /></svg>}
      />
      <Stat
        label="Shipped This Month" color="var(--color-neutral-700)" value={shippedThisMonth} note={monthLabel}
        icon={<svg width="15" height="15" viewBox="0 0 24 24" {...stroke}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></svg>}
      />
    </div>
  );
}
