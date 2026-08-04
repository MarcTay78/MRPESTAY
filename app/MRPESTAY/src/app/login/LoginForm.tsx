"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action}>
      <div className="field" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>Email</label>
        <input
          className="input"
          name="email"
          type="email"
          required
          autoComplete="username"
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div className="field" style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12 }}>Password</label>
        <input
          className="input"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>

      {state?.error && (
        <div style={{ color: "var(--mrp-red)", fontSize: 12, marginBottom: 14 }}>
          {state.error}
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
