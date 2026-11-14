import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  validateThumbnailDescriptor,
  validateVideoDescriptor,
  validateText,
  validateDuration,
  sniffImageType,
  sniffVideoType,
  videoTypesCompatible,
  THUMBNAIL_MAX_BYTES,
} from "../../src/lib/clip-rules.ts";

const bytes = (...values) => new Uint8Array(values);
const asciiBytes = (s) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

test("status transitions", () => {
  assert.ok(canTransition("processing", "pending_review"));
  assert.ok(canTransition("pending_review", "approved"));
  assert.ok(canTransition("pending_review", "rejected"));
  assert.ok(canTransition("approved", "rejected"));
  assert.ok(canTransition("rejected", "pending_review"));
  assert.ok(!canTransition("processing", "approved"), "cannot skip review");
  assert.ok(!canTransition("rejected", "approved"), "rejected must be reopened first");
  assert.ok(!canTransition("approved", "processing"));
});

test("thumbnail descriptor validation", () => {
  assert.deepEqual(validateThumbnailDescriptor({ name: "a.jpg", type: "image/jpeg", size: 1000 }), []);
  assert.deepEqual(validateThumbnailDescriptor({ name: "a.webp", type: "image/webp", size: 1000 }), []);
  assert.equal(validateThumbnailDescriptor({ name: "a.gif", type: "image/gif", size: 1000 }).length, 1);
  assert.equal(validateThumbnailDescriptor({ name: "a.png", type: "image/jpeg", size: 1000 }).length, 1);
  assert.equal(validateThumbnailDescriptor({ name: "a.png", type: "image/png", size: 0 }).length, 1);
  assert.equal(validateThumbnailDescriptor({ name: "a.png", type: "image/png", size: THUMBNAIL_MAX_BYTES }).length, 1, "5 MB is not under 5 MB");
  assert.deepEqual(validateThumbnailDescriptor({ name: "a.png", type: "image/png", size: THUMBNAIL_MAX_BYTES - 1 }), []);
});

test("video descriptor, text and duration validation", () => {
  assert.deepEqual(validateVideoDescriptor({ name: "c.mp4", type: "video/mp4", size: 10 }), []);
  assert.equal(validateVideoDescriptor({ name: "c.avi", type: "video/x-msvideo", size: 10 }).length, 1);
  assert.equal(validateVideoDescriptor({ name: "c.mp4", type: "video/mp4", size: 300 * 1024 * 1024 }).length, 1);
  assert.equal(validateText("", undefined).length, 1);
  assert.equal(validateText("x".repeat(101), undefined).length, 1);
  assert.deepEqual(validateText("Nice clip", "desc"), []);
  assert.deepEqual(validateDuration(undefined), []);
  assert.equal(validateDuration(181).length, 1);
  assert.equal(validateDuration(Number.NaN).length, 1);
});

test("image sniffing", () => {
  assert.equal(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(sniffImageType(asciiBytes("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffImageType(asciiBytes("GIF89a......")), null);
  assert.equal(sniffImageType(asciiBytes("<svg xmlns=")), null);
});

test("video sniffing", () => {
  assert.equal(sniffVideoType(bytes(0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0)), "video/webm");
  assert.equal(sniffVideoType(asciiBytes("\0\0\0\x18ftypisom\0\0")), "video/mp4");
  assert.equal(sniffVideoType(asciiBytes("\0\0\0\x14ftypqt  \0\0")), "video/quicktime");
  assert.equal(sniffVideoType(asciiBytes("not a video at all")), null);
  assert.ok(videoTypesCompatible("video/quicktime", "video/mp4"));
  assert.ok(!videoTypesCompatible("video/webm", "video/mp4"));
});
