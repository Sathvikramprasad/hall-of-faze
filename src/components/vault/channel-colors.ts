import type { ChannelPlatform } from "@/lib/vault/channels";

/** Brand-colored button backgrounds; both keep white text above 4.5:1. */
export const CHANNEL_BUTTON_COLORS: Record<ChannelPlatform, string> = {
  YouTube: "bg-[#cc0000] hover:bg-[#a80000]",
  Twitch: "bg-[#9146ff] hover:bg-[#772ce8]",
};
