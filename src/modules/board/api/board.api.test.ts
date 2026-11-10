import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { mapBoardDto } from "../lib/board.mappers";
import { boardApi } from "./board.api";

afterEach(() => vi.restoreAllMocks());

describe("boardApi.updateStroke", () => {
  it("sends only the parts of the edit that were given", async () => {
    const patch = vi.spyOn(apiClient, "patch").mockResolvedValue({ id: "a1", type: "text", text: "Yangi", x: 1, y: 2 });
    await boardApi.updateStroke("l1", 0, "a1", { changes: { text: "Yangi" } });
    expect(patch).toHaveBeenCalledWith("/api/v1/board/l1/stroke/a1/", { sheet: 0, changes: { text: "Yangi" } });
    await boardApi.updateStroke("l1", 2, "a1", { move: [40, -15] });
    expect(patch).toHaveBeenLastCalledWith("/api/v1/board/l1/stroke/a1/", { sheet: 2, move: [40, -15] });
  });
});

describe("mapBoardDto code fields", () => {
  it("reads the code flag and the server language list", () => {
    const state = mapBoardDto({ code_enabled: true, code_languages: [{ id: "auto", label: "Avto" }, { id: "sql", label: "SQL" }] });
    expect(state.codeEnabled).toBe(true);
    expect(state.codeLanguages.map((item) => item.id)).toEqual(["auto", "sql"]);
  });

  it("falls back to the built-in list when the server sends none", () => {
    const state = mapBoardDto({});
    expect(state.codeEnabled).toBe(false);
    expect(state.codeLanguages[0]).toEqual({ id: "auto", label: "Avto" });
    expect(state.codeLanguages.some((item) => item.id === "csharp")).toBe(true);
  });
});
