import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { useAuthStore } from "./auth.store";

afterEach(() => vi.restoreAllMocks());

describe("switching role", () => {
  it("reloads /auth/me/ after the switch so the role switcher uses fresh data", async () => {
    const switched = { id: "p1", username: "ota", role: "parent", available_roles: [], role_switch_blocked: null, linked_accounts: [] };
    const fresh = { ...switched, linked_accounts: [{ id: "t1", username: "ali", role: "teacher", name: "Ali" }] };
    vi.spyOn(apiClient, "post").mockResolvedValue({ access: "a", refresh: "r", user: switched });
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(fresh);
    const user = await useAuthStore.getState().switchRole("parent");
    expect(get).toHaveBeenCalledWith("/api/v1/auth/me/");
    expect(user.linkedAccounts).toHaveLength(1);
    expect(useAuthStore.getState().user?.linkedAccounts).toHaveLength(1);
  });

  it("keeps the switched user when the reload fails", async () => {
    const switched = { id: "p1", username: "ota", role: "parent", linked_accounts: [] };
    vi.spyOn(apiClient, "post").mockResolvedValue({ access: "a", refresh: "r", user: switched });
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("offline"));
    const user = await useAuthStore.getState().switchRole("parent");
    expect(user.id).toBe("p1");
    expect(useAuthStore.getState().user?.id).toBe("p1");
  });
});
