"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  DESCRIPTION_MAX_LENGTH,
  formatBytes,
  SNIFF_BYTES,
  sniffImageType,
  sniffVideoType,
  THUMBNAIL_TYPES,
  TITLE_MAX_LENGTH,
  validateDuration,
  validateThumbnailDescriptor,
  validateVideoDescriptor,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_DURATION_SECONDS,
  VIDEO_TYPES,
  videoTypesCompatible,
  type ValidationIssue,
} from "@/lib/clip-rules";
import type { CreateClipResponse } from "@/lib/clip-types";
import { getRemixMission, type RemixMission } from "@/lib/remix";

type Phase = "idle" | "checking" | "uploading" | "verifying" | "done";
type FieldErrors = Partial<Record<"title" | "description" | "video" | "thumbnail" | "form", string>>;
type ApiErrorBody = { error?: { code?: string; message?: string; details?: ValidationIssue[] } };

async function readHead(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
}

/** Reads a video's duration in the browser (null if the browser can't decode it). */
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      el.removeAttribute("src");
      resolve(value);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => done(null);
    setTimeout(() => done(null), 10_000);
    el.src = url;
  });
}

/** PUT with upload progress (fetch has no upload progress events). */
function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Storage rejected the upload (HTTP ${xhr.status}).`));
    xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection and storage CORS settings."));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));
    xhr.send(file);
  });
}

function issuesToErrors(issues: ValidationIssue[] = []): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = (["title", "description", "video", "thumbnail"].includes(issue.field)
      ? issue.field
      : issue.field === "durationSeconds"
        ? "video"
        : "form") as keyof FieldErrors;
    errors[key] ??= issue.message;
  }
  return errors;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function UploadForm({
  challengeId,
  remixId,
}: {
  challengeId?: string;
  remixId?: string;
}) {
  const ids = { title: useId(), description: useId(), video: useId(), thumbnail: useId() };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ video: 0, thumbnail: 0 });
  const [clipId, setClipId] = useState<string | null>(null);
  const remixMission: RemixMission | null = getRemixMission(remixId ?? "");

  // Free the preview object URL when it is replaced or the form unmounts.
  useEffect(() => {
    if (!thumbnailPreview) return;
    return () => URL.revokeObjectURL(thumbnailPreview);
  }, [thumbnailPreview]);

  const busy = phase === "checking" || phase === "uploading" || phase === "verifying";

  async function onVideoChange(file: File | null) {
    setVideo(file);
    setVideoDuration(null);
    setErrors((e) => ({ ...e, video: undefined, form: undefined }));
    if (!file) return;
    const issues = validateVideoDescriptor(file);
    if (issues.length) {
      setErrors((e) => ({ ...e, video: issues[0].message }));
      return;
    }
    const realType = sniffVideoType(await readHead(file));
    if (!realType || !videoTypesCompatible(file.type, realType)) {
      setErrors((e) => ({ ...e, video: "This file is not a valid MP4, WebM, or MOV video." }));
      return;
    }
    const seconds = await readVideoDuration(file);
    setVideoDuration(seconds);
    const durationIssues = validateDuration(seconds ?? undefined);
    if (durationIssues.length) {
      setErrors((e) => ({ ...e, video: durationIssues[0].message }));
    } else if (remixMission) {
      const { minDurationSeconds, maxDurationSeconds, maxBytes } = remixMission.clipRules;
      if (file.size > maxBytes) {
        setErrors((e) => ({ ...e, video: `This remix must be ${formatBytes(maxBytes)} or smaller.` }));
      } else if (seconds === null) {
        setErrors((e) => ({ ...e, video: "We could not read this video's duration. Try an MP4 or WebM file." }));
      } else if (seconds < minDurationSeconds || seconds > maxDurationSeconds) {
        setErrors((e) => ({
          ...e,
          video: `This remix must be ${minDurationSeconds}–${maxDurationSeconds} seconds long.`,
        }));
      }
    }
  }

  async function onThumbnailChange(file: File | null) {
    setThumbnail(file);
    setThumbnailPreview(null);
    setErrors((e) => ({ ...e, thumbnail: undefined, form: undefined }));
    if (!file) return;
    const issues = validateThumbnailDescriptor(file);
    if (issues.length) {
      setErrors((e) => ({ ...e, thumbnail: issues[0].message }));
      return;
    }
    const realType = sniffImageType(await readHead(file));
    if (!realType || realType !== file.type) {
      setErrors((e) => ({ ...e, thumbnail: "This file is not a valid JPG, PNG, or WebP image." }));
      return;
    }
    setThumbnailPreview(URL.createObjectURL(file));
  }

  function validateAll(): FieldErrors {
    const next: FieldErrors = {};
    if (!title.trim()) next.title = "Give your clip a title.";
    else if (title.trim().length > TITLE_MAX_LENGTH) next.title = `Keep the title under ${TITLE_MAX_LENGTH} characters.`;
    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      next.description = `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters.`;
    }
    if (!video) next.video = "Choose a video file.";
    else if (errors.video) next.video = errors.video;
    else if (remixMission && video.size > remixMission.clipRules.maxBytes) {
      next.video = `This remix must be ${formatBytes(remixMission.clipRules.maxBytes)} or smaller.`;
    } else if (
      remixMission &&
      (videoDuration === null ||
        videoDuration < remixMission.clipRules.minDurationSeconds ||
        videoDuration > remixMission.clipRules.maxDurationSeconds)
    ) {
      next.video = `This remix must be ${remixMission.clipRules.minDurationSeconds}–${remixMission.clipRules.maxDurationSeconds} seconds long.`;
    }
    if (!thumbnail) next.thumbnail = "Choose a custom thumbnail.";
    else if (errors.thumbnail || !thumbnailPreview) next.thumbnail = errors.thumbnail ?? "Choose a valid thumbnail.";
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found = validateAll();
    setErrors(found);
    if (Object.keys(found).length > 0 || !video || !thumbnail) return;

    setPhase("checking");
    setProgress({ video: 0, thumbnail: 0 });
    // 1. Create the (private) clip and get upload URLs.
    let created: CreateClipResponse;
    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          challengeId: challengeId || null,
          video: {
            name: video.name,
            type: video.type,
            size: video.size,
            ...(videoDuration ? { durationSeconds: videoDuration } : {}),
          },
          thumbnail: { name: thumbnail.name, type: thumbnail.type, size: thumbnail.size },
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        setErrors({ form: body.error?.message ?? "Could not start the upload.", ...issuesToErrors(body.error?.details) });
        setPhase("idle");
        return;
      }
      created = (await res.json()) as CreateClipResponse;
    } catch {
      setErrors({ form: "Could not reach the server. Check your connection and try again." });
      setPhase("idle");
      return;
    }

    const id = created.clip.id;

    // 2. Upload both files straight to storage.
    setPhase("uploading");
    try {
      await Promise.all([
        putWithProgress(created.uploads.video.url, video, created.uploads.video.headers, (f) =>
          setProgress((p) => ({ ...p, video: f })),
        ),
        putWithProgress(created.uploads.thumbnail.url, thumbnail, created.uploads.thumbnail.headers, (f) =>
          setProgress((p) => ({ ...p, thumbnail: f })),
        ),
      ]);
    } catch (error) {
      // Partial upload: remove the half-created clip so nothing is left behind.
      await fetch(`/api/clips/${id}`, { method: "DELETE" }).catch(() => undefined);
      setErrors({ form: `${error instanceof Error ? error.message : "Upload failed."} Nothing was saved — try again.` });
      setPhase("idle");
      return;
    }

    // 3. Ask the server to verify the stored files.
    setPhase("verifying");
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(`/api/clips/${id}/complete`, { method: "POST" });
        if (res.ok) {
          setClipId(id);
          setPhase("done");
          return;
        }
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        if (body.error?.code === "upload_incomplete" && attempt < 3) {
          await sleep(1500 * (attempt + 1));
          continue;
        }
        if (body.error?.code !== "invalid_media") {
          await fetch(`/api/clips/${id}`, { method: "DELETE" }).catch(() => undefined);
        }
        setErrors({
          form: `${body.error?.message ?? "The upload could not be verified."} Nothing was saved — try again.`,
          ...issuesToErrors(body.error?.details),
        });
        setPhase("idle");
        return;
      } catch {
        if (attempt === 3) {
          setErrors({ form: "Lost connection while verifying the upload. Try again." });
          setPhase("idle");
          return;
        }
        await sleep(1500);
      }
    }
  }

  function reset() {
    setTitle("");
    setDescription("");
    setVideo(null);
    setVideoDuration(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setErrors({});
    setProgress({ video: 0, thumbnail: 0 });
    setClipId(null);
    setPhase("idle");
  }

  if (phase === "done" && clipId) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6" role="status">
        <h2 className="text-xl font-semibold">{remixMission ? "Your remix is in" : "Clip submitted for review"}</h2>
        <p className="mt-2 text-sm opacity-80">
          {remixMission
            ? "Gemini is checking the complete submission. A clearly safe clip can move forward automatically; anything uncertain goes to a moderator. FaZe DNA analysis begins after approval."
            : "Your clip is private until a moderator approves it. Once approved it appears in the public feed and can receive votes."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/clips/${clipId}`} className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
            Preview my clip
          </Link>
          <button type="button" onClick={reset} className="rounded-lg border border-current/30 px-4 py-2">
            Upload another
          </button>
        </div>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-black outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/5 dark:text-white";
  const errorClass = "mt-1 text-sm text-red-600 dark:text-red-400";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-busy={busy}>
      {remixMission && (
        <section className="rounded-xl border border-red-500/40 bg-red-500/10 p-5" aria-labelledby="remix-upload-heading">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">{remixMission.eyebrow}</p>
          <h2 id="remix-upload-heading" className="mt-1 text-xl font-black">{remixMission.title}</h2>
          <p className="mt-2 text-sm leading-6 opacity-80">{remixMission.prompt}</p>
          <ul className="mt-3 grid gap-1 text-xs opacity-70 sm:grid-cols-2">
            {remixMission.submissionGuide.map((guide) => (
              <li key={guide}>• {guide}</li>
            ))}
          </ul>
        </section>
      )}

      {errors.form && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          {errors.form}
        </div>
      )}

      <div>
        <label htmlFor={ids.title} className="mb-1 block font-medium">
          Title
        </label>
        <input
          id={ids.title}
          className={fieldClass}
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${ids.title}-error` : undefined}
          required
        />
        {errors.title && (
          <p id={`${ids.title}-error`} className={errorClass}>
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={ids.description} className="mb-1 block font-medium">
          Description <span className="font-normal opacity-60">(optional)</span>
        </label>
        <textarea
          id={ids.description}
          className={`${fieldClass} min-h-24`}
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          aria-invalid={Boolean(errors.description)}
        />
        <p className="mt-1 text-xs opacity-60">
          {description.length}/{DESCRIPTION_MAX_LENGTH}
        </p>
        {errors.description && <p className={errorClass}>{errors.description}</p>}
      </div>

      <div>
        <label htmlFor={ids.video} className="mb-1 block font-medium">
          Video
        </label>
        <input
          id={ids.video}
          type="file"
          accept={VIDEO_TYPES.join(",")}
          onChange={(e) => onVideoChange(e.target.files?.[0] ?? null)}
          disabled={busy}
          aria-invalid={Boolean(errors.video)}
          aria-describedby={`${ids.video}-hint`}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-2 file:font-semibold file:text-black"
        />
        <p id={`${ids.video}-hint`} className="mt-1 text-xs opacity-60">
          {remixMission
            ? `MP4, WebM, or MOV · ${remixMission.clipRules.minDurationSeconds}–${remixMission.clipRules.maxDurationSeconds} seconds · up to ${formatBytes(remixMission.clipRules.maxBytes)}`
            : `MP4, WebM, or MOV · up to ${formatBytes(VIDEO_MAX_BYTES)} · up to ${VIDEO_MAX_DURATION_SECONDS / 60} minutes`}
          {video && !errors.video && (
            <>
              {" "}
              · selected {formatBytes(video.size)}
              {videoDuration ? `, ${Math.round(videoDuration)} s` : ""}
            </>
          )}
        </p>
        {errors.video && <p className={errorClass}>{errors.video}</p>}
      </div>

      <div>
        <label htmlFor={ids.thumbnail} className="mb-1 block font-medium">
          Custom thumbnail
        </label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-current/30 bg-black/5 sm:w-64 dark:bg-white/5">
            {thumbnailPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not optimizable
              <img src={thumbnailPreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-center text-sm opacity-60">Thumbnail preview</span>
            )}
          </div>
          <div className="flex-1">
            <input
              id={ids.thumbnail}
              type="file"
              accept={THUMBNAIL_TYPES.join(",")}
              onChange={(e) => onThumbnailChange(e.target.files?.[0] ?? null)}
              disabled={busy}
              aria-invalid={Boolean(errors.thumbnail)}
              aria-describedby={`${ids.thumbnail}-hint`}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-2 file:font-semibold file:text-black"
            />
            <p id={`${ids.thumbnail}-hint`} className="mt-1 text-xs opacity-60">
              JPG, PNG, or WebP · under 5 MB · 16:9 looks best
            </p>
            {errors.thumbnail && <p className={errorClass}>{errors.thumbnail}</p>}
          </div>
        </div>
      </div>

      {(phase === "uploading" || phase === "verifying") && (
        <div className="flex flex-col gap-2 text-sm" aria-live="polite">
          <ProgressRow label="Video" value={progress.video} />
          <ProgressRow label="Thumbnail" value={progress.thumbnail} />
          {phase === "verifying" && <p>Verifying files…</p>}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-black disabled:opacity-50"
        >
          {phase === "checking"
            ? "Starting…"
            : phase === "uploading"
              ? "Uploading…"
              : phase === "verifying"
                ? "Verifying…"
                : remixMission
                  ? "Submit legacy remix"
                  : "Submit clip for review"}
        </button>
        <p className="text-xs opacity-60">
          {remixMission
            ? "Gemini may clear high-confidence safe clips; uncertain clips stay private for moderator review."
            : "Clips stay private until a moderator approves them."}
        </p>
      </div>
    </form>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20">{label}</span>
      <progress className="h-2 flex-1 accent-amber-400" max={100} value={pct} aria-label={`${label} upload`} />
      <span className="w-10 text-right tabular-nums">{pct}%</span>
    </div>
  );
}
