import assert from "node:assert/strict";
import test from "node:test";

const guestHelpUrl = new URL("../../src/lib/faze-bot/guest-help.ts", import.meta.url).href;
const { answerGuestHelp } = (await import(guestHelpUrl)) as typeof import(
  "../../src/lib/faze-bot/guest-help"
);

test("answers account setup questions without using Gemini", () => {
  assert.match(answerGuestHelp("How do I create an account?"), /Create account/i);
  assert.match(answerGuestHelp("Where do I sign in?"), /Account page/i);
  assert.match(answerGuestHelp("I forgot my password"), /6-digit code/i);
});

test("explains the signed-out and verified-member feature split", () => {
  const answer = answerGuestHelp("Can I view clips before I log in?");
  assert.match(answer, /browse/i);
  assert.match(answer, /verified account/i);
});

test("uses the previous guest question for a short follow-up", () => {
  const answer = answerGuestHelp("where?", [
    { role: "user", text: "I need to reset my password" },
    { role: "assistant", text: "Use the reset flow." },
  ]);
  assert.match(answer, /Forgot password/i);
});

test("keeps general FaZe questions behind verified sign-in", () => {
  const answer = answerGuestHelp("Who founded FaZe Clan?");
  assert.match(answer, /Sign in with a verified account/i);
  assert.match(answer, /full FaZe mode/i);
});
