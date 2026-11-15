"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { announceAuthChange } from "@/lib/client-auth";
import type { AccountUser } from "@/types";

type Mode = "login" | "register";
type AuthEnvelope = {
  success: boolean;
  data?: { user: AccountUser; authenticated?: boolean; message?: string };
  error?: { message?: string };
};

export default function AccountPanel() {
  const ids = { name: useId(), email: useId(), password: useId() };
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/me", { cache: "no-store" })
      .then(async (response) => ({ response, body: (await response.json()) as AuthEnvelope }))
      .then(({ response, body }) => {
        if (!cancelled && response.ok && body.data?.user) setUser(body.data.user);
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not check your session.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(mode === "register" ? { displayName } : {}) }),
      });
      const body = (await response.json()) as AuthEnvelope;
      if (!response.ok || !body.success || !body.data?.user) {
        setMessage(body.error?.message ?? "Authentication failed.");
        return;
      }
      if (body.data.authenticated === false) {
        setMode("login");
        setPassword("");
        setMessage(body.data.message ?? "Account created. Sign in to continue.");
        return;
      }
      setUser(body.data.user);
      announceAuthChange();
      setPassword("");
      setMessage("Signed in.");
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout failed");
      setUser(null);
      announceAuthChange();
      setMessage("Signed out.");
    } catch {
      setMessage("Could not sign out. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-muted">Checking your session…</p>;
  if (user) {
    return (
      <section className="rounded-2xl border border-white/10 bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xl font-bold">{user.displayName}</p>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{user.role}</p>
          </div>
          <button type="button" onClick={signOut} disabled={busy} className="rounded-lg border border-white/20 px-4 py-2 disabled:opacity-50">
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/upload" className="rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white">Upload a clip</Link>
          {user.role === "moderator" && <Link href="/admin/clips" className="rounded-lg border border-white/20 px-4 py-2">Open moderation</Link>}
        </div>
        {message && <p role="status" className="mt-4 text-sm text-muted">{message}</p>}
      </section>
    );
  }

  const fieldClass = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2";
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6">
      <div className="mb-6 flex rounded-lg bg-black/20 p-1" role="tablist" aria-label="Account action">
        {(["login", "register"] as const).map((nextMode) => (
          <button key={nextMode} type="button" role="tab" aria-selected={mode === nextMode} onClick={() => { setMode(nextMode); setMessage(null); }} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${mode === nextMode ? "bg-accent-fill text-white" : "text-muted"}`}>
            {nextMode === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === "register" && (
          <div><label htmlFor={ids.name} className="mb-1 block text-sm font-medium">Display name</label><input id={ids.name} className={fieldClass} value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={50} required /></div>
        )}
        <div><label htmlFor={ids.email} className="mb-1 block text-sm font-medium">Email</label><input id={ids.email} type="email" autoComplete="email" className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div><label htmlFor={ids.password} className="mb-1 block text-sm font-medium">Password</label><input id={ids.password} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className={fieldClass} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 12 : undefined} maxLength={128} required /><p className="mt-1 text-xs text-muted">{mode === "register" ? "Use at least 12 characters." : ""}</p></div>
        {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}
        <button type="submit" disabled={busy} className="rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
    </section>
  );
}
