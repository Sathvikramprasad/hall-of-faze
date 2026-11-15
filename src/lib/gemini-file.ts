/**
 * Temporary Gemini Files API uploads for media that is too large to include
 * inline in a generateContent request.
 *
 * The source object remains private in our S3-compatible bucket. The server
 * copies it to Gemini, waits for processing, and callers delete the temporary
 * Gemini file as soon as their model request finishes.
 */
import { readObject } from "@/lib/storage";
import { REMIX_VIDEO_MAX_BYTES } from "@/lib/remix";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";
const FILE_PROCESSING_TIMEOUT_MS = 60_000;
const FILE_POLL_INTERVAL_MS = 1_500;

export const GEMINI_INLINE_VIDEO_MAX_BYTES = 12 * 1024 * 1024;
export const GEMINI_FILE_VIDEO_MAX_BYTES = REMIX_VIDEO_MAX_BYTES;

type GeminiFileResource = {
  name?: string;
  uri?: string;
  mimeType?: string;
  state?: "STATE_UNSPECIFIED" | "PROCESSING" | "ACTIVE" | "FAILED";
  error?: { message?: string };
};

type GeminiFileResponse = GeminiFileResource & {
  file?: GeminiFileResource;
  error?: { message?: string };
};

export type GeminiUploadedFile = {
  name: string;
  uri: string;
  mimeType: string;
};

export class GeminiFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiFileError";
  }
}

function fileFromResponse(data: GeminiFileResponse): GeminiFileResource {
  return data.file ?? data;
}

function errorMessage(data: GeminiFileResponse, fallback: string): string {
  return data.error?.message ?? data.file?.error?.message ?? fallback;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function deleteGeminiFileQuietly(name: string, apiKey: string): Promise<void> {
  await fetch(`${GEMINI_API_BASE}/v1beta/${name}`, {
    method: "DELETE",
    headers: { "x-goog-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => undefined);
}

async function waitUntilActive(
  initial: GeminiFileResource,
  apiKey: string,
): Promise<GeminiFileResource> {
  if (!initial.name) throw new GeminiFileError("Gemini did not return a file name.");
  let file = initial;
  const deadline = Date.now() + FILE_PROCESSING_TIMEOUT_MS;

  while (file.state !== "ACTIVE") {
    if (file.state === "FAILED") {
      throw new GeminiFileError(file.error?.message ?? "Gemini could not process the uploaded video.");
    }
    if (Date.now() >= deadline) {
      throw new GeminiFileError("Gemini timed out while processing the uploaded video.");
    }

    await delay(FILE_POLL_INTERVAL_MS);
    const response = await fetch(`${GEMINI_API_BASE}/v1beta/${file.name}`, {
      headers: { "x-goog-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await response.json().catch(() => ({}))) as GeminiFileResponse;
    if (!response.ok) {
      throw new GeminiFileError(
        `Gemini file status failed (${response.status}): ${errorMessage(data, "unknown error")}`,
      );
    }
    file = fileFromResponse(data);
  }

  return file;
}

export async function uploadStorageVideoToGemini(options: {
  apiKey: string;
  storageKey: string;
  size: number;
  mimeType: string;
  displayName: string;
}): Promise<GeminiUploadedFile> {
  const { apiKey, storageKey, size, mimeType, displayName } = options;
  if (size > GEMINI_FILE_VIDEO_MAX_BYTES) {
    throw new GeminiFileError("Gemini video analysis supports clips up to 50 MB.");
  }

  const bytes = await readObject(storageKey, GEMINI_FILE_VIDEO_MAX_BYTES);
  let uploadedName: string | null = null;

  try {
    const startResponse = await fetch(`${GEMINI_API_BASE}/upload/v1beta/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
      },
      body: JSON.stringify({ file: { display_name: displayName.slice(0, 512) } }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!startResponse.ok) {
      const data = (await startResponse.json().catch(() => ({}))) as GeminiFileResponse;
      throw new GeminiFileError(
        `Gemini file upload could not start (${startResponse.status}): ${errorMessage(data, "unknown error")}`,
      );
    }

    const uploadUrl = startResponse.headers.get("x-goog-upload-url");
    if (!uploadUrl) throw new GeminiFileError("Gemini did not return an upload URL.");

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: Buffer.from(bytes),
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });
    const uploadData = (await uploadResponse.json().catch(() => ({}))) as GeminiFileResponse;
    if (!uploadResponse.ok) {
      throw new GeminiFileError(
        `Gemini file upload failed (${uploadResponse.status}): ${errorMessage(uploadData, "unknown error")}`,
      );
    }

    const initial = fileFromResponse(uploadData);
    uploadedName = initial.name ?? null;
    const active = await waitUntilActive(initial, apiKey);
    if (!active.name || !active.uri) {
      throw new GeminiFileError("Gemini did not return a usable uploaded file.");
    }
    return { name: active.name, uri: active.uri, mimeType: active.mimeType || mimeType };
  } catch (error) {
    if (uploadedName) await deleteGeminiFileQuietly(uploadedName, apiKey);
    throw error;
  }
}

/** Best-effort cleanup; model results should not fail because cleanup failed. */
export async function deleteGeminiFile(file: GeminiUploadedFile, apiKey: string): Promise<void> {
  await deleteGeminiFileQuietly(file.name, apiKey);
}
