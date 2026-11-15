/**
 * Transactional email. Server-only.
 *
 * Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email)
 * when RESEND_API_KEY and EMAIL_FROM are set. Outside production, with no key,
 * the message is printed to the server console instead so codes can be tested locally.
 */
export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email sending is not configured (set RESEND_API_KEY and EMAIL_FROM).");
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailSendError";
  }
}

export type OutgoingEmail = { to: string; subject: string; text: string; html: string };

export function isEmailConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim());
}

export async function sendEmail(message: OutgoingEmail): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) {
    if (process.env.NODE_ENV === "production") throw new EmailNotConfiguredError();
    console.info(`\n[email:dev] To: ${message.to}\n[email:dev] Subject: ${message.subject}\n${message.text}\n`);
    return { delivered: false };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new EmailSendError(`Email provider returned HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }
  return { delivered: true };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function codeEmail(input: { to: string; displayName: string; code: string; purpose: "verify_email" | "reset_password" }): OutgoingEmail {
  const verify = input.purpose === "verify_email";
  const subject = verify ? `${input.code} is your Hall of FaZe verification code` : `${input.code} is your Hall of FaZe password reset code`;
  const lead = verify
    ? "Enter this code on Hall of FaZe to verify your email:"
    : "Someone asked to reset the password for your Hall of FaZe account. Enter this code to choose a new password:";
  const tail = verify
    ? "The code expires in 15 minutes."
    : "The code expires in 15 minutes. If you didn't ask for this, ignore this email; your password won't change.";
  const spaced = `${input.code.slice(0, 3)} ${input.code.slice(3)}`;
  return {
    to: input.to,
    subject,
    text: `Hi ${input.displayName},\n\n${lead}\n\n${spaced}\n\n${tail}\n\n— Hall of FaZe`,
    html:
      `<p>Hi ${escapeHtml(input.displayName)},</p><p>${lead}</p>` +
      `<p style="font-size:28px;font-weight:700;letter-spacing:6px;font-family:monospace">${spaced}</p>` +
      `<p style="color:#666">${tail}</p><p>— Hall of FaZe</p>`,
  };
}
