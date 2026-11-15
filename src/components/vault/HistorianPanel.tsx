"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/client-auth";
import type { HistorianResponse, RelatedEntry, WebSource } from "@/lib/vault/historian";

const QUESTION_MAX = 500;

const EXAMPLES = [
  "Who founded FaZe?",
  "Who are FaZe's current members?",
  "What is FaZe Rug known for?",
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
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/user/me", { cache: "no-store" });
        if (!cancelled) setAuthenticated(response.ok);
      } catch {
        if (!cancelled) setAuthenticated(false);
      }
    }

    const handleAuthChange = () => { void checkSession(); };
    void checkSession();
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, []);

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
      if (result.status === "unauthenticated") {
        setAuthenticated(false);
        setState({ kind: "idle" });
        return;
      }
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
        Ask about FaZe Clan, its teams, history, or members. The Historian checks
        the sourced Vault first, then uses live web results for broader questions.
      </p>

      {authenticated === null ? (
        <p className="mt-6 text-muted">Checking sign-in status…</p>
      ) : authenticated === false ? (
        <HistorianSignIn />
      ) : (
        <>
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
              placeholder="e.g. What is FaZe Adapt known for?"
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
            {state.kind === "loading" && <p className="text-muted">Checking the Vault and web…</p>}
            {state.kind === "network_error" && (
              <p className="text-muted">
                Couldn&apos;t reach the Historian. Check your connection and try again.
              </p>
            )}
            {state.kind === "result" && <HistorianResult result={state.result} />}
          </div>
        </>
      )}
    </section>
  );
}

function HistorianResult({ result }: { result: HistorianResponse }) {
  if (result.status === "unauthenticated") return <HistorianSignIn />;

  if (result.status === "answered") {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-5">
        <p className="leading-7">{result.answer}</p>
        {result.citations.length > 0 && (
          <EntryLinks heading="Based on these Vault entries" entries={result.citations} />
        )}
        {result.webSources.length > 0 && (
          <WebSourceLinks heading="Sources from live search" sources={result.webSources} />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-background/60 p-5">
      <p className="font-medium">{result.message}</p>
      {result.related.length > 0 && (
        <EntryLinks heading="Related Vault entries" entries={result.related} />
      )}
    </div>
  );
}

function HistorianSignIn() {
  return (
    <div className="mt-6 rounded-xl border border-accent/40 bg-accent/10 p-5">
      <h3 className="text-lg font-semibold">Sign in to ask the Historian</h3>
      <p className="mt-2 text-sm text-muted">
        The Vault stays public, while AI questions are available to signed-in members.
      </p>
      <Link
        href="/account?next=%2Fvault%23historian"
        className="mt-4 inline-flex rounded-lg bg-accent-fill px-4 py-2 font-semibold text-white"
      >
        Sign in or create an account
      </Link>
    </div>
  );
}

function WebSourceLinks({ heading, sources }: { heading: string; sources: WebSource[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{heading}</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-accent underline-offset-4 hover:text-accent"
            >
              {source.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EntryLinks({ heading, entries }: { heading: string; entries: RelatedEntry[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{heading}</h3>
      <ul className="mt-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.id} className="space-y-1">
            <Link
              href={`/vault#entry-${entry.id}`}
              className="underline decoration-accent underline-offset-4 hover:text-accent"
            >
              {entry.date.slice(0, 4)}: {entry.title}
            </Link>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
              {entry.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {source.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
