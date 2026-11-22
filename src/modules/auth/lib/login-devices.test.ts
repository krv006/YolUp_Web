import { describe, expect, it } from "vitest";
import { mapLoginDevicesPage } from "./auth.mappers";

describe("mapLoginDevicesPage", () => {
  it("maps one row per device with its last sign-in", () => {
    const page = mapLoginDevicesPage(
      {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            device: "Chrome · Windows",
            browser: "Chrome",
            os: "Windows",
            device_type: "computer",
            last_login_at: "2026-11-21T09:30:00Z",
            first_login_at: "2026-11-01T08:00:00Z",
            login_count: 14,
            last_ip: "84.54.1.2",
            location: "Toshkent",
            country: "UZ",
            session_active: true,
            is_current: true,
            last_login_id: "a1",
          },
          { device: "", browser: "Safari", os: "iOS", device_type: "phone", last_login_at: "2026-11-20T18:00:00Z" },
        ],
      },
      { page: 1, pageSize: 10 }
    );
    expect(page.total).toBe(2);
    expect(page.items[0]).toMatchObject({
      id: "a1",
      device: "Chrome · Windows",
      loginCount: 14,
      lastIp: "84.54.1.2",
      location: "Toshkent, UZ",
      sessionActive: true,
      isCurrent: true,
      lastLoginId: "a1",
    });
    expect(page.items[1]).toMatchObject({ device: "Safari · iOS", deviceType: "phone", loginCount: 1, lastIp: "", sessionActive: false });
  });
});
