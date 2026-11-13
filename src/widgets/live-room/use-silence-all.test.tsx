import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSilenceAll } from "./use-silence-all";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ mute: vi.fn(), cameras: vi.fn(), success: vi.fn() }));

vi.mock("@/modules/live", () => ({
  useMuteAll: () => ({ mutateAsync: mocks.mute, isPending: false }),
  useCameraOffAll: () => ({ mutateAsync: mocks.cameras, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));

let run: () => void = () => undefined;
function Probe() {
  const silence = useSilenceAll("l1");
  useEffect(() => {
    run = silence.run;
  });
  return null;
}

let root: Root;
beforeEach(() => {
  root = createRoot(document.createElement("div"));
  act(() => root.render(<Probe />));
});
afterEach(() => {
  act(() => root.unmount());
  vi.clearAllMocks();
});

describe("silence everyone", () => {
  it("turns off every mic and camera in one press", async () => {
    mocks.mute.mockResolvedValue(4);
    mocks.cameras.mockResolvedValue(3);
    await act(async () => run());
    expect(mocks.mute).toHaveBeenCalledWith([]);
    expect(mocks.cameras).toHaveBeenCalledWith([]);
    expect(mocks.success).toHaveBeenCalledWith("silenceAll.done");
  });

  it("stays quiet on success toast when one of the calls fails", async () => {
    mocks.mute.mockResolvedValue(4);
    mocks.cameras.mockRejectedValue(new Error("x"));
    await act(async () => run());
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
