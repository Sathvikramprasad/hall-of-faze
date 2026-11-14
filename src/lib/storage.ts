/**
 * S3-compatible object storage (AWS S3, Cloudflare R2, Backblaze B2, MinIO…).
 *
 * Implemented with AWS Signature Version 4 directly on top of `fetch` and
 * `node:crypto`, so it needs no SDK dependency.
 *
 * Privacy model: the bucket must be PRIVATE (no public-read ACL / policy).
 * Objects are only ever reached through short-lived presigned URLs that the
 * app hands out after checking the clip's status and the viewer's access.
 *
 * Server-only module.
 */
import { createHash, createHmac } from "node:crypto";

export type StorageConfig = {
  endpoint: string; // e.g. https://<account>.r2.cloudflarestorage.com or https://s3.us-east-1.amazonaws.com
  region: string; // "auto" for R2, e.g. "us-east-1" for AWS
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  forcePathStyle: boolean;
};

export class StorageNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Object storage is not configured. Missing: ${missing.join(", ")}`);
    this.name = "StorageNotConfiguredError";
  }
}

export class StorageRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StorageRequestError";
    this.status = status;
  }
}

export function getStorageConfig(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  const required = {
    S3_ENDPOINT: env.S3_ENDPOINT,
    S3_BUCKET: env.S3_BUCKET,
    S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) throw new StorageNotConfiguredError(missing);

  return {
    endpoint: required.S3_ENDPOINT!.replace(/\/+$/, ""),
    region: env.S3_REGION || "auto",
    bucket: required.S3_BUCKET!,
    accessKeyId: required.S3_ACCESS_KEY_ID!,
    secretAccessKey: required.S3_SECRET_ACCESS_KEY!,
    sessionToken: env.S3_SESSION_TOKEN || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE !== "false",
  };
}

export function isStorageConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    getStorageConfig(env);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Signature V4 primitives                                             */
/* ------------------------------------------------------------------ */

const EMPTY_PAYLOAD_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

/** RFC 3986 encoding as required by SigV4. */
function uriEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeKey(key: string): string {
  return key.split("/").map(uriEncode).join("/");
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function toAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20130524T000000Z
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function signingKey(secret: string, dateStamp: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function canonicalQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${uriEncode(k)}=${uriEncode(params[k])}`)
    .join("&");
}

/** Builds the URL (and Host header value) for an object. */
export function objectLocation(config: StorageConfig, key: string): { url: URL; path: string } {
  const base = new URL(config.endpoint);
  const encodedKey = encodeKey(key);
  const basePath = base.pathname.replace(/\/+$/, "");
  if (config.forcePathStyle) {
    const path = `${basePath}/${uriEncode(config.bucket)}/${encodedKey}`;
    return { url: new URL(`${base.protocol}//${base.host}${path}`), path };
  }
  const path = `${basePath}/${encodedKey}`;
  return { url: new URL(`${base.protocol}//${config.bucket}.${base.host}${path}`), path };
}

type PresignOptions = {
  method: "GET" | "PUT" | "HEAD";
  key: string;
  expiresInSeconds: number;
  /** For PUT: the Content-Type the uploader must send (it becomes a signed header). */
  contentType?: string;
  /** Extra query params, e.g. response-content-type / response-content-disposition. */
  query?: Record<string, string>;
  now?: Date;
};

/** Creates a presigned URL (query-string authentication). */
export function presignUrl(config: StorageConfig, options: PresignOptions): string {
  const expires = Math.max(1, Math.min(604800, Math.floor(options.expiresInSeconds)));
  const { amzDate, dateStamp } = toAmzDate(options.now ?? new Date());
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const { url, path } = objectLocation(config, options.key);

  const headers: Record<string, string> = { host: url.host };
  if (options.contentType) headers["content-type"] = options.contentType;
  const signedHeaderNames = Object.keys(headers).sort();
  const signedHeaders = signedHeaderNames.join(";");

  const query: Record<string, string> = {
    ...(options.query ?? {}),
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  if (config.sessionToken) query["X-Amz-Security-Token"] = config.sessionToken;

  const canonicalHeaders = signedHeaderNames.map((h) => `${h}:${headers[h].trim()}\n`).join("");
  const canonicalQuery = canonicalQueryString(query);
  const canonicalRequest = [
    options.method,
    path,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(config.secretAccessKey, dateStamp, config.region))
    .update(stringToSign, "utf8")
    .digest("hex");

  return `${url.origin}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

type SignedRequest = { url: string; headers: Record<string, string> };

/** Signs a server-side request with an empty body (Authorization header auth). */
export function signRequest(
  config: StorageConfig,
  method: "GET" | "HEAD" | "DELETE",
  key: string,
  extraHeaders: Record<string, string> = {},
  now: Date = new Date(),
): SignedRequest {
  const { amzDate, dateStamp } = toAmzDate(now);
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const { url, path } = objectLocation(config, key);

  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": EMPTY_PAYLOAD_SHA256,
    "x-amz-date": amzDate,
  };
  for (const [name, value] of Object.entries(extraHeaders)) headers[name.toLowerCase()] = value;
  if (config.sessionToken) headers["x-amz-security-token"] = config.sessionToken;

  const names = Object.keys(headers).sort();
  const signedHeaders = names.join(";");
  const canonicalHeaders = names.map((h) => `${h}:${headers[h].trim()}\n`).join("");
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, EMPTY_PAYLOAD_SHA256].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(config.secretAccessKey, dateStamp, config.region))
    .update(stringToSign, "utf8")
    .digest("hex");

  const outgoing: Record<string, string> = { ...headers };
  delete outgoing.host; // fetch sets Host itself
  outgoing.authorization =
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { url: url.toString(), headers: outgoing };
}

/* ------------------------------------------------------------------ */
/* High-level helpers used by the clip routes                          */
/* ------------------------------------------------------------------ */

export const UPLOAD_URL_TTL_SECONDS = 15 * 60;
export const THUMBNAIL_URL_TTL_SECONDS = 10 * 60;
export const VIDEO_URL_TTL_SECONDS = 60 * 60;

export function createUploadUrl(key: string, contentType: string): string {
  return presignUrl(getStorageConfig(), {
    method: "PUT",
    key,
    contentType,
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
  });
}

export function createDownloadUrl(key: string, expiresInSeconds: number, contentType?: string): string {
  return presignUrl(getStorageConfig(), {
    method: "GET",
    key,
    expiresInSeconds,
    query: contentType ? { "response-content-type": contentType } : undefined,
  });
}

export type ObjectMetadata = { size: number; contentType: string | null };

/** Returns object metadata, or null when the object does not exist. */
export async function headObject(key: string): Promise<ObjectMetadata | null> {
  const req = signRequest(getStorageConfig(), "HEAD", key);
  const res = await fetch(req.url, { method: "HEAD", headers: req.headers, cache: "no-store" });
  if (res.status === 404) return null;
  if (res.status === 403) {
    // Also what S3 answers for a missing key when the credentials lack ListBucket.
    throw new StorageRequestError(
      "Storage refused the HEAD request (check credentials, bucket and s3:ListBucket permission).",
      403,
    );
  }
  if (!res.ok) throw new StorageRequestError(`Storage HEAD failed with ${res.status}`, res.status);
  return {
    size: Number(res.headers.get("content-length") ?? "0"),
    contentType: res.headers.get("content-type"),
  };
}

/** Reads bytes [start, end] (inclusive) of an object. */
export async function readObjectRange(key: string, start: number, end: number): Promise<Uint8Array> {
  const req = signRequest(getStorageConfig(), "GET", key, { range: `bytes=${start}-${end}` });
  const res = await fetch(req.url, { method: "GET", headers: req.headers, cache: "no-store" });
  if (!res.ok) throw new StorageRequestError(`Storage range read failed with ${res.status}`, res.status);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // Servers that ignore Range return the whole object; trim to what was asked.
  return bytes.subarray(0, end - start + 1);
}

/** Reads a whole object, refusing anything larger than maxBytes. */
export async function readObject(key: string, maxBytes: number): Promise<Uint8Array> {
  const meta = await headObject(key);
  if (!meta) throw new StorageRequestError("Object not found", 404);
  if (meta.size > maxBytes) throw new StorageRequestError("Object too large to read", 413);
  const req = signRequest(getStorageConfig(), "GET", key);
  const res = await fetch(req.url, { method: "GET", headers: req.headers, cache: "no-store" });
  if (!res.ok) throw new StorageRequestError(`Storage read failed with ${res.status}`, res.status);
  return new Uint8Array(await res.arrayBuffer());
}

export async function deleteObject(key: string): Promise<void> {
  const req = signRequest(getStorageConfig(), "DELETE", key);
  const res = await fetch(req.url, { method: "DELETE", headers: req.headers, cache: "no-store" });
  if (!res.ok && res.status !== 404) {
    throw new StorageRequestError(`Storage delete failed with ${res.status}`, res.status);
  }
}

/** Best-effort delete of several objects; never throws. */
export async function deleteObjectsQuietly(keys: (string | undefined | null)[]): Promise<void> {
  await Promise.all(
    keys.filter((k): k is string => Boolean(k)).map((k) => deleteObject(k).catch(() => undefined)),
  );
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Object keys for a clip. Keys contain only the clip id, never user input. */
export function clipObjectKeys(clipId: string, videoType: string, thumbnailType: string) {
  return {
    videoKey: `clips/${clipId}/video.${EXTENSION_BY_TYPE[videoType] ?? "bin"}`,
    thumbnailKey: `clips/${clipId}/thumbnail.${EXTENSION_BY_TYPE[thumbnailType] ?? "bin"}`,
  };
}
