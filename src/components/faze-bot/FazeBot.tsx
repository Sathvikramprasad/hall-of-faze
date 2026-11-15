"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/client-auth";
import { OPEN_FAZE_BOT_EVENT } from "@/lib/faze-bot/events";
import {
  answerGuestHelp,
  type GuestHelpTurn,
} from "@/lib/faze-bot/guest-help";
import type {
  HistorianResponse,
  HistorianTurn,
  RelatedEntry,
  WebSource,
} from "@/lib/vault/historian";

const QUESTION_MAX = 500;
const HISTORY_MAX_TURNS = 8;

type AuthState = "checking" | "guest" | "member";

type BotMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  mode: "welcome" | "guest" | "member";
  citations?: RelatedEntry[];
  webSources?: WebSource[];
};

const WELCOME_MESSAGE: BotMessage = {
  id: 0,
  role: "assistant",
  mode: "welcome",
  text: "Hey! I’m FaZe Bot. I can help with this website, and verified members can ask me about FaZe history, teams, creators, and members.",
};

const GUEST_PROMPTS = ["How do I create an account?", "How do I verify my email?"];
const MEMBER_PROMPTS = ["Who founded FaZe?", "What is FaZe Rug known for?"];

export function FazeBot() {
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [messages, setMessages] = useState<BotMessage[]>([WELCOME_MESSAGE]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(1);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/user/me", { cache: "no-store" });
        const body = response.ok
          ? ((await response.json().catch(() => null)) as {
              data?: { user?: { emailVerified?: boolean } };
            } | null)
          : null;
        const verified = response.ok && body?.data?.user?.emailVerified !== false;
        if (!cancelled) setAuthState(verified ? "member" : "guest");
      } catch {
        if (!cancelled) setAuthState("guest");
      }
    }

    const handleAuthChange = () => { void checkSession(); };
    const handleOpen = () => setOpen(true);
    void checkSession();
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener(OPEN_FAZE_BOT_EVENT, handleOpen);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener(OPEN_FAZE_BOT_EVENT, handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, open, sending]);

  function addMessage(message: Omit<BotMessage, "id">) {
    const next = { ...message, id: nextMessageId.current++ };
    setMessages((current) => [...current, next]);
  }

  function guestHistory(): GuestHelpTurn[] {
    return messages
      .filter((message) => message.mode === "guest")
      .map(({ role, text }) => ({ role, text }))
      .slice(-HISTORY_MAX_TURNS);
  }

  function memberHistory(): HistorianTurn[] {
    return messages
      .filter((message) => message.mode === "member")
      .map(({ role, text }) => ({ role, text }))
      .slice(-HISTORY_MAX_TURNS);
  }

  async function sendQuestion(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (!trimmed || sending) return;

    const currentMode = authState === "member" ? "member" : "guest";
    const priorGuestHistory = guestHistory();
    const priorMemberHistory = memberHistory();
    addMessage({ role: "user", text: trimmed, mode: currentMode });
    setQuestion("");

    if (currentMode === "guest") {
      addMessage({
        role: "assistant",
        text: answerGuestHelp(trimmed, priorGuestHistory),
        mode: "guest",
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/vault/historian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, history: priorMemberHistory }),
      });
      const result = (await response.json()) as HistorianResponse;

      if (result.status === "unauthenticated") {
        setAuthState("guest");
        addMessage({
          role: "assistant",
          mode: "guest",
          text: "Your session has ended. Sign in again to use full FaZe mode; I can still help with account and website questions here.",
        });
      } else if (result.status === "answered") {
        addMessage({
          role: "assistant",
          mode: "member",
          text: result.answer,
          citations: result.citations,
          webSources: result.webSources,
        });
      } else {
        addMessage({
          role: "assistant",
          mode: "member",
          text: result.message,
          citations: result.related,
        });
      }
    } catch {
      addMessage({
        role: "assistant",
        mode: "member",
        text: "I couldn’t reach the FaZe knowledge service. Check your connection and try again.",
      });
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendQuestion(question);
    }
  }

  const prompts = authState === "member" ? MEMBER_PROMPTS : GUEST_PROMPTS;
  const modeLabel = authState === "checking"
    ? "Checking access…"
    : authState === "member"
      ? "Full FaZe mode"
      : "Account help mode";

  return (
    <>
      {open && (
        <section
          id="faze-bot-window"
          role="dialog"
          aria-label="FaZe Bot chat"
          className="fixed bottom-24 left-4 z-[60] flex h-[min(38rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-surface shadow-2xl shadow-black/60"
        >
          <header className="flex items-center gap-3 border-b border-white/10 bg-background/80 px-4 py-3">
            <Image
              src="/brand/faze-logo-onecolor-white.png"
              alt=""
              width={40}
              height={27}
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl uppercase tracking-wide">FaZe Bot</h2>
              <p className="truncate text-xs text-muted">{modeLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close FaZe Bot"
              className="grid size-9 place-items-center rounded-full text-xl text-muted transition-colors hover:bg-white/10 hover:text-foreground"
            >
              ×
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
            <div className="space-y-3">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {sending && (
                <div className="mr-10 rounded-2xl rounded-bl-sm border border-white/10 bg-background px-4 py-3 text-sm text-muted">
                  Checking the Vault and live sources…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-white/10 bg-background/70 p-3">
            {messages.length === 1 && authState !== "checking" && (
              <div className="mb-3 flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendQuestion(prompt)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-left text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <label htmlFor="faze-bot-question" className="sr-only">
                Message FaZe Bot
              </label>
              <textarea
                ref={inputRef}
                id="faze-bot-question"
                rows={1}
                maxLength={QUESTION_MAX}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder={authState === "member" ? "Ask about FaZe…" : "Ask about signing in…"}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-white/15 bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70"
              />
              <button
                type="submit"
                disabled={sending || question.trim().length === 0 || authState === "checking"}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-fill font-bold text-white transition-colors hover:bg-accent-fill-strong disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                ↑
              </button>
            </form>

            {authState === "guest" && (
              <p className="mt-2 text-center text-xs text-muted">
                <Link href="/account" className="font-semibold text-accent underline underline-offset-2">
                  Sign in or create an account
                </Link>{" "}
                for full FaZe questions.
              </p>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="faze-bot-window"
        className="fixed bottom-4 left-4 z-[60] inline-flex min-h-14 items-center gap-3 rounded-full border border-white/15 bg-accent-fill px-4 pr-5 font-semibold text-white shadow-xl shadow-black/50 transition-transform hover:-translate-y-0.5 hover:bg-accent-fill-strong"
      >
        <span className="grid size-10 place-items-center rounded-full bg-background/90">
          <Image
            src="/brand/faze-logo-onecolor-white.png"
            alt=""
            width={40}
            height={27}
          />
        </span>
        <span>FaZe Bot</span>
      </button>
    </>
  );
}

function ChatMessage({ message }: { message: BotMessage }) {
  const fromUser = message.role === "user";
  return (
    <div
      className={
        fromUser
          ? "ml-10 rounded-2xl rounded-br-sm bg-accent-fill px-4 py-3 text-sm text-white"
          : "mr-10 rounded-2xl rounded-bl-sm border border-white/10 bg-background px-4 py-3 text-sm"
      }
    >
      <p className="whitespace-pre-wrap leading-6">{message.text}</p>
      {!fromUser && message.citations && message.citations.length > 0 && (
        <SourceList heading="Vault" entries={message.citations} />
      )}
      {!fromUser && message.webSources && message.webSources.length > 0 && (
        <WebSourceList sources={message.webSources} />
      )}
    </div>
  );
}

function SourceList({ heading, entries }: { heading: string; entries: RelatedEntry[] }) {
  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{heading}</p>
      <ul className="mt-1 space-y-1 text-xs">
        {entries.slice(0, 4).map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/vault#entry-${entry.id}`}
              className="underline decoration-accent underline-offset-2 hover:text-accent"
            >
              {entry.date.slice(0, 4)}: {entry.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WebSourceList({ sources }: { sources: WebSource[] }) {
  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Live sources</p>
      <ul className="mt-1 space-y-1 text-xs">
        {sources.slice(0, 4).map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-accent underline-offset-2 hover:text-accent"
            >
              {source.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
