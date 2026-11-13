import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecordingStartDialog } from "./recording-start-dialog";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  choice: { postRecording: null as boolean | null, decided: false },
  save: vi.fn(),
  capture: vi.fn(),
}));

vi.mock("@/modules/lesson", () => ({
  useRecordingChoice: () => ({ data: mocks.choice }),
  useSetRecordingChoice: () => ({ mutate: mocks.save }),
}));

vi.mock("@/modules/live", () => ({ requestScreenCapture: () => mocks.capture() }));

function fakeStream(withAudio: boolean) {
  const stop = vi.fn();
  const audio = withAudio ? [{ stop }] : [];
  return { stop, stream: { getAudioTracks: () => audio, getTracks: () => [{ stop }, ...audio] } as unknown as MediaStream };
}

let root: Root;
let host: HTMLDivElement;
const onClose = vi.fn();
const onScreen = vi.fn();

function render(withScreen = true) {
  act(() => {
    root.render(<RecordingStartDialog lessonId="l1" open withScreen={withScreen} onClose={onClose} onScreen={onScreen} />);
  });
}

function button(label: string) {
  const found = [...document.body.querySelectorAll("button")].find((item) => item.textContent === label);
  if (!found) throw new Error(`button ${label} not found`);
  return found;
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  mocks.choice = { postRecording: null, decided: false };
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getDisplayMedia: vi.fn() } });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.clearAllMocks();
});

describe("recording start dialog", () => {
  it("remembers the default choice when the teacher starts later", async () => {
    render();
    await click(button("recordingStart.later"));
    expect(mocks.save).toHaveBeenCalledWith(true);
    expect(onClose).toHaveBeenCalled();
    expect(onScreen).not.toHaveBeenCalled();
  });

  it("starts recording with the shared screen and the chosen option", async () => {
    const { stream } = fakeStream(true);
    mocks.capture.mockResolvedValue(stream);
    render();
    await click(document.body.querySelector('[role="switch"]') as Element);
    await click(button("recordingStart.start"));
    expect(onScreen).toHaveBeenCalledWith(stream);
    expect(mocks.save).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the dialog open when the screen audio is missing", async () => {
    const { stream, stop } = fakeStream(false);
    mocks.capture.mockResolvedValue(stream);
    render();
    await click(button("recordingStart.start"));
    expect(stop).toHaveBeenCalled();
    expect(onScreen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.querySelector('[role="alert"]')?.textContent).toBe("recordingStart.noAudio");
  });

  it("does not save again when the choice was already made", async () => {
    mocks.choice = { postRecording: false, decided: true };
    render(false);
    await click(button("recordingStart.continue"));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
