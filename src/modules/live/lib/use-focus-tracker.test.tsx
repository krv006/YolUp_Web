import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendFocus = vi.fn();
const toastWarning = vi.fn();
const toastError = vi.fn();

vi.mock("../api/live.api", () => ({ liveApi: { sendFocus: (...args: unknown[]) => sendFocus(...args) } }));
vi.mock("sonner", () => ({ toast: { warning: (...args: unknown[]) => toastWarning(...args), error: (...args: unknown[]) => toastError(...args) } }));

import { useFocusTracker } from "./use-focus-tracker";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ lessonId, enabled }: { lessonId: string | undefined; enabled: boolean }) {
  useFocusTracker(lessonId, enabled);
  return null;
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useFocusTracker", () => {
  let root: Root;
  let container: HTMLElement;

  function mount(lessonId: string | undefined, enabled: boolean) {
    act(() => root.render(<Probe lessonId={lessonId} enabled={enabled} />));
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    sendFocus.mockReset();
    toastWarning.mockReset();
    toastError.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    setHidden(false);
    vi.useRealTimers();
  });

  it("reports an exit and warns the student when the tab is hidden", async () => {
    sendFocus.mockResolvedValue({ tracked: true, exitCount: 1, threshold: 3, parentNotified: false });
    mount("lesson-1", true);
    act(() => setHidden(true));
    await flush();
    expect(sendFocus).toHaveBeenCalledWith("lesson-1", "exit");
    expect(toastWarning).toHaveBeenCalledTimes(1);
    expect(String(toastWarning.mock.calls[0][0])).toContain("1/3");
    expect(String(toastWarning.mock.calls[0][0])).toContain("Yana 2 marta");
  });

  it("tells the student the parent was notified once the threshold is reached", async () => {
    sendFocus.mockResolvedValue({ tracked: true, exitCount: 3, threshold: 3, parentNotified: true });
    mount("lesson-1", true);
    act(() => setHidden(true));
    await flush();
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(String(toastError.mock.calls[0][0])).toContain("ota-onangizga xabar berildi");
  });

  it("reports the return when the student comes back", async () => {
    sendFocus.mockResolvedValue({ tracked: false, exitCount: 0, threshold: 0, parentNotified: false });
    mount("lesson-1", true);
    act(() => setHidden(true));
    await flush();
    vi.setSystemTime(Date.now() + 5_000);
    act(() => setHidden(false));
    await flush();
    expect(sendFocus.mock.calls.map((call) => call[1])).toEqual(["exit", "return"]);
  });

  it("counts a window blur as an exit and dedupes the visibility event that follows", async () => {
    sendFocus.mockResolvedValue({ tracked: true, exitCount: 1, threshold: 3, parentNotified: false });
    mount("lesson-1", true);
    act(() => {
      window.dispatchEvent(new Event("blur"));
      setHidden(true);
    });
    await flush();
    expect(sendFocus).toHaveBeenCalledTimes(1);
  });

  it("does nothing for the teacher (disabled) or without a lesson", async () => {
    mount("lesson-1", false);
    act(() => setHidden(true));
    await flush();
    act(() => root.render(<Probe lessonId={undefined} enabled />));
    act(() => setHidden(false));
    act(() => setHidden(true));
    await flush();
    expect(sendFocus).not.toHaveBeenCalled();
  });
});
