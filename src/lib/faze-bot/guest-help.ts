export type GuestHelpTurn = {
  role: "user" | "assistant";
  text: string;
};

const TOPICS = {
  register: ["create", "register", "sign up", "signup", "new account", "join"],
  login: ["sign in", "signin", "log in", "login", "logged in"],
  verify: ["verify", "verification", "code", "email", "spam", "inbox"],
  reset: ["forgot", "reset", "password", "locked out", "can't sign in", "cannot sign in"],
  access: ["upload", "submit", "vote", "challenge", "clip", "leaderboard", "access"],
  faze: ["faze", "member", "team", "history", "clan", "creator", "esports"],
} as const;

function includesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function contextualize(question: string, history: GuestHelpTurn[]): string {
  const normalized = question.trim().toLowerCase();
  const isShortFollowUp = normalized.split(/\s+/).length <= 4 &&
    /^(how|where|why|what|yes|no|okay|ok|it|that|then|next)\b/.test(normalized);
  if (!isShortFollowUp) return normalized;

  const previousUserQuestion = [...history]
    .reverse()
    .find((turn) => turn.role === "user" && turn.text.trim().length > 0)?.text;
  return previousUserQuestion
    ? `${previousUserQuestion.toLowerCase()} ${normalized}`
    : normalized;
}

/**
 * Curated, pre-login help. This deliberately stays local and deterministic so
 * unauthenticated visitors cannot spend the Gemini quota or prompt the model.
 */
export function answerGuestHelp(
  question: string,
  history: GuestHelpTurn[] = [],
): string {
  const text = contextualize(question, history);

  if (/^(hi|hey|hello|yo|help|good (morning|afternoon|evening))\b/.test(text)) {
    return "Hey! I can help you create an account, sign in, verify your email, reset your password, or understand which Hall of FaZe features need an account.";
  }

  if (includesAny(text, TOPICS.reset)) {
    return "On the Account page, choose Sign in and select “Forgot password?”. Enter your email, then use the 6-digit code we send to choose a new password of 12–128 characters.";
  }

  if (includesAny(text, TOPICS.verify)) {
    return "After creating an account, enter the 6-digit verification code sent to your email. Check spam or junk if it is missing, or use “Send a new code” on the verification screen.";
  }

  if (includesAny(text, TOPICS.register)) {
    return "Open the Account page, choose “Create account,” and enter a display name, email, and a password of at least 12 characters. We’ll email you a 6-digit code to verify the account.";
  }

  if (includesAny(text, TOPICS.access)) {
    return "You can browse the Home, Vault, challenge list, clips, and leaderboard without signing in. A verified account is required to open member-only details, upload clips, vote, and use the full FaZe Bot.";
  }

  if (includesAny(text, TOPICS.login)) {
    return "Open the Account page and enter the email and password you registered with. If you have not verified your email yet, the verification screen will appear before member features unlock.";
  }

  if (includesAny(text, TOPICS.faze)) {
    return "Sign in with a verified account to unlock my full FaZe mode. Then I can answer follow-up questions about FaZe history, teams, creators, members, and esports using the sourced Vault and live web results.";
  }

  return "Before sign-in, I can help with account creation, login, email verification, password resets, and website access. What are you trying to do?";
}
