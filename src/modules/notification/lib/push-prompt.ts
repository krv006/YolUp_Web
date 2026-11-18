export const PUSH_PROMPT_KEY = "fokus_push_prompt_later";
export const PUSH_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function pushPromptSnoozed(storedAt: string | null, now = Date.now()): boolean {
  const at = Number(storedAt);
  return Number.isFinite(at) && at > 0 && now - at < PUSH_PROMPT_SNOOZE_MS;
}

export function shouldOfferPush({
  supported,
  permission,
  snoozed,
}: {
  supported: boolean;
  permission: NotificationPermission | null;
  snoozed: boolean;
}): boolean {
  return supported && permission === "default" && !snoozed;
}
