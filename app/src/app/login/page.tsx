import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card elev-md" style={{ width: 380, padding: "36px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="8" height="8" />
            <rect x="13" y="13" width="8" height="8" />
            <rect x="13" y="3" width="8" height="8" />
          </svg>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 500, fontSize: 20 }}>ESTAY MRP</div>
        </div>
        <div style={{ color: "var(--color-neutral-700)", fontSize: 13, marginBottom: 26 }}>
          Solid Wood Dining Set Production Tracker
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
