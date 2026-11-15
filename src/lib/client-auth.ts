export const AUTH_CHANGED_EVENT = "hall-of-faze:auth-changed";

export function announceAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
