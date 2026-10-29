import { Blob as NodeBlob } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES, AppError } from "@/shared/api";
import { chunkStore, isRetryableUpload, MAX_LEFTOVER_AGE_MS, runExclusive, uploadWithRetry } from "./recording-upload-queue";

const chunk = (over: Partial<Parameters<typeof chunkStore.put>[0]> = {}) => ({
  lessonId: "L1",
  kind: "video" as const,
  session: "s1",
  index: 0,
  blob: new Blob(["x"]),
  createdAt: Date.now(),
  ...over,
});

async function clearAll() {
  for (const [lesson, kind] of [["L1", "video"], ["L1", "audio"], ["L2", "video"]] as const) {
    for (const leftover of await chunkStore.leftovers(lesson, kind, new Set())) await chunkStore.remove(leftover);
  }
}

describe("chunkStore (IndexedDB)", () => {
  beforeEach(clearAll);

  it("returns what was put, oldest session first and by index inside a session", async () => {
    const now = Date.now();
    await chunkStore.put(chunk({ session: "b", index: 1, createdAt: now }));
    await chunkStore.put(chunk({ session: "a", index: 1, createdAt: now - 1000 }));
    await chunkStore.put(chunk({ session: "a", index: 0, createdAt: now - 1000 }));
    const result = await chunkStore.leftovers("L1", "video", new Set());
    expect(result.map((c) => `${c.session}${c.index}`)).toEqual(["a0", "a1", "b1"]);
  });

  it("is scoped by lesson and by kind", async () => {
    await chunkStore.put(chunk());
    await chunkStore.put(chunk({ kind: "audio" }));
    await chunkStore.put(chunk({ lessonId: "L2" }));
    expect(await chunkStore.leftovers("L1", "video", new Set())).toHaveLength(1);
    expect(await chunkStore.leftovers("L1", "audio", new Set())).toHaveLength(1);
    expect(await chunkStore.leftovers("L3", "video", new Set())).toHaveLength(0);
  });

  it("skips sessions that are alive in this page", async () => {
    await chunkStore.put(chunk({ session: "alive" }));
    await chunkStore.put(chunk({ session: "gone" }));
    const result = await chunkStore.leftovers("L1", "video", new Set(["alive"]));
    expect(result.map((c) => c.session)).toEqual(["gone"]);
  });

  it("removes a chunk once it was uploaded and keeps the blob content", async () => {
    // jsdom'ning Blob'i Node'ning structuredClone'idan o'tmaydi (faqat sinov muhiti); brauzerda Blob'lar saqlanadi
    await chunkStore.put(chunk({ blob: new NodeBlob(["salom"]) as unknown as Blob }));
    const [stored] = await chunkStore.leftovers("L1", "video", new Set());
    expect(stored?.blob.size).toBe(5);
    await chunkStore.remove(chunk());
    expect(await chunkStore.leftovers("L1", "video", new Set())).toHaveLength(0);
  });

  it("drops leftovers older than two days", async () => {
    await chunkStore.put(chunk({ session: "old", createdAt: Date.now() - MAX_LEFTOVER_AGE_MS - 1000 }));
    await chunkStore.put(chunk({ session: "fresh" }));
    expect((await chunkStore.leftovers("L1", "video", new Set())).map((c) => c.session)).toEqual(["fresh"]);
    expect(await chunkStore.leftovers("L1", "video", new Set())).toHaveLength(1);
  });
});

describe("runExclusive", () => {
  it("runs tasks with the same key one after another, in call order", async () => {
    const log: string[] = [];
    const task = (name: string, ms: number) => async () => {
      log.push(`start ${name}`);
      await new Promise((resolve) => setTimeout(resolve, ms));
      log.push(`end ${name}`);
    };
    await Promise.all([runExclusive("k", task("a", 20)), runExclusive("k", task("b", 1))]);
    expect(log).toEqual(["start a", "end a", "start b", "end b"]);
  });

  it("does not block different keys and survives a failing task", async () => {
    await expect(runExclusive("x", () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(runExclusive("x", async () => "next")).resolves.toBe("next");
    const order: string[] = [];
    await Promise.all([
      runExclusive("p", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        order.push("p");
      }),
      runExclusive("q", async () => {
        order.push("q");
      }),
    ]);
    expect(order).toEqual(["q", "p"]);
  });
});

describe("uploadWithRetry", () => {
  it("retries transient failures with backoff and then succeeds", async () => {
    vi.useFakeTimers();
    const send = vi
      .fn()
      .mockRejectedValueOnce(new AppError({ code: API_ERROR_CODES.NETWORK_ERROR, status: 0 }))
      .mockRejectedValueOnce(new AppError({ code: API_ERROR_CODES.SERVER_ERROR, status: 503 }))
      .mockResolvedValueOnce(undefined);
    const onRetry = vi.fn();
    const promise = uploadWithRetry(send, onRetry);
    await vi.advanceTimersByTimeAsync(1_000);
    await vi.advanceTimersByTimeAsync(2_000);
    await promise;
    expect(send).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("gives up immediately on non-retryable errors", async () => {
    const send = vi.fn().mockRejectedValue(new AppError({ code: API_ERROR_CODES.FORBIDDEN, status: 403 }));
    await expect(uploadWithRetry(send)).rejects.toMatchObject({ status: 403 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("classifies errors", () => {
    expect(isRetryableUpload(new AppError({ status: 0 }))).toBe(true);
    expect(isRetryableUpload(new AppError({ status: 408 }))).toBe(true);
    expect(isRetryableUpload(new AppError({ status: 429 }))).toBe(true);
    expect(isRetryableUpload(new AppError({ status: 500 }))).toBe(true);
    expect(isRetryableUpload(new AppError({ status: 400 }))).toBe(false);
    expect(isRetryableUpload(new AppError({ status: 404 }))).toBe(false);
    expect(isRetryableUpload(new TypeError("Failed to fetch"))).toBe(true);
  });
});
