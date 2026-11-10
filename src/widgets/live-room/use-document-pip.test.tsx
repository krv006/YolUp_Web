import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentPip } from "./use-document-pip";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Pip = ReturnType<typeof useDocumentPip>;

let latest: Pip | null = null;

function remember(value: Pip) {
  latest = value;
}

function Probe() {
  const pip = useDocumentPip({ width: 380, height: 200, title: "Dars boshqaruvi" });
  useEffect(() => remember(pip));
  return null;
}

function fakePipWindow() {
  const pipDocument = document.implementation.createHTMLDocument("");
  const listeners = new Map<string, () => void>();
  return {
    document: pipDocument,
    close: vi.fn(),
    focus: vi.fn(),
    addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
    fire: (type: string) => listeners.get(type)?.(),
  };
}

describe("useDocumentPip", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    delete (window as { documentPictureInPicture?: unknown }).documentPictureInPicture;
    latest = null;
  });

  it("reports no support when the browser has no Document Picture-in-Picture", () => {
    act(() => root.render(<Probe />));
    expect(latest?.supported).toBe(false);
  });

  it("opens a window with the page styles and forgets it when the user closes it", async () => {
    const style = document.createElement("style");
    style.textContent = ".live-control { width: 48px; }";
    document.head.appendChild(style);
    const pip = fakePipWindow();
    const api = { window: null as unknown, requestWindow: vi.fn(async () => pip) };
    (window as { documentPictureInPicture?: unknown }).documentPictureInPicture = api;

    act(() => root.render(<Probe />));
    expect(latest?.supported).toBe(true);
    await act(async () => {
      await latest?.open();
    });

    expect(api.requestWindow).toHaveBeenCalledWith({ width: 380, height: 200 });
    expect(latest?.pipWindow).toBe(pip);
    expect(pip.document.title).toBe("Dars boshqaruvi");
    expect(pip.document.head.textContent).toContain(".live-control");
    expect(pip.document.querySelector("base")?.getAttribute("href")).toBe(document.baseURI);

    act(() => pip.fire("pagehide"));
    expect(latest?.pipWindow).toBeNull();
    style.remove();
  });

  it("closes the open window", async () => {
    const pip = fakePipWindow();
    const api = { window: pip, requestWindow: vi.fn() };
    (window as { documentPictureInPicture?: unknown }).documentPictureInPicture = api;

    act(() => root.render(<Probe />));
    act(() => latest?.close());
    expect(pip.close).toHaveBeenCalled();
  });
});
