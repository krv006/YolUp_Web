import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StrokeDto } from "@/modules/board";
import { homeworkApi } from "../api/homework.api";
import { homeworkKeys, useSaveHomeworkBoard } from "./homework.queries";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const stroke = (id: string) => ({ id, type: "pen", points: [[0, 0]] }) as unknown as StrokeDto;
const oldBoard = { sheets: [[stroke("old")]], width: 1600, height: 900 };

let root: Root;
let host: HTMLDivElement;
let client: QueryClient;
const probe: { save?: ReturnType<typeof useSaveHomeworkBoard> } = {};

function Probe() {
  const save = useSaveHomeworkBoard("a1");
  useEffect(() => {
    probe.save = save;
  });
  return null;
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
  client.setQueryData(homeworkKeys.board("a1"), oldBoard);
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

describe("homework board cache", () => {
  it("keeps the saved board in the cache so reopening it does not bring back the old state", async () => {
    const next = [[stroke("old"), stroke("new")]];
    let finish: (value: typeof oldBoard) => void = () => undefined;
    vi.spyOn(homeworkApi, "saveBoard").mockReturnValue(new Promise((resolve) => (finish = resolve)));
    let request: Promise<unknown> = Promise.resolve();
    await act(async () => {
      request = probe.save!.mutateAsync(next);
    });
    expect(client.getQueryData(homeworkKeys.board("a1"))).toMatchObject({ sheets: next, width: 1600 });
    const server = { sheets: next, width: 1600, height: 900 };
    await act(async () => {
      finish(server);
      await request;
    });
    expect(client.getQueryData(homeworkKeys.board("a1"))).toEqual(server);
  });

  it("asks the server again after a failed save", async () => {
    vi.spyOn(homeworkApi, "saveBoard").mockRejectedValue(new Error("offline"));
    await act(async () => {
      await probe.save!.mutateAsync([[stroke("new")]]).catch(() => undefined);
    });
    expect(client.getQueryState(homeworkKeys.board("a1"))?.isInvalidated).toBe(true);
  });
});
