import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { xhrFetch } from "./xhr-fetch";

let server: Server;
let base = "";

beforeAll(async () => {
  server = createServer((request, response) => {
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
    });
    request.on("end", () => {
      response.writeHead(request.method === "OPTIONS" ? 204 : request.url === "/fail" ? 400 : 201, {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "POST",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-Size": String(size),
      });
      response.end(request.method === "OPTIONS" ? "" : JSON.stringify({ size }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("xhrFetch", () => {
  it("reports upload progress and returns a normal Response", async () => {
    const progress: number[] = [];
    const body = new Blob([new Uint8Array(2 * 1024 * 1024)]);
    const response = await xhrFetch(`${base}/ok`, { method: "POST", body }, (fraction) => progress.push(fraction));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ size: body.size });
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.at(-1)).toBe(1);
  });

  it("keeps error statuses and stops on abort", async () => {
    expect((await xhrFetch(`${base}/fail`, { method: "POST", body: new Blob(["x"]) }, () => undefined)).status).toBe(400);
    const controller = new AbortController();
    controller.abort();
    await expect(xhrFetch(`${base}/ok`, { method: "POST", body: "x", signal: controller.signal }, () => undefined)).rejects.toMatchObject({ name: "AbortError" });
  });
});
