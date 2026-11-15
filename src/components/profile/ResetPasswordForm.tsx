"use client";

import { useId, useState, type FormEvent } from "react";
import { postJson } from "@/components/profile/api";

const fieldClass = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2";

/**
 * Two steps: email a 6-digit code, then enter it with a new password.
 * Signed in (`email` given): the code goes to the account's email.
 * Signed out: asks for the email first ("Forgot password?").
 */
export default function ResetPasswordForm({ email: accountEmail, onDone, onCancel }: { email?: string; onDone: (message: string) => void; onCancel: () => void }) {
  const ids = { email: useId(), code: useId(), password: useId(), confirm: useId() };
  const [email, setEmail] = useState(accountEmail ?? "");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const result = await postJson<{ message: string; devMode?: boolean }>(
        "/api/auth/password-reset/request",
        accountEmail ? {} : { email },
      );
      setStep("confirm");
      setNote({ tone: "ok", text: result.devMode ? `${result.message} (Dev mode: the code is in the server console.)` : result.message });
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function reset(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) return setNote({ tone: "error", text: "The two passwords don't match." });
    setBusy(true);
    setNote(null);
    try {
      const result = await postJson<{ message: string }>("/api/auth/password-reset/confirm", {
        ...(accountEmail ? {} : { email }),
        code,
        newPassword: password,
      });
      onDone(result.message);
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {step === "request" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          {accountEmail ? (
            <p className="text-sm text-muted">We&apos;ll email a 6-digit code to <strong className="text-foreground">{accountEmail}</strong>.</p>
          ) : (
            <div>
              <label htmlFor={ids.email} className="mb-1 block text-sm font-medium">Email</label>
              <input id={ids.email} type="email" autoComplete="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white disabled:opacity-50">
              {busy ? "Sending…" : "Email me a code"}
            </button>
            <button type="button" onClick={onCancel} className="rounded-lg border border-white/20 px-4 py-2">Cancel</button>
          </div>
        </form>
      ) : (
        <form onSubmit={reset} className="flex flex-col gap-4">
          <div>
            <label htmlFor={ids.code} className="mb-1 block text-sm font-medium">6-digit code</label>
            <input id={ids.code} inputMode="numeric" autoComplete="one-time-code" maxLength={7} className={`${fieldClass} font-mono tracking-[0.4em]`} value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label htmlFor={ids.password} className="mb-1 block text-sm font-medium">New password</label>
            <input id={ids.password} type="password" autoComplete="new-password" minLength={12} maxLength={128} className={fieldClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p className="mt-1 text-xs text-muted">Use at least 12 characters.</p>
          </div>
          <div>
            <label htmlFor={ids.confirm} className="mb-1 block text-sm font-medium">Confirm new password</label>
            <input id={ids.confirm} type="password" autoComplete="new-password" minLength={12} maxLength={128} className={fieldClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy} className="rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white disabled:opacity-50">
              {busy ? "Saving…" : "Set new password"}
            </button>
            <button type="button" onClick={() => sendCode()} disabled={busy} className="text-sm font-semibold text-muted underline underline-offset-2">Send a new code</button>
            <button type="button" onClick={onCancel} className="text-sm text-muted">Cancel</button>
          </div>
        </form>
      )}
      {note && <p role={note.tone === "error" ? "alert" : "status"} className={`text-sm ${note.tone === "error" ? "text-amber-300" : "text-muted"}`}>{note.text}</p>}
    </div>
  );
}
