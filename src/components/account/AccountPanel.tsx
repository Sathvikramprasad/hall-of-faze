"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { announceAuthChange } from "@/lib/client-auth";
import type { AccountUser } from "@/types";
import ChannelsSection from "@/components/profile/ChannelsSection";
import MyClips from "@/components/profile/MyClips";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ResetPasswordForm from "@/components/profile/ResetPasswordForm";
import SecuritySection from "@/components/profile/SecuritySection";
import VerifyEmailCard from "@/components/profile/VerifyEmailCard";

type Mode = "login" | "register" | "forgot";
type AuthEnvelope = {
  success: boolean;
  data?: { user: AccountUser; authenticated?: boolean; message?: string; verificationEmailSent?: boolean };
  error?: { message?: string };
};

export default function AccountPanel({
  nextPath = null,
  initialMode = "login",
}: {
  nextPath?: string | null;
  initialMode?: Extract<Mode, "login" | "register">;
}) {
  const router = useRouter();
  const ids = { name: useId(), email: useId(), password: useId() };
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>(initialMode);
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
      if (body.data.user.emailVerified && nextPath) {
        setMessage("Signed in. Redirecting…");
        router.replace(nextPath);
        router.refresh();
      } else {
        setMessage(
          mode === "register" && !body.data.user.emailVerified && body.data.verificationEmailSent === false
            ? "Account created, but we couldn't send the email. Use “Send a new code”."
            : null,
        );
      }
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
      setMode("login");
      announceAuthChange();
      setMessage("Signed out.");
    } catch {
      setMessage("Could not sign out. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Shell title="My Profile"><p className="text-muted">Checking your session…</p></Shell>;

  if (user && !user.emailVerified) {
    return (
      <Shell title="Almost there" subtitle="Verify your email to start uploading clips and voting.">
        <VerifyEmailCard
          user={user}
          initialNote={message}
          onVerified={(verified) => {
            setUser(verified);
            setMessage(null);
            announceAuthChange();
            if (nextPath) {
              router.replace(nextPath);
              router.refresh();
            }
          }}
          onSignOut={signOut}
        />
      </Shell>
    );
  }

  if (user) {
    return (
      <Shell title="My Profile" wide>
        <div className="flex flex-col gap-6">
          <ProfileHeader user={user} onUserChange={setUser} onSignOut={signOut} signingOut={busy} />
          <ChannelsSection user={user} onUserChange={setUser} />
          <MyClips />
          <SecuritySection email={user.email} />
          {user.role === "moderator" && (
            <a href="/admin/clips" className="self-start rounded-lg border border-white/20 px-4 py-2 text-sm">Open moderation</a>
          )}
        </div>
      </Shell>
    );
  }

  if (mode === "forgot") {
    return (
      <Shell title="Reset your password" subtitle="We'll email you a 6-digit code.">
        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <ResetPasswordForm
            onCancel={() => { setMode("login"); setMessage(null); }}
            onDone={(done) => { setMode("login"); setMessage(done); }}
          />
        </section>
      </Shell>
    );
  }

  const fieldClass = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2";
  return (
    <Shell title="Sign in" subtitle="One account powers clip uploads, community votes, and moderator access.">
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
        <div><label htmlFor={ids.password} className="mb-1 block text-sm font-medium">Password</label><input id={ids.password} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className={fieldClass} value={password} onChange={(event) => setPassword(event.target.value)} minLength={mode === "register" ? 12 : undefined} maxLength={128} required /><div className="mt-1 flex justify-between text-xs text-muted"><span>{mode === "register" ? "Use at least 12 characters." : ""}</span>{mode === "login" && <button type="button" onClick={() => { setMode("forgot"); setMessage(null); }} className="font-semibold underline underline-offset-2">Forgot password?</button>}</div></div>
        {mode === "register" && <p className="text-xs text-muted">We&apos;ll email you a code to verify your address.</p>}
        {message && <p role="alert" className="text-sm text-amber-300">{message}</p>}
        <button type="submit" disabled={busy} className="rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
    </section>
    </Shell>
  );
}

function Shell({ title, subtitle, wide = false, children }: { title: string; subtitle?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "w-full" : "mx-auto w-full max-w-xl"}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}
