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

test("does not pretend live search is available without a Gemini key", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await askHistorian("What high school did FaZe Rug attend?");
    assert.equal(result.status, "unavailable");
    if (result.status === "unavailable") assert.equal(result.reason, "not_configured");
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test("uses Gemini web grounding for FaZe questions outside the Vault", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";

  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /generativelanguage\.googleapis\.com/);
    const body = JSON.parse(String(init?.body)) as {
      tools?: { google_search?: object; url_context?: object }[];
      contents?: { parts?: { text?: string }[] }[];
    };
    assert.deepEqual(body.tools, [{ google_search: {} }, { url_context: {} }]);
    assert.match(body.contents?.[0]?.parts?.[0]?.text ?? "", /FaZe Rug/);

    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    answerable: true,
                    answer: "FaZe Rug attended a public high school in San Diego.",
                    citedIds: [],
                  }),
                },
              ],
            },
            groundingMetadata: {
              groundingChunks: [
                {
                  web: {
                    uri: "https://example.com/faze-rug-profile",
                    title: "FaZe Rug profile",
                  },
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const result = await askHistorian("What high school did FaZe Rug attend?");
    assert.equal(result.status, "answered");
    if (result.status !== "answered") return;
    assert.match(result.answer, /FaZe Rug/);
    assert.deepEqual(result.webSources, [
      { label: "FaZe Rug profile", url: "https://example.com/faze-rug-profile" },
    ]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});

test("rejects questions that Gemini identifies as unrelated to FaZe", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({ answerable: false, answer: "", citedIds: [] }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  try {
    const result = await askHistorian("What is the capital of France?");
    assert.equal(result.status, "unsupported");
    if (result.status === "unsupported") assert.equal(result.reason, "outside_faze_scope");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
});
