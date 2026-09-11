import Link from "next/link";
import type { CSSProperties } from "react";
import { requireSession } from "@/lib/auth";
import { fetchPos } from "@/lib/data";
import { buildPo, type BuiltPo } from "@/lib/mrp";
import NavBar from "@/components/NavBar";

const COLUMN_HEADERS = ["Table WP", "Chair WP", "Finishing", "Packing"];

// green check = actual date entered, yellow clock = only a plan/target date set, red X = no date at all.
// Color + glyph both encode status so it reads at a glance, including for color-blind users.
function StatusDot({ hasActual, hasTarget }: { hasActual: boolean; hasTarget: boolean }) {
  const color = hasActual ? "var(--mrp-green)" : hasTarget ? "var(--mrp-yellow)" : "var(--mrp-red)";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill={color} />
      {hasActual ? (
        <path d="M7 12.5l3.2 3.2L17.5 8.5" stroke="white" strokeWidth="2.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : hasTarget ? (
        <path d="M12 7v5.3l3.3 2" stroke="white" strokeWidth="2.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="white" strokeWidth="2.75" strokeLinecap="round" />
      )}
    </svg>
  );
}

function WpRmCell({
  items,
}: {
  items: { id: string; model: string; target: string; actual: string; hasActual: boolean; rm: { id: string; model: string; display: string; hasActual: boolean; target_date: string | null }[] }[];
}) {
  return (
    <div style={{ padding: "10px 10px" }}>
      {items.map((mi) => (
        <div key={mi.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 15.72, fontWeight: 600 }}>
            <StatusDot hasActual={mi.hasActual} hasTarget={mi.target !== "—"} />{mi.model}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 15, color: mi.hasActual ? "var(--color-accent-700)" : "var(--color-neutral-700)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /></svg>{mi.hasActual ? mi.actual : mi.target}
          </div>
          {mi.rm.length > 0 && (
            <div style={{ marginTop: 4, paddingLeft: 9, borderLeft: "2px solid var(--color-neutral-200)" }}>
              {mi.rm.map((r) => (
                <div key={r.id} style={{ marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13.8, fontWeight: 600, color: "var(--color-neutral-700)" }}>
                    <StatusDot hasActual={r.hasActual} hasTarget={!!r.target_date} />{r.model}
                  </div>
                  <div style={{ fontSize: 13.8, paddingLeft: 18, color: r.hasActual ? "var(--color-accent-700)" : "var(--color-neutral-500)" }}>
                    {r.display}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SingleCell({ target, actual, hasActual }: { target: string; actual: string; hasActual: boolean }) {
  const hasTarget = target !== "—";
  return (
    <div style={{ padding: "10px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 15.72, color: hasActual ? "var(--color-accent-700)" : "var(--color-neutral-700)" }}>
        <StatusDot hasActual={hasActual} hasTarget={hasTarget} />{hasActual ? actual : target}
      </div>
    </div>
  );
}

type DateRow = { label: string; display: string; isActual: boolean };

function QcShipCell({ rows }: { rows: DateRow[] }) {
  return (
    <div style={{ padding: "10px 10px" }}>
      {rows.map((r, i) => {
        const important = r.label !== "Plan Date";
        return (
          <div
            key={r.label}
            style={{
              marginTop: i === 0 ? 0 : 6,
              padding: important ? "3px 6px" : 0,
              background: important ? "color-mix(in oklch, var(--mrp-yellow) 14%, transparent)" : "transparent",
              borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 12.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--color-neutral-500)" }}>{r.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 15.72, fontWeight: important ? 700 : 400, color: r.isActual ? "var(--color-accent-700)" : "var(--color-neutral-700)" }}>
              <StatusDot hasActual={r.isActual} hasTarget={r.display !== "—"} />{r.display}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BoardRow({ po, idx }: { po: BuiltPo; idx: number }) {
  const rowBg = idx % 2 === 0 ? "var(--color-bg)" : "var(--color-surface)";
  const finishing = po.lines.find((l) => l.line === "finishing")!;
  const packing = po.lines.find((l) => l.line === "packing")!;
  const qc = po.lines.find((l) => l.line === "qc")!;

  // Only show QC/Ship once a date's actually been entered for it. If
  // neither has, fall back to a single Plan Date row instead of repeating
  // it once per missing field.
  const qcHasOwnDate = !!(qc.actual_date || qc.target_date);
  const qcIsActual = !!qc.actual_date;
  const shipHasOwnDate = !!(po.actual_ship_date || po.target_ship_date);
  const shipIsActual = !!po.actual_ship_date;

  const dateRows: DateRow[] = [];
  if (qcHasOwnDate) dateRows.push({ label: "QC", display: qcIsActual ? qc.actualDisplay : qc.targetDisplay, isActual: qcIsActual });
  if (shipHasOwnDate) dateRows.push({ label: "Ship", display: shipIsActual ? po.actualShipDisplay : po.targetShipDisplay, isActual: shipIsActual });
  if (!qcHasOwnDate && !shipHasOwnDate) dateRows.push({ label: "Plan Date", display: po.planDateDisplay, isActual: false });

  return (
    <>
      <Link
        href={`/po/${po.id}?from=board`}
        style={{ padding: "10px 10px", borderBottom: "1px solid var(--color-neutral-200)", background: rowBg, position: "sticky", left: 0 }}
      >
        <div style={{ fontSize: 18.72, fontWeight: 600 }}>{po.po_number}</div>
        <div style={{ fontSize: 16.5, color: "var(--color-neutral-600)" }}>{po.customer}</div>
        <div style={{ fontSize: 15, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {dateRows.map((r) => {
            const important = r.label !== "Plan Date";
            return (
              <span
                key={r.label}
                style={{
                  fontWeight: important ? 700 : 400,
                  padding: important ? "2px 6px" : 0,
                  background: important ? "color-mix(in oklch, var(--mrp-yellow) 14%, transparent)" : "transparent",
                  borderRadius: 4,
                  color: r.isActual ? "var(--color-accent-700)" : "var(--color-neutral-700)",
                }}
              >
                {r.label}: {r.display}
              </span>
            );
          })}
        </div>
      </Link>
      <div style={{ background: rowBg, borderBottom: "1px solid var(--color-neutral-200)" }}>
        <WpRmCell items={po.tableItems.map((i) => ({ id: i.id, model: i.model, target: i.whiteTargetDisplay, actual: i.whiteActualDisplay, hasActual: i.hasWhiteActual, rm: i.rm }))} />
      </div>
      <div style={{ background: rowBg, borderBottom: "1px solid var(--color-neutral-200)" }}>
        <WpRmCell items={po.chairItems.map((i) => ({ id: i.id, model: i.model, target: i.whiteTargetDisplay, actual: i.whiteActualDisplay, hasActual: i.hasWhiteActual, rm: i.rm }))} />
      </div>
      <div style={{ background: rowBg, borderBottom: "1px solid var(--color-neutral-200)" }}>
        <SingleCell target={finishing.targetDisplay} actual={finishing.actualDisplay} hasActual={!!finishing.actual_date} />
      </div>
      <div style={{ background: rowBg, borderBottom: "1px solid var(--color-neutral-200)" }}>
        <SingleCell target={packing.targetDisplay} actual={packing.actualDisplay} hasActual={!!packing.actual_date} />
      </div>
      <div style={{ background: rowBg, borderBottom: "1px solid var(--color-neutral-200)" }}>
        <QcShipCell rows={dateRows.filter((r) => r.label !== "Plan Date")} />
      </div>
    </>
  );
}

type SortKey = "po" | "qc" | "ship";
type SortDir = "asc" | "desc";
type Tab = "all" | "green" | "open";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "green", label: "Ready" },
  { key: "open", label: "On-Going" },
];

function sortKeyValue(po: BuiltPo, sort: SortKey): string {
  if (sort === "po") return po.po_number;
  if (sort === "qc") return po.lines.find((l) => l.line === "qc")?.target_date ?? "9999-99-99";
  return po.target_ship_date ?? "9999-99-99";
}

function SortHeader({
  label, sortKey, active, dir, tab, style,
}: { label: string; sortKey: SortKey; active: SortKey; dir: SortDir; tab: Tab; style: CSSProperties }) {
  const isActive = sortKey === active;
  const nextDir: SortDir = isActive && dir === "asc" ? "desc" : "asc";
  return (
    <Link href={`/board?tab=${tab}&sort=${sortKey}&dir=${nextDir}`} style={{ ...style, color: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
      {label}
      {isActive && <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span>}
    </Link>
  );
}

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ sort?: string; dir?: string; tab?: string }> }) {
  const { sort: sortParam, dir: dirParam, tab: tabParam } = await searchParams;
  const sort: SortKey = sortParam === "po" || sortParam === "ship" ? sortParam : "qc";
  const dir: SortDir = dirParam === "desc" ? "desc" : "asc";
  const tab: Tab = tabParam === "green" || tabParam === "open" ? tabParam : "all";
  const { supabase, role } = await requireSession();
  const raw = await fetchPos(supabase);
  const plannedPos = raw
    .map(buildPo)
    .filter((p) => !p.actual_ship_date)
    .sort((a, b) => sortKeyValue(a, sort).localeCompare(sortKeyValue(b, sort)) * (dir === "desc" ? -1 : 1));

  const counts = {
    all: plannedPos.length,
    green: plannedPos.filter((p) => p.allGreen).length,
    open: plannedPos.filter((p) => !p.allGreen).length,
  };
  const visiblePos = tab === "all" ? plannedPos : plannedPos.filter((p) => (tab === "green" ? p.allGreen : !p.allGreen));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar role={role} />
      <div style={{ padding: "32px 28px 60px", width: "100%" }}>
        <div style={{ marginBottom: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 31.2, fontWeight: 500 }}>Production Board</div>
          <div className="seg">
            {TABS.map((t) => {
              const isActive = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={`/board?tab=${t.key}&sort=${sort}&dir=${dir}`}
                  className="seg-opt"
                  style={{
                    color: isActive ? "var(--color-bg)" : "var(--color-text)",
                    background: isActive ? "var(--color-accent)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {t.label} <span style={{ opacity: 0.7 }}>({counts[t.key]})</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ overflow: "auto", maxHeight: "calc(100vh - 170px)" }}>
          {/* Old pixel widths are now the minmax minimums: columns stretch to
              fill a wide screen, and still overflow-scroll on a narrow one. */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.5fr) repeat(2,minmax(190px,1.6fr)) repeat(2,minmax(130px,1fr)) minmax(150px,1.1fr)" }}>
            <SortHeader
              label="PO / Customer"
              sortKey="po"
              active={sort}
              dir={dir}
              tab={tab}
              style={{ padding: "8px 10px", fontSize: 16.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "2px solid var(--color-text)", position: "sticky", top: 0, left: 0, zIndex: 3, background: "var(--color-bg)" }}
            />
            {COLUMN_HEADERS.map((label) => (
              <div key={label} style={{ padding: "8px 10px", fontSize: 16.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "2px solid var(--color-text)", position: "sticky", top: 0, zIndex: 2, background: "var(--color-bg)" }}>
                {label}
              </div>
            ))}
            <div style={{ padding: "8px 10px", borderBottom: "2px solid var(--color-text)", display: "flex", gap: 6, position: "sticky", top: 0, zIndex: 2, background: "var(--color-bg)" }}>
              <SortHeader label="QC" sortKey="qc" active={sort} dir={dir} tab={tab} style={{ fontSize: 16.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }} />
              <span style={{ color: "var(--color-neutral-400)" }}>/</span>
              <SortHeader label="Ship" sortKey="ship" active={sort} dir={dir} tab={tab} style={{ fontSize: 16.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }} />
            </div>
            {visiblePos.map((po, idx) => (
              <BoardRow key={po.id} po={po} idx={idx} />
            ))}
          </div>
          {visiblePos.length === 0 && (
            <div style={{ padding: "18px 10px", fontSize: 15.6, color: "var(--color-neutral-500)" }}>
              No POs in this tab.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
