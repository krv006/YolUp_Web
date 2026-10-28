import { useCallback, useRef } from "react";

export function useWheelScrollX<T extends HTMLElement>() {
  const cleanup = useRef<(() => void) | null>(null);

  return useCallback((node: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || node.scrollWidth <= node.clientWidth) return;
      event.preventDefault();
      node.scrollLeft += event.deltaY;
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    cleanup.current = () => node.removeEventListener("wheel", onWheel);
  }, []);
}
