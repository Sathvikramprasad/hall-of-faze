import type { MemberProfile } from "./types";

export type ChannelPlatform = "YouTube" | "Twitch";

export type ChannelLink = {
  platform: ChannelPlatform;
  href: string;
  /** The channel name to show next to the platform, e.g. "@bankshasbank" or "fazebanks". */
  name?: string;
};

/** A member's own YouTube and Twitch channels, YouTube first. Empty when none are listed. */
export function getChannelLinks(member: MemberProfile): ChannelLink[] {
  const channels = member.channels;
  const links: ChannelLink[] = [];
  if (channels?.youtubeChannelId) {
    links.push({
      platform: "YouTube",
      href: `https://www.youtube.com/channel/${channels.youtubeChannelId}`,
      name: channels.youtubeHandle,
    });
  } else if (channels?.youtubeHandle) {
    links.push({
      platform: "YouTube",
      href: `https://www.youtube.com/${channels.youtubeHandle}`,
      name: channels.youtubeHandle,
    });
  }
  if (channels?.twitch) {
    links.push({
      platform: "Twitch",
      href: `https://www.twitch.tv/${channels.twitch}`,
      name: channels.twitch,
    });
  }
  return links;
}
