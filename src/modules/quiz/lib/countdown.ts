export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

export function secondsUntil(target: string | null, now: number): number | null {
  if (!target) return null;
  const end = Date.parse(target);
  return Number.isFinite(end) ? Math.max(0, Math.ceil((end - now) / 1000)) : null;
}
