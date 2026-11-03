import { startOfDay } from "./parent-home";

const DAY_MS = 86_400_000;

export type DeviceKind = "phone" | "tablet" | "computer";
export type LoginPeriod = "today" | "week" | "month";
export type LoginTab = "all" | "phone" | "computer" | "suspicious";

export interface LoginEntry {
  id: string;
  at: string;
  ip: string;
  device: string;
  userAgent: string;
  location: string;
  isNewDevice: boolean;
  isNewIp: boolean;
  deviceType?: DeviceKind | null;
  loginId?: string | null;
  browser?: string;
  os?: string;
  sessionId?: string | null;
  sessionActive?: boolean | null;
  durationSeconds?: number | null;
}

export function deviceKind(userAgent: string): DeviceKind {
  if (/ipad|tablet|kindle|silk/i.test(userAgent) || (/android/i.test(userAgent) && !/mobi/i.test(userAgent))) return "tablet";
  if (/mobi|iphone|ipod|android|yolup/i.test(userAgent)) return "phone";
  return "computer";
}

export function loginKind(login: Pick<LoginEntry, "userAgent" | "device" | "deviceType">): DeviceKind {
  return login.deviceType ?? deviceKind(login.userAgent || login.device);
}

export function periodFrom(now: number, period: LoginPeriod): number {
  if (period === "today") return startOfDay(now).getTime();
  return now - (period === "week" ? 7 : 30) * DAY_MS;
}

export function filterLogins(
  logins: LoginEntry[],
  { period, tab, kinds }: { period: LoginPeriod; tab: LoginTab; kinds: ReadonlySet<DeviceKind> },
  now: number
): LoginEntry[] {
  const from = periodFrom(now, period);
  return logins
    .filter((login) => {
      if (Date.parse(login.at) < from) return false;
      const kind = loginKind(login);
      if (!kinds.has(kind)) return false;
      if (tab === "suspicious") return login.isNewDevice;
      if (tab === "phone") return kind === "phone" || kind === "tablet";
      if (tab === "computer") return kind === "computer";
      return true;
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function loginSummary(logins: LoginEntry[], period: LoginPeriod, now: number) {
  const from = periodFrom(now, period);
  const inPeriod = logins.filter((login) => Date.parse(login.at) >= from);
  return {
    count: inPeriod.length,
    devices: new Set(inPeriod.map((login) => login.userAgent || login.device)).size,
    suspicious: inPeriod.filter((login) => login.isNewDevice).length,
  };
}
