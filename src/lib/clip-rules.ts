/**
 * Clip rules shared by the browser and the server.
 *
 * Pure module: no Node, Next.js or database imports, so client components,
 * route handlers and unit tests can all use the same limits and checks.
 * The server ALWAYS re-runs these checks; client-side checks are only for UX.
 */

export const CLIP_STATUSES = [
  "processing",
  "pending_review",
  "approved",
  "rejected",
] as const;

export type ClipStatus = (typeof CLIP_STATUSES)[number];

/**
 * Allowed status transitions.
 *
 * processing      -> pending_review  (upload verified server-side)
 * processing      -> rejected        (upload failed verification / abandoned)
 * pending_review  -> approved        (moderator)
 * pending_review  -> rejected        (moderator)
 * approved        -> rejected        (moderator takedown)
 * rejected        -> pending_review  (moderator reopens for another review)
 */
export const CLIP_STATUS_TRANSITIONS: Readonly<
  Record<ClipStatus, readonly ClipStatus[]>
> = {
  processing: ["pending_review", "rejected"],
  pending_review: ["approved", "rejected"],
  approved: ["rejected"],
  rejected: ["pending_review"],
};

export function canTransition(from: ClipStatus, to: ClipStatus): boolean {
  return CLIP_STATUS_TRANSITIONS[from].includes(to);
}

export function isClipStatus(value: unknown): value is ClipStatus {
  return (
    typeof value === "string" &&
    (CLIP_STATUSES as readonly string[]).includes(value)
  );
}

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

/** Thumbnails must be strictly under 5 MB. */
export const THUMBNAIL_MAX_BYTES = 5 * 1024 * 1024;
export const THUMBNAIL_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ThumbnailType = (typeof THUMBNAIL_TYPES)[number];
export const THUMBNAIL_EXTENSIONS: Record<ThumbnailType, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export const VIDEO_MAX_BYTES = 250 * 1024 * 1024; // 250 MB
export const VIDEO_MAX_DURATION_SECONDS = 180; // 3 minutes
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export type VideoType = (typeof VIDEO_TYPES)[number];
export const VIDEO_EXTENSIONS: Record<VideoType, readonly string[]> = {
  "video/mp4": ["mp4", "m4v"],
  "video/webm": ["webm"],
  "video/quicktime": ["mov"],
};

/* ------------------------------------------------------------------ */
/* Field validation                                                    */
/* ------------------------------------------------------------------ */

export type ValidationIssue = { field: string; message: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type FileDescriptor = { name: string; type: string; size: number };

export function validateThumbnailDescriptor(
  file: FileDescriptor,
  field = "thumbnail",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!(THUMBNAIL_TYPES as readonly string[]).includes(file.type)) {
    issues.push({ field, message: "Thumbnail must be a JPG, PNG, or WebP image." });
  } else {
    const ext = extensionOf(file.name);
    if (ext && !THUMBNAIL_EXTENSIONS[file.type as ThumbnailType].includes(ext)) {
      issues.push({ field, message: "Thumbnail file extension does not match its type." });
    }
  }
  if (!Number.isInteger(file.size) || file.size <= 0) {
    issues.push({ field, message: "Thumbnail file is empty." });
  } else if (file.size >= THUMBNAIL_MAX_BYTES) {
    issues.push({
      field,
      message: `Thumbnail must be under 5 MB (got ${formatBytes(file.size)}).`,
    });
  }
  return issues;
}

export function validateVideoDescriptor(
  file: FileDescriptor,
  field = "video",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!(VIDEO_TYPES as readonly string[]).includes(file.type)) {
    issues.push({ field, message: "Video must be an MP4, WebM, or MOV file." });
  } else {
    const ext = extensionOf(file.name);
    if (ext && !VIDEO_EXTENSIONS[file.type as VideoType].includes(ext)) {
      issues.push({ field, message: "Video file extension does not match its type." });
    }
  }
  if (!Number.isInteger(file.size) || file.size <= 0) {
    issues.push({ field, message: "Video file is empty." });
  } else if (file.size > VIDEO_MAX_BYTES) {
    issues.push({
      field,
      message: `Video must be ${formatBytes(VIDEO_MAX_BYTES)} or smaller (got ${formatBytes(file.size)}).`,
    });
  }
  return issues;
}

export function validateDuration(seconds: unknown): ValidationIssue[] {
  if (seconds === undefined || seconds === null) return [];
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return [{ field: "durationSeconds", message: "Video duration is invalid." }];
  }
  if (seconds > VIDEO_MAX_DURATION_SECONDS) {
    return [
      {
        field: "durationSeconds",
        message: `Clips can be at most ${VIDEO_MAX_DURATION_SECONDS / 60} minutes long.`,
      },
    ];
  }
  return [];
}

export function validateText(title: unknown, description: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof title !== "string" || title.trim().length === 0) {
    issues.push({ field: "title", message: "Title is required." });
  } else if (title.trim().length > TITLE_MAX_LENGTH) {
    issues.push({ field: "title", message: `Title must be at most ${TITLE_MAX_LENGTH} characters.` });
  }
  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      issues.push({ field: "description", message: "Description must be text." });
    } else if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      issues.push({
        field: "description",
        message: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`,
      });
    }
  }
  return issues;
}

/* ------------------------------------------------------------------ */
/* Content sniffing (magic bytes)                                      */
/* ------------------------------------------------------------------ */

/** Number of leading bytes needed by the sniffers below. */
export const SNIFF_BYTES = 32;

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  for (let i = start; i < start + length && i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

/** Detects the real image type from file contents, or null if not JPG/PNG/WebP. */
export function sniffImageType(bytes: Uint8Array): ThumbnailType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= png.length && png.every((b, i) => bytes[i] === b)) {
    return "image/png";
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }
  return null;
}

/** Detects the real video container from file contents, or null if unsupported. */
export function sniffVideoType(bytes: Uint8Array): VideoType | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "video/webm";
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    return brand === "qt  " ? "video/quicktime" : "video/mp4";
  }
  // Older QuickTime files can start with other atoms.
  if (bytes.length >= 8 && ["moov", "mdat", "wide", "free", "skip"].includes(ascii(bytes, 4, 4))) {
    return "video/quicktime";
  }
  return null;
}

/**
 * MP4 and MOV share the ISO-BMFF container, and browsers often label .mov
 * files as video/mp4 (and vice versa), so treat them as interchangeable.
 */
export function videoTypesCompatible(declared: string, sniffed: VideoType): boolean {
  if (declared === sniffed) return true;
  const isoBmff = ["video/mp4", "video/quicktime"];
  return isoBmff.includes(declared) && isoBmff.includes(sniffed);
}
