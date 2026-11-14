#!/usr/bin/env node
/**
 * One-time setup + health check for the clip storage bucket.
 *
 *   npm run storage:setup                     # CORS for http://localhost:3000
 *   npm run storage:setup -- https://my-staging.vercel.app http://localhost:3000
 *
 * Reads the same env vars as the app (from .env.local):
 *   VULTR_S3_ENDPOINT / S3_ENDPOINT, VULTR_S3_BUCKET / S3_BUCKET,
 *   VULTR_S3_ACCESS_KEY / S3_ACCESS_KEY_ID, VULTR_S3_SECRET_KEY / S3_SECRET_ACCESS_KEY,
 *   optional VULTR_S3_REGION / S3_REGION.
 *
 * It (1) applies a CORS rule so browsers can upload and play clips, (2) reads
 * it back, and (3) writes, reads and deletes a small test object to confirm
 * the keys work. Plain JavaScript on purpose so it runs on any Node 20+.
 */
import { createHash, createHmac } from "node:crypto";

const env = process.env;
const pick = (...names) => names.map((n) => env[n]).find(Boolean);

let endpoint = pick("S3_ENDPOINT", "VULTR_S3_ENDPOINT");
const bucket = pick("S3_BUCKET", "VULTR_S3_BUCKET");
const accessKey = pick("S3_ACCESS_KEY_ID", "VULTR_S3_ACCESS_KEY");
const secretKey = pick("S3_SECRET_ACCESS_KEY", "VULTR_S3_SECRET_KEY");
const region = pick("S3_REGION", "VULTR_S3_REGION") || "us-east-1";

const missing = [
  !endpoint && "VULTR_S3_ENDPOINT",
  !bucket && "VULTR_S3_BUCKET",
  !accessKey && "VULTR_S3_ACCESS_KEY",
  !secretKey && "VULTR_S3_SECRET_KEY",
].filter(Boolean);
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}
if (!/^https?:\/\//i.test(endpoint)) endpoint = `https://${endpoint}`;
endpoint = endpoint.replace(/\/+$/, "");

const origins = process.argv.slice(2).length
  ? process.argv.slice(2)
  : (env.STORAGE_CORS_ORIGINS || "http://localhost:3000").split(",").map((s) => s.trim()).filter(Boolean);

const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
const enc = (v) => encodeURIComponent(v).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** Signs and sends a path-style S3 request (AWS Signature V4). */
async function s3(method, key, { query = {}, body = "", headers = {} } = {}) {
  const base = new URL(endpoint);
  const path = `/${enc(bucket)}${key ? `/${key.split("/").map(enc).join("/")}` : "/"}`;
  const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = now.slice(0, 8);
  const scope = `${date}/${region}/s3/aws4_request`;
  const payloadHash = sha256(body);

  const all = { host: base.host, "x-amz-content-sha256": payloadHash, "x-amz-date": now };
  for (const [k, v] of Object.entries(headers)) all[k.toLowerCase()] = v;
  const names = Object.keys(all).sort();
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${enc(k)}=${enc(query[k])}`)
    .join("&");
  const canonical = [
    method,
    path,
    canonicalQuery,
    names.map((n) => `${n}:${String(all[n]).trim()}\n`).join(""),
    names.join(";"),
    payloadHash,
  ].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", now, scope, sha256(canonical)].join("\n");
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, date), region), "s3"), "aws4_request");
  const signature = createHmac("sha256", kSigning).update(toSign).digest("hex");

  const outgoing = { ...all };
  delete outgoing.host;
  outgoing.authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`;
  const url = `${base.protocol}//${base.host}${path}${canonicalQuery ? `?${canonicalQuery}` : ""}`;
  const res = await fetch(url, { method, headers: outgoing, body: body || undefined });
  return { status: res.status, ok: res.ok, text: await res.text(), headers: res.headers };
}

function fail(step, res) {
  console.error(`\n✗ ${step} failed (HTTP ${res.status})\n${res.text.slice(0, 500)}`);
  if (res.status === 403) console.error("  → Check the access key / secret key and that the bucket name is right.");
  if (res.status === 404) console.error("  → The bucket was not found. Create it in the Vultr dashboard first.");
  process.exit(1);
}

const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const corsXml =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<CORSConfiguration><CORSRule>` +
  origins.map((o) => `<AllowedOrigin>${xmlEscape(o)}</AllowedOrigin>`).join("") +
  `<AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedMethod>PUT</AllowedMethod>` +
  `<AllowedHeader>Content-Type</AllowedHeader><AllowedHeader>Range</AllowedHeader>` +
  `<ExposeHeader>ETag</ExposeHeader><ExposeHeader>Content-Length</ExposeHeader><ExposeHeader>Content-Range</ExposeHeader>` +
  `<MaxAgeSeconds>3600</MaxAgeSeconds>` +
  `</CORSRule></CORSConfiguration>`;

console.log(`Bucket ${bucket} at ${endpoint} (region ${region})`);

// 1. CORS
const md5 = createHash("md5").update(corsXml).digest("base64");
const put = await s3("PUT", "", {
  query: { cors: "" },
  body: corsXml,
  headers: { "content-md5": md5, "content-type": "application/xml" },
});
if (!put.ok) fail("Setting CORS", put);
console.log(`✓ CORS allows ${origins.join(", ")}`);

// 2. Read it back
const get = await s3("GET", "", { query: { cors: "" } });
if (!get.ok) fail("Reading CORS", get);
const applied = origins.every((o) => get.text.includes(xmlEscape(o)));
console.log(applied ? "✓ CORS rule confirmed" : "! CORS rule read back without every origin — check the bucket settings");

// 3. Credentials round trip
const key = `healthcheck/${Date.now()}.txt`;
const write = await s3("PUT", key, { body: "ok", headers: { "content-type": "text/plain" } });
if (!write.ok) fail("Writing a test object", write);
const read = await s3("GET", key);
if (!read.ok || read.text !== "ok") fail("Reading the test object", read);
const del = await s3("DELETE", key);
if (!del.ok && del.status !== 204) fail("Deleting the test object", del);
console.log("✓ Upload, download and delete work with these keys");

// 4. Privacy check: the bucket must not be publicly readable.
const anon = await fetch(`${endpoint}/${enc(bucket)}/`, { method: "GET" });
console.log(
  anon.status === 403
    ? "✓ Bucket is private (anonymous listing refused)"
    : `! Anonymous request returned HTTP ${anon.status} — make sure the bucket is private`,
);

console.log("\nStorage is ready. Start the app with: npm run dev");
