import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { homeworkApi } from "../api/homework.api";
import { useHomeworkFocusTracker } from "./use-homework-focus";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ enabled }: { enabled: boolean }) {
  useHomeworkFocusTracker("a1", enabled);
  return null;
}

let root: Root;
let host: HTMLDivElement;
let send: MockInstance<typeof homeworkApi.sendFocus>;

function render(enabled = true) {
  act(() => root.render(<Probe enabled={enabled} />));
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  send = vi.spyOn(homeworkApi, "sendFocus").mockResolvedValue(undefined);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

const kinds = () => send.mock.calls.map((call) => call[1]);

describe("homework focus tracker", () => {
  it("sends one exit and one return per absence, even when blur and visibility both fire", () => {
    render();
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("focus"));
    expect(kinds()).toEqual(["exit", "return"]);
  });

  it("does not count opening the file picker as leaving the page", () => {
    render();
    const input = document.createElement("input");
    input.type = "file";
    document.body.append(input);
    input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));
    expect(kinds()).toEqual([]);
    window.dispatchEvent(new Event("blur"));
    expect(kinds()).toEqual(["exit"]);
    input.remove();
  });

  it("stays silent when tracking is off", () => {
    render(false);
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));
    expect(send).not.toHaveBeenCalled();
  });
});
