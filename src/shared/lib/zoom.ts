export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

export function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

export function stepZoom(current: number, direction: 1 | -1): number {
  const next =
    direction > 0
      ? ZOOM_STEPS.find((step) => step > current + 0.001)
      : [...ZOOM_STEPS].reverse().find((step) => step < current - 0.001);
  return next ?? current;
}
