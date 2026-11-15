import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import test from "node:test";

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => unknown,
) => unknown;

// registerHooks is available in the Node 22 runtime used by CI, but the
// project's Node 20 type package predates that API.
const registerHooks = (
  nodeModule as unknown as {
    registerHooks(hooks: { resolve: ResolveHook }): void;
  }
).registerHooks;

// Next's bundler resolves extensionless TypeScript imports. Teach Node's
// strip-types test runner the same small convention for this test module.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && !/\.[a-z0-9]+$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const historianUrl = new URL("../../src/lib/vault/historian.ts", import.meta.url).href;
const { askHistorian } = (await import(historianUrl)) as typeof import(
  "../../src/lib/vault/historian"
);

test("answers sourced Vault questions when Gemini is not configured", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await askHistorian("When was FaZe founded?");
    assert.equal(result.status, "answered");
    if (result.status !== "answered") return;

    assert.match(result.answer, /May 30, 2010/);
    const sourceUrls = result.citations.flatMap((entry) =>
      entry.sources.map((source) => source.url),
    );
    assert.ok(sourceUrls.includes("https://en.wikipedia.org/wiki/FaZe_Clan"));
    assert.ok(sourceUrls.includes("https://my-favorite-things.fandom.com/wiki/FaZe_Clan"));
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test("does not invent an answer outside the sourced Vault", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await askHistorian("What is the capital of France?");
    assert.equal(result.status, "unsupported");
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
