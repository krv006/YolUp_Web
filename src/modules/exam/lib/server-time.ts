let offsetMs = 0;
let synced = false;

export function syncServerTime(serverNow: string | null | undefined): void {
  if (!serverNow) return;
  const server = new Date(serverNow).getTime();
  if (Number.isNaN(server)) return;
  offsetMs = server - Date.now();
  synced = true;
}

export function serverTimeOffset(): number {
  return offsetMs;
}

export function isServerTimeSynced(): boolean {
  return synced;
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

export function secondsUntil(deadline: string | null | undefined): number {
  if (!deadline) return 0;
  const target = new Date(deadline).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.round((target - serverNow()) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
