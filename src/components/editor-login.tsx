"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function EditorLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }
    router.replace("/edit");
    router.refresh();
  }

  return (
    <main className="login-page">
      <Link className="login-back" href="/">← Public timeline</Link>
      <section className="login-card">
        <div className="login-index">[OWNER / 01]</div>
        <div className="login-icon"><LockKeyhole size={22} /></div>
        <h1>Timeline editor</h1>
        <p>Update placements, item details, connections, color signals, and media artifacts.</p>
        <form onSubmit={submit}>
          <label htmlFor="password">Access password</label>
          <div className="login-input-row">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoFocus
            />
            <button type="submit" disabled={loading || !password} aria-label="Open editor">
              <ArrowRight size={18} />
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}
