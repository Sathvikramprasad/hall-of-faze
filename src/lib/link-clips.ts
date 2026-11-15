/**
 * Clips entered by Twitch / YouTube link instead of uploaded. Server-only.
 *
 * The link is looked up through the platform's API (title, thumbnail, length,
 * whose channel it's from), anything over 3 minutes is refused, and the clip
 * goes into the same moderation queue as uploads. Nothing is copied into our
 * storage: the clip plays in Twitch's or YouTube's own player.
 *
 * Own-channel rule: while a platform's sign-in is available, link clips from
 * that platform must come from the submitter's own verified channel, so nobody
 * can enter someone else's highlight. Set LINK_CLIPS_OWN_CHANNEL_ONLY=false to
 * allow any channel (the clip is then shown without the verified badge).
 */
import { connectDB } from "@/lib/mongodb";
import Clip, { type ClipDocument, type ClipSource } from "@/models/Clip";
import type { IUser } from "@/models/User";
import { formatClipLength, parseClipLink, type ClipPlatform } from "@/lib/creator-links";
import { ExternalServiceError, type ExternalClip } from "@/lib/external-api";
import { getTwitchClip, isTwitchConfigured } from "@/lib/twitch";
import { getYouTubeVideo, isGoogleOAuthConfigured } from "@/lib/youtube";
import { TITLE_MAX_LENGTH, VIDEO_MAX_DURATION_SECONDS } from "@/lib/clip-rules";

const PLATFORM_NAME: Record<ClipPlatform, string> = { twitch: "Twitch", youtube: "YouTube" };

export async function lookupClipLink(url: unknown): Promise<ExternalClip> {
  const link = typeof url === "string" ? parseClipLink(url) : null;
  if (!link) {
    throw new ExternalServiceError("unsupported", "Paste a Twitch clip link or a YouTube video or Shorts link.");
  }
  const clip = link.platform === "twitch" ? await getTwitchClip(link.id) : await getYouTubeVideo(link.id);
  if (clip.durationSeconds === null) {
    throw new ExternalServiceError("unsupported", "Couldn't read how long this video is, so it can't be checked against the 3-minute limit.");
  }
  if (clip.durationSeconds > VIDEO_MAX_DURATION_SECONDS) {
    throw new ExternalServiceError(
      "unsupported",
      `Clips can be at most ${VIDEO_MAX_DURATION_SECONDS / 60} minutes long. This one is ${formatClipLength(clip.durationSeconds)}.`,
    );
  }
  return clip;
}

export function isOwnChannelRequired(platform: ClipPlatform): boolean {
  if (process.env.LINK_CLIPS_OWN_CHANNEL_ONLY === "false") return false;
  return platform === "twitch" ? isTwitchConfigured() : isGoogleOAuthConfigured();
}

/** True when the user verified this platform and the clip comes from that channel. */
export function isFromOwnChannel(user: Pick<IUser, "connections">, clip: Pick<ExternalClip, "platform" | "channelId">): boolean {
  if (clip.platform === "twitch") return Boolean(user.connections?.twitch?.id && user.connections.twitch.id === clip.channelId);
  return Boolean(user.connections?.youtube?.channelId && user.connections.youtube.channelId === clip.channelId);
}

/** Null when the user may enter this clip, otherwise the reason they can't. */
export function ownershipProblem(user: Pick<IUser, "connections">, clip: ExternalClip): string | null {
  if (!isOwnChannelRequired(clip.platform) || isFromOwnChannel(user, clip)) return null;
  const name = PLATFORM_NAME[clip.platform];
  const connected = clip.platform === "twitch" ? user.connections?.twitch : user.connections?.youtube;
  if (!connected) {
    return `Link clips must come from your own channel. Connect ${name} on My Profile first, then paste the link again.`;
  }
  const yours = clip.platform === "twitch" ? user.connections?.twitch?.displayName : user.connections?.youtube?.title;
  return `This clip is from ${clip.channelName || "another"} channel. You can only enter clips from your own ${name} channel (${yours}).`;
}

export class DuplicateLinkClipError extends Error {
  constructor() {
    super("This clip has already been entered.");
    this.name = "DuplicateLinkClipError";
  }
}

export async function createLinkClip(input: {
  user: Pick<IUser, "_id" | "connections">;
  clip: ExternalClip;
  title: string;
  description: string;
  challengeId: string | null;
}): Promise<ClipDocument> {
  await connectDB();
  const { clip } = input;
  const duplicate = await Clip.exists({
    "source.platform": clip.platform,
    "source.id": clip.id,
    challengeId: input.challengeId,
    status: { $ne: "rejected" },
  });
  if (duplicate) throw new DuplicateLinkClipError();

  const uploaderId = input.user._id.toHexString();
  const source: ClipSource = {
    platform: clip.platform,
    id: clip.id,
    url: clip.url,
    channelId: clip.channelId,
    channelName: clip.channelName,
    thumbnailUrl: clip.thumbnailUrl,
    durationSeconds: clip.durationSeconds,
    verifiedOwner: isFromOwnChannel(input.user, clip),
  };
  const now = new Date();
  const created = await Clip.create({
    title: (input.title.trim() || clip.title.trim()).slice(0, TITLE_MAX_LENGTH),
    description: input.description.trim(),
    challengeId: input.challengeId,
    uploaderId,
    // Nothing to upload or verify in storage, so it goes straight to review.
    status: "pending_review",
    statusHistory: [{ from: null, to: "pending_review", at: now, by: uploaderId, reason: `entered by ${PLATFORM_NAME[clip.platform]} link` }],
    source,
    processingExpiresAt: null,
  });
  return created.toObject() as unknown as ClipDocument;
}
