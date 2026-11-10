import { useEffect, useRef } from "react";
import { clampZoom } from "@/shared/lib";

function distance(touches: TouchList): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function useZoomGestures(element: HTMLElement | null, zoom: number, onZoom: (zoom: number) => void) {
  const current = useRef(zoom);
  const apply = useRef(onZoom);

  useEffect(() => {
    current.current = zoom;
    apply.current = onZoom;
  }, [zoom, onZoom]);

  useEffect(() => {
    if (!element) return undefined;
    let pinch: { distance: number; zoom: number } | null = null;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      apply.current(clampZoom(current.current * Math.exp(-event.deltaY / 300)));
    };
    const onTouchStart = (event: TouchEvent) => {
      pinch = event.touches.length === 2 ? { distance: distance(event.touches), zoom: current.current } : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      apply.current(clampZoom((pinch.zoom * distance(event.touches)) / pinch.distance));
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null;
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd);
    element.addEventListener("touchcancel", onTouchEnd);
    return () => {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [element]);
}
