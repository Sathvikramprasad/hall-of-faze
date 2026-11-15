"use client";

import { useState } from "react";
import LinkClipForm from "@/components/clips/LinkClipForm";
import UploadForm from "@/components/clips/UploadForm";

const TABS = [
  { id: "upload", label: "Upload a file" },
  { id: "link", label: "Paste a Twitch or YouTube link" },
] as const;

/** The upload page: upload a video file, or enter a clip by link. */
export default function ClipSubmitTabs({
  challengeId,
  remixId,
}: {
  challengeId?: string;
  remixId?: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upload");
  return (
    <div>
      <div role="tablist" aria-label="How to submit" className="mb-8 flex flex-col gap-1 rounded-lg bg-black/20 p-1 sm:flex-row">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`submit-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`submit-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${tab === t.id ? "bg-accent-fill text-white" : "text-muted hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Both stay mounted so switching tabs never loses what was typed. */}
      <div id="submit-panel-upload" role="tabpanel" aria-labelledby="submit-tab-upload" hidden={tab !== "upload"}>
        <UploadForm challengeId={challengeId} remixId={remixId} />
      </div>
      <div id="submit-panel-link" role="tabpanel" aria-labelledby="submit-tab-link" hidden={tab !== "link"}>
        <LinkClipForm />
      </div>
    </div>
  );
}
