"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Role } from "@/lib/mrp";
import { logout } from "@/app/actions";

function navStyle(active: boolean) {
  return {
    color: active ? "var(--color-text)" : "var(--color-neutral-600)",
    fontWeight: active ? 600 : 400,
  };
}

export default function NavBar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav className="nav" style={{ position: "sticky", top: 0, zIndex: 20 }}>
      <span className="nav-brand">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="8" height="8" />
          <rect x="13" y="13" width="8" height="8" />
          <rect x="13" y="3" width="8" height="8" />
        </svg>
        ESTAY MRP
      </span>
      <Link href="/dashboard" style={navStyle(pathname === "/dashboard")}>Dashboard</Link>
      <Link href="/board" style={navStyle(pathname === "/board")}>Production Board</Link>
      <Link href="/po/new" style={navStyle(pathname === "/po/new")}>New PO</Link>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span className="tag tag-outline" style={{ fontSize: 11 }}>
          {role === "ppc" ? "PPC" : "Purchaser"}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="btn btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </form>
      </div>
    </nav>
  );
}
