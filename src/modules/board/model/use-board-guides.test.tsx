import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BOARD_GUIDES_KEY, useBoardGuides } from "./use-board-guides";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;

function Probe() {
  const { guides, toggleGuides } = useBoardGuides();
  return (
    <button type="button" onClick={toggleGuides}>
      {guides ? "on" : "off"}
    </button>
  );
}

function mount() {
  root = createRoot(host);
  act(() => root.render(<Probe />));
}

function button() {
  return host.querySelector("button") as HTMLButtonElement;
}

function toggle() {
  act(() => button().dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  localStorage.removeItem(BOARD_GUIDES_KEY);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("board guides", () => {
  it("starts hidden and remembers the choice for the next visit", () => {
    mount();
    expect(button().textContent).toBe("off");
    toggle();
    expect(button().textContent).toBe("on");
    expect(localStorage.getItem(BOARD_GUIDES_KEY)).toBe("1");
    act(() => root.unmount());
    mount();
    expect(button().textContent).toBe("on");
    toggle();
    expect(localStorage.getItem(BOARD_GUIDES_KEY)).toBe("0");
  });
});
