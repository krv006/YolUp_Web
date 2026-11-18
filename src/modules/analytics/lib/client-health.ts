export interface ClientHealthUser {
  userId: string;
  username: string;
  role: string;
  reports: number;
  cpuLimitedReports: number;
  bandwidthLimitedReports: number;
  minFps: number | null;
  lastAt: string | null;
  cores: number | null;
  memoryGb: number | null;
  userAgent: string;
}

export interface ClientHealthSummary {
  hours: number;
  total: number;
  cpuLimitedTotal: number;
  users: ClientHealthUser[];
}

interface ClientHealthUserDto {
  user_id?: string | number | null;
  username?: string | null;
  role?: string | null;
  reports?: number | null;
  cpu_limited_reports?: number | null;
  bandwidth_limited_reports?: number | null;
  min_fps?: number | null;
  last_at?: string | null;
  hardware_concurrency?: number | null;
  device_memory_gb?: number | null;
  user_agent?: string | null;
}

interface ClientHealthDto {
  hours?: number | null;
  total?: number | null;
  cpu_limited_total?: number | null;
  users?: ClientHealthUserDto[] | null;
}

function numberOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapClientHealth(raw: unknown, fallbackHours: number): ClientHealthSummary {
  const dto = (raw ?? {}) as ClientHealthDto;
  const users = (dto.users ?? []).map((item) => ({
    userId: String(item.user_id ?? ""),
    username: item.username ?? "",
    role: item.role ?? "",
    reports: Number(item.reports ?? 0),
    cpuLimitedReports: Number(item.cpu_limited_reports ?? 0),
    bandwidthLimitedReports: Number(item.bandwidth_limited_reports ?? 0),
    minFps: numberOrNull(item.min_fps),
    lastAt: item.last_at ?? null,
    cores: numberOrNull(item.hardware_concurrency),
    memoryGb: numberOrNull(item.device_memory_gb),
    userAgent: item.user_agent ?? "",
  }));
  users.sort(
    (a, b) =>
      b.cpuLimitedReports - a.cpuLimitedReports ||
      (a.minFps ?? Number.POSITIVE_INFINITY) - (b.minFps ?? Number.POSITIVE_INFINITY) ||
      b.reports - a.reports
  );
  return {
    hours: Number(dto.hours ?? fallbackHours),
    total: Number(dto.total ?? 0),
    cpuLimitedTotal: Number(dto.cpu_limited_total ?? 0),
    users,
  };
}

const BROWSERS: Array<[RegExp, string]> = [
  [/Edg\/(\d+)/, "Edge"],
  [/OPR\/(\d+)/, "Opera"],
  [/YaBrowser\/(\d+)/, "Yandex"],
  [/Firefox\/(\d+)/, "Firefox"],
  [/Chrome\/(\d+)/, "Chrome"],
  [/Version\/(\d+)[^ ]* Safari/, "Safari"],
];

const SYSTEMS: Array<[RegExp, string]> = [
  [/Android/, "Android"],
  [/iPhone|iPad/, "iOS"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
];

export function shortUserAgent(userAgent: string): string {
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent));
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent));
  const version = browser ? userAgent.match(browser[0])?.[1] : null;
  return [browser ? `${browser[1]}${version ? ` ${version}` : ""}` : "", system?.[1] ?? ""].filter(Boolean).join(" · ");
}
