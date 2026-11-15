"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { VerifiedBadge } from "@/components/creator/CreatorBadges";
import Avatar from "@/components/profile/Avatar";
import { call, postJson, type UserResult } from "@/components/profile/api";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES } from "@/lib/avatar-rules";
import type { AccountUser } from "@/types";

/** Picture (upload / remove), editable display name, email and role. */
export default function ProfileHeader({ user, onUserChange, onSignOut, signingOut }: { user: AccountUser; onUserChange: (user: AccountUser) => void; onSignOut: () => void; signingOut: boolean }) {
  const nameId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.displayName);
  const [busy, setBusy] = useState<"name" | "avatar" | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function saveName(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === user.displayName) return setEditing(false);
    setBusy("name");
    setNote(null);
    try {
      const result = await postJson<UserResult>("/api/user/me", { displayName: trimmed }, "PATCH");
      onUserChange(result.user);
      setEditing(false);
      setNote({ tone: "ok", text: "Name updated." });
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > AVATAR_MAX_BYTES) return setNote({ tone: "error", text: "Pictures must be 2 MB or smaller." });
    setBusy("avatar");
    setNote(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await call<UserResult>("/api/user/avatar", { method: "PUT", body: form });
      onUserChange(result.user);
      setNote({ tone: "ok", text: "Profile picture updated." });
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeAvatar() {
    setBusy("avatar");
    setNote(null);
    try {
      const result = await call<UserResult>("/api/user/avatar", { method: "DELETE" });
      onUserChange(result.user);
      setNote({ tone: "ok", text: "Picture removed." });
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={user.displayName} url={user.avatarUrl} seed={user.id} size={112} />
          <input ref={fileInput} type="file" accept={AVATAR_ACCEPT} className="sr-only" aria-label="Upload a profile picture" onChange={(e) => upload(e.target.files?.[0])} />
          <button type="button" onClick={() => fileInput.current?.click()} disabled={busy !== null} className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold hover:border-white/40 disabled:opacity-50">
            {busy === "avatar" ? "Uploading…" : user.avatarUrl ? "Change picture" : "Upload picture"}
          </button>
          {user.avatarUrl && (
            <button type="button" onClick={removeAvatar} disabled={busy !== null} className="text-xs text-muted underline underline-offset-2 disabled:opacity-50">Remove</button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={saveName} className="flex flex-col gap-3">
              <label htmlFor={nameId} className="text-sm font-medium">Display name</label>
              <input id={nameId} autoFocus className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-lg" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={50} required />
              <div className="flex gap-3">
                <button type="submit" disabled={busy !== null} className="rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white disabled:opacity-50">{busy === "name" ? "Saving…" : "Save"}</button>
                <button type="button" onClick={() => { setEditing(false); setName(user.displayName); }} className="rounded-lg border border-white/20 px-4 py-2">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="break-words text-2xl font-bold">{user.displayName}</h2>
              <button type="button" onClick={() => { setName(user.displayName); setEditing(true); setNote(null); }} className="rounded-lg border border-white/20 px-3 py-1 text-sm font-semibold hover:border-white/40">
                Edit name
              </button>
            </div>
          )}
          <p className="mt-2 text-sm text-muted">{user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">{user.role}</p>
            {(user.connections.twitch || user.connections.youtube) && <VerifiedBadge />}
          </div>
          {note && <p role={note.tone === "error" ? "alert" : "status"} className={`mt-3 text-sm ${note.tone === "error" ? "text-amber-300" : "text-muted"}`}>{note.text}</p>}
        </div>

        <button type="button" onClick={onSignOut} disabled={signingOut} className="self-start rounded-lg border border-white/20 px-4 py-2 disabled:opacity-50">
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </section>
  );
}
