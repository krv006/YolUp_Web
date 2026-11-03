import { describe, expect, it } from "vitest";
import { deviceKind, filterLogins, loginKind, loginSummary, type DeviceKind, type LoginEntry } from "./parent-logins";

const NOW = new Date(2026, 9, 29, 17, 40).getTime();
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36";
const TABLET = "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 Chrome/129.0 Safari/537.36";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129.0 Safari/537.36";
const login = (id: string, when: string, userAgent: string, isNewDevice = false): LoginEntry => ({
  id,
  at: when,
  ip: "82.215.82.120",
  device: "",
  userAgent,
  location: "",
  isNewDevice,
  isNewIp: false,
});
const ALL = new Set<DeviceKind>(["phone", "tablet", "computer"]);
const logins = [
  login("a", at(29, 17, 30), IPHONE),
  login("b", at(29, 15, 7), ANDROID, true),
  login("c", at(29, 15, 13), MAC),
  login("d", at(28, 21, 5), IPHONE),
  login("e", at(26, 19, 40), TABLET),
  login("f", at(10, 9), MAC, true),
];

describe("deviceKind", () => {
  it("tells phones, tablets and computers apart", () => {
    expect(deviceKind(IPHONE)).toBe("phone");
    expect(deviceKind(ANDROID)).toBe("phone");
    expect(deviceKind(TABLET)).toBe("tablet");
    expect(deviceKind(MAC)).toBe("computer");
    expect(deviceKind("YolUp/1.4 (iOS 17)")).toBe("phone");
  });
});

describe("filterLogins", () => {
  it("filters by period, tab and device kinds", () => {
    const base = { period: "week" as const, tab: "all" as const, kinds: ALL };
    expect(filterLogins(logins, base, NOW).map((item) => item.id)).toEqual(["a", "c", "b", "d", "e"]);
    expect(filterLogins(logins, { ...base, period: "today" }, NOW).map((item) => item.id)).toEqual(["a", "c", "b"]);
    expect(filterLogins(logins, { ...base, tab: "phone" }, NOW).map((item) => item.id)).toEqual(["a", "b", "d", "e"]);
    expect(filterLogins(logins, { ...base, tab: "computer" }, NOW).map((item) => item.id)).toEqual(["c"]);
    expect(filterLogins(logins, { ...base, period: "month", tab: "suspicious" }, NOW).map((item) => item.id)).toEqual(["b", "f"]);
    expect(filterLogins(logins, { ...base, kinds: new Set<DeviceKind>(["computer"]) }, NOW).map((item) => item.id)).toEqual(["c"]);
  });
});

describe("loginSummary", () => {
  it("counts logins, distinct devices and new devices in the period", () => {
    expect(loginSummary(logins, "week", NOW)).toEqual({ count: 5, devices: 4, suspicious: 1 });
    expect(loginSummary([], "week", NOW)).toEqual({ count: 0, devices: 0, suspicious: 0 });
  });
});

describe("loginKind", () => {
  it("prefers the server device type over the user agent", () => {
    expect(loginKind({ userAgent: MAC, device: "", deviceType: "phone" })).toBe("phone");
    expect(loginKind({ userAgent: "", device: "Chrome · Android", deviceType: "tablet" })).toBe("tablet");
  });

  it("falls back to the user agent, then to the device label", () => {
    expect(loginKind({ userAgent: IPHONE, device: "", deviceType: null })).toBe("phone");
    expect(loginKind({ userAgent: "", device: "YolUp · iOS" })).toBe("phone");
    expect(loginKind({ userAgent: "", device: "Chrome · macOS" })).toBe("computer");
  });
});
