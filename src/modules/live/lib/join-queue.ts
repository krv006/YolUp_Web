export const JOIN_DELAY_LIMIT_MS = 5 * 60_000;

export function joinDelayTooLong(delayMs: number): boolean {
  return delayMs > JOIN_DELAY_LIMIT_MS;
}

export function queueSecondsLeft(readyAt: number, now: number): number {
  return Math.max(0, Math.ceil((readyAt - now) / 1000));
}
