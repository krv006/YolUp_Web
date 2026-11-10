import type { StrokeBox } from "../lib/board-edit";

export interface SelectionOverlayProps {
  box: StrokeBox;
  offset?: [number, number];
  scale: number;
  label?: string;
}

const PAD_PX = 6;

export function SelectionOverlay({ box, offset = [0, 0], scale, label }: SelectionOverlayProps) {
  const pad = PAD_PX / scale;
  const x = box.minX + offset[0] - pad;
  const y = box.minY + offset[1] - pad;
  const width = box.maxX - box.minX + pad * 2;
  const height = box.maxY - box.minY + pad * 2;
  const font = 12 / scale;

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
      {label ? (
        <text x={x} y={y + height + font + 4 / scale} fontSize={font} fill="#5b5cf0" fontWeight={600}>
          {label}
        </text>
      ) : null}
    </g>
  );
}
