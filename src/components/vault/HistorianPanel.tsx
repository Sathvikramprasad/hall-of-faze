"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import type { HistorianResponse, RelatedEntry } from "@/lib/vault/historian";

const QUESTION_MAX = 500;

const EXAMPLES = [
  "Who founded FaZe?",
  "When did FaZe go public?",
  "What happened with GameSquare?",
];

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; result: HistorianResponse }
  | { kind: "network_error" };

export function HistorianPanel() {
  const inputId = useId();
  const hintId = useId();
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/vault/historian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const result = (await res.json()) as HistorianResponse;
      setState({ kind: "result", result });
    } catch {
      setState({ kind: "network_error" });
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <section
      id="historian"
      aria-labelledby={`${inputId}-heading`}
      className="scroll-mt-24 rounded-2xl border border-white/10 bg-surface p-6 sm:p-8"
    >
      <h2 id={`${inputId}-heading`} className="font-display text-3xl uppercase tracking-wide">
        Ask the Historian
      </h2>
      <p className="mt-2 text-muted">
        Answers come only from the curated Vault entries on this page. If the
        Vault doesn&apos;t cover it, the Historian says so instead of guessing.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Your question about FaZe history
        </label>
        <input
          id={inputId}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={QUESTION_MAX}
          placeholder="e.g. When did FaZe win its first CS Major?"
          aria-describedby={hintId}
          className="min-h-12 flex-1 rounded-lg border border-white/15 bg-background px-4 text-base text-foreground placeholder:text-muted/70"
        />
        <button
          type="submit"
          disabled={state.kind === "loading" || question.trim().length === 0}
          className="min-h-12 rounded-lg bg-accent-fill px-6 font-semibold text-white transition-colors hover:bg-accent-fill-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.kind === "loading" ? "Asking…" : "Ask"}
        </button>
      </form>

      <div id={hintId} className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="text-muted">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setQuestion(example);
              void ask(example);
            }}
            className="rounded-full border border-white/15 px-3 py-1 text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            {example}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-6">
        {state.kind === "loading" && <p className="text-muted">Checking the Vault…</p>}
        {state.kind === "network_error" && (
          <p className="text-muted">
            Couldn&apos;t reach the Historian. Check your connection and try again.
          </p>
        )}
        {state.kind === "result" && <HistorianResult result={state.result} />}
      </div>
    </section>
  );
}

function HistorianResult({ result }: { result: HistorianResponse }) {
  if (result.status === "answered") {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-5">
        <p className="leading-7">{result.answer}</p>
        {result.citations.length > 0 && (
          <EntryLinks heading="Based on these Vault entries" entries={result.citations} />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-background/60 p-5">
      <p className="font-medium">{result.message}</p>
      {result.related.length > 0 ? (
        <EntryLinks heading="Related Vault entries" entries={result.related} />
      ) : (
        <p className="mt-2 text-sm text-muted">
          No matching entries yet. Browse the timeline above instead.
        </p>
      )}
    </div>
  );
}

function EntryLinks({ heading, entries }: { heading: string; entries: RelatedEntry[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{heading}</h3>
      <ul className="mt-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/vault#entry-${entry.id}`}
              className="underline decoration-accent underline-offset-4 hover:text-accent"
            >
              {entry.date.slice(0, 4)}: {entry.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
