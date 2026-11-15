"use client";

import { useState } from "react";
import ResetPasswordForm from "@/components/profile/ResetPasswordForm";

export default function SecuritySection({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Password</h2>
          <p className="mt-1 text-sm text-muted">Reset it with a code sent to your email.</p>
        </div>
        {!open && (
          <button type="button" onClick={() => { setOpen(true); setDone(null); }} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/40">
            Reset password
          </button>
        )}
      </div>
      {open && (
        <div className="mt-5">
          <ResetPasswordForm email={email} onCancel={() => setOpen(false)} onDone={(message) => { setOpen(false); setDone(message); }} />
        </div>
      )}
      {done && <p role="status" className="mt-4 text-sm text-emerald-300">{done}</p>}
    </section>
  );
}
