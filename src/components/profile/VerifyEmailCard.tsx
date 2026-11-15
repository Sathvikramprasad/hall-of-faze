"use client";

import { useId, useState, type FormEvent } from "react";
import { postJson, type UserResult } from "@/components/profile/api";
import type { AccountUser } from "@/types";

/** Shown after sign-up until the emailed code is entered. Nothing else on the site works before that. */
export default function VerifyEmailCard({ user, onVerified, onSignOut, initialNote }: { user: AccountUser; onVerified: (user: AccountUser) => void; onSignOut: () => void; initialNote?: string | null }) {
  const id = useId();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(initialNote ? { tone: "ok", text: initialNote } : null);

  async function verify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const result = await postJson<UserResult>("/api/auth/verify-email", { code });
      onVerified(result.user);
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setNote(null);
    try {
      const result = await postJson<{ message: string; devMode?: boolean }>("/api/auth/verify-email/resend");
      setNote({ tone: "ok", text: result.devMode ? `${result.message} (Dev mode: the code is in the server console.)` : result.message });
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6">
      <h2 className="text-xl font-bold">Verify your email</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        We sent a 6-digit code to <strong className="text-foreground">{user.email}</strong>. Enter it to finish creating your account. The code expires in 15 minutes.
      </p>
      <form onSubmit={verify} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor={id} className="mb-1 block text-sm font-medium">Verification code</label>
          <input
            id={id}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            placeholder="123456"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-lg tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={busy} className="rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? "Checking…" : "Verify email"}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <button type="button" onClick={resend} disabled={busy} className="font-semibold text-muted underline underline-offset-2 disabled:opacity-50">Send a new code</button>
        <button type="button" onClick={onSignOut} disabled={busy} className="text-muted underline underline-offset-2">Wrong email? Sign out</button>
      </div>
      {note && <p role={note.tone === "error" ? "alert" : "status"} className={`mt-4 text-sm ${note.tone === "error" ? "text-amber-300" : "text-muted"}`}>{note.text}</p>}
    </section>
  );
}
