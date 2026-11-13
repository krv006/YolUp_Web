import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScreenShareRelease } from "./use-screen-share-release";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({ sharing: false, release: vi.fn() }));

vi.mock("@livekit/components-react", () => ({ useLocalParticipant: () => ({ isScreenShareEnabled: mocks.sharing }) }));
vi.mock("@/modules/live", () => ({ useReleaseMedia: () => ({ mutate: mocks.release }) }));

function Probe({ enabled }: { enabled: boolean }) {
  useScreenShareRelease("l1", enabled);
  return null;
}

let root: Root;

function render(sharing: boolean, enabled = true) {
  mocks.sharing = sharing;
  act(() => root.render(<Probe enabled={enabled} />));
}

beforeEach(() => {
  root = createRoot(document.createElement("div"));
});

afterEach(() => {
  act(() => root.unmount());
  vi.clearAllMocks();
});

describe("one-time screen share permission", () => {
  it("gives the permission back once the student stops sharing", () => {
    render(false);
    render(true);
    expect(mocks.release).not.toHaveBeenCalled();
    render(false);
    expect(mocks.release).toHaveBeenCalledTimes(1);
    expect(mocks.release).toHaveBeenCalledWith("screen");
    render(false);
    expect(mocks.release).toHaveBeenCalledTimes(1);
  });

  it("does nothing for someone who never shared or for the teacher", () => {
    render(false);
    expect(mocks.release).not.toHaveBeenCalled();
    render(true, false);
    render(false, false);
    expect(mocks.release).not.toHaveBeenCalled();
  });
});
