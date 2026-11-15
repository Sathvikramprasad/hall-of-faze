"use client";

import { openFazeBot } from "@/lib/faze-bot/events";

export function OpenFazeBotButton() {
  return (
    <button
      type="button"
      onClick={openFazeBot}
      className="mt-6 inline-flex min-h-12 items-center rounded-lg border border-white/20 px-5 font-semibold transition-colors hover:border-accent hover:text-accent"
    >
      Chat with FaZe Bot
    </button>
  );
}
