export const OPEN_FAZE_BOT_EVENT = "hall-of-faze:open-faze-bot";

export function openFazeBot() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_FAZE_BOT_EVENT));
  }
}
