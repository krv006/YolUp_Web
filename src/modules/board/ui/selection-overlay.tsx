import type { StrokeBox } from "../lib/board-edit";
import type { HandlePoint, ResizeHandle } from "../lib/board-resize";

export interface SelectionOverlayProps {
  box: StrokeBox;
  offset?: [number, number];
  scale: number;
  label?: string;
  handles?: HandlePoint[];
}

const CURSORS: Record<ResizeHandle, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  start: "move",
  end: "move",
  e: "ew-resize",
};
const HANDLE_PX = 10;

const PAD_PX = 6;

export function SelectionOverlay({ box, offset = [0, 0], scale, label, handles = [] }: SelectionOverlayProps) {
  const pad = PAD_PX / scale;
  const x = box.minX + offset[0] - pad;
  const y = box.minY + offset[1] - pad;
  const width = box.maxX - box.minX + pad * 2;
  const height = box.maxY - box.minY + pad * 2;
  const font = 12 / scale;
  const handleSize = HANDLE_PX / scale;

  return (
    <g pointerEvents="none" aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4 / scale}
        fill="rgb(91 92 240 / 0.06)"
        stroke="#5b5cf0"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        vectorEffect="non-scaling-stroke"
      />
      {handles.map((handle) => (
        <rect
          key={handle.id}
          data-handle={handle.id}
          x={handle.point[0] + offset[0] - handleSize / 2}
          y={handle.point[1] + offset[1] - handleSize / 2}
          width={handleSize}
          height={handleSize}
          rx={2 / scale}
          fill="#ffffff"
          stroke="#5b5cf0"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          pointerEvents="all"
          style={{ cursor: CURSORS[handle.id] }}
        />
      ))}
      {label ? (
        <text x={x} y={y + height + font + 4 / scale} fontSize={font} fill="#5b5cf0" fontWeight={600}>
          {label}
        </text>
      ) : null}
    </g>
  );
}
