import assert from "node:assert/strict";
import test from "node:test";

const codes = await import(new URL("../../src/lib/email-code-rules.ts", import.meta.url).href);
const avatar = await import(new URL("../../src/lib/avatar-rules.ts", import.meta.url).href);
const profile = await import(new URL("../../src/lib/profile-rules.ts", import.meta.url).href);
const email = await import(new URL("../../src/lib/email.ts", import.meta.url).href);

test("codes are 6 digits", () => {
  for (let i = 0; i < 200; i++) assert.match(codes.generateCode(), /^\d{6}$/);
});

test("code input accepts spaces and dashes only around 6 digits", () => {
  assert.equal(codes.normalizeCode("123456"), "123456");
  assert.equal(codes.normalizeCode(" 123 456 "), "123456");
  assert.equal(codes.normalizeCode("123-456"), "123456");
  for (const bad of ["12345", "1234567", "12a456", "", null, 123456]) assert.equal(codes.normalizeCode(bad), null, String(bad));
});

test("a code only matches its own account and purpose", () => {
  const hash = codes.hashCode("user1", "verify_email", "123456");
  assert.equal(codes.codeMatches(hash, "user1", "verify_email", "123456"), true);
  assert.equal(codes.codeMatches(hash, "user1", "verify_email", "123457"), false);
  assert.equal(codes.codeMatches(hash, "user2", "verify_email", "123456"), false);
  assert.equal(codes.codeMatches(hash, "user1", "reset_password", "123456"), false);
});

test("password rules", () => {
  assert.equal(codes.passwordProblem("x".repeat(12)), null);
  assert.match(codes.passwordProblem("short"), /12–128/);
  assert.match(codes.passwordProblem("x".repeat(129)), /12–128/);
  assert.ok(codes.passwordProblem(undefined));
});

test("default avatar is the first letter or number of the name", () => {
  assert.equal(avatar.avatarInitial("ani"), "A");
  assert.equal(avatar.avatarInitial("  _xX_Sniper"), "X");
  assert.equal(avatar.avatarInitial("Élodie"), "É");
  assert.equal(avatar.avatarInitial("42 gamer"), "4");
  assert.equal(avatar.avatarInitial("!!!"), "?");
  assert.equal(avatar.avatarColor("same"), avatar.avatarColor("same"));
});

test("challenge links stop once the challenge has ended or closed", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  assert.equal(profile.isChallengeLinkable({ status: "active", endsAt: "2026-11-20T00:00:00Z" }, now), true);
  assert.equal(profile.isChallengeLinkable({ status: "active", endsAt: "2026-11-15T11:59:59Z" }, now), false);
  assert.equal(profile.isChallengeLinkable({ status: "closed", endsAt: "2026-11-20T00:00:00Z" }, now), false);
  assert.equal(profile.isChallengeLinkable({ status: "active", endsAt: "nonsense" }, now), false);
});

test("code emails contain the code and escape the name", () => {
  const msg = email.codeEmail({ to: "a@b.co", displayName: "<script>", code: "123456", purpose: "reset_password" });
  assert.match(msg.subject, /123456/);
  assert.match(msg.text, /123 456/);
  assert.doesNotMatch(msg.html, /<script>/);
});

test("email delivery is enabled only when both provider variables are present", () => {
  assert.equal(email.isEmailConfigured({}), false);
  assert.equal(email.isEmailConfigured({ RESEND_API_KEY: "key" }), false);
  assert.equal(email.isEmailConfigured({ EMAIL_FROM: "Hall of FaZe <noreply@example.com>" }), false);
  assert.equal(
    email.isEmailConfigured({
      RESEND_API_KEY: "key",
      EMAIL_FROM: "Hall of FaZe <noreply@example.com>",
    }),
    true,
  );
});
