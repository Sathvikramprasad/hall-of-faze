"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type VoteButtonProps = {
  clipId: string;
  challengeId: string;
  initialVoteCount: number;
};

export default function VoteButton({ clipId, challengeId, initialVoteCount }: VoteButtonProps) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [message, setMessage] = useState("");

  async function submitVote() {
    setState("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId, challengeId }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !payload.success) {
        setMessage(payload.error?.message ?? "The vote could not be recorded.");
        setState("idle");
        return;
      }
      setVoteCount((current) => current + 1);
      setMessage("Vote recorded.");
      setState("done");
      router.refresh();
    } catch {
      setMessage("The vote could not be recorded. Check your connection and try again.");
      setState("idle");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={submitVote}
        disabled={state !== "idle"}
        className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
      >
        {state === "submitting" ? "Recording…" : state === "done" ? "Voted" : "Vote"}
      </button>
      <span className="text-sm font-semibold text-zinc-300">
        {voteCount} {voteCount === 1 ? "vote" : "votes"}
      </span>
      <span aria-live="polite" className="w-full text-sm text-zinc-400">
        {message}
      </span>
    </div>
  );
}
