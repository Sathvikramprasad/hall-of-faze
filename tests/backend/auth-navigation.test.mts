import assert from "node:assert/strict";
import test from "node:test";

const navigationModuleUrl = new URL("../../src/lib/auth-navigation.ts", import.meta.url).href;
const { safeAuthReturnPath, signInHref } = await import(navigationModuleUrl);

test("allows return paths for protected in-app experiences", () => {
  assert.equal(safeAuthReturnPath("/clips/abc"), "/clips/abc");
  assert.equal(safeAuthReturnPath("/next-up?id=1"), "/next-up?id=1");
  assert.equal(safeAuthReturnPath("/upload?challengeId=abc"), "/upload?challengeId=abc");
  assert.equal(safeAuthReturnPath("/vault#historian"), "/vault#historian");
  assert.equal(signInHref("/clips"), "/account?next=%2Fclips");
});

test("rejects external and unexpected return paths", () => {
  assert.equal(safeAuthReturnPath("https://example.com"), null);
  assert.equal(safeAuthReturnPath("//example.com"), null);
  assert.equal(safeAuthReturnPath("/\\example.com"), null);
  assert.equal(safeAuthReturnPath("/account"), null);
  assert.equal(safeAuthReturnPath("/"), null);
  assert.equal(signInHref("https://example.com"), "/account");
});
