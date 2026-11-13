export const BOARD_ZOOM = { min: 0.5, max: 3, step: 1.25 } as const;

export function clampZoom(value: number): number {
  return Math.round(Math.min(BOARD_ZOOM.max, Math.max(BOARD_ZOOM.min, value)) * 100) / 100;
}

export function zoomScroll(
  scroll: { left: number; top: number },
  offset: { x: number; y: number },
  ratio: number
): { left: number; top: number } {
  return {
    left: Math.max(0, (scroll.left + offset.x) * ratio - offset.x),
    top: Math.max(0, (scroll.top + offset.y) * ratio - offset.y),
  };
}
