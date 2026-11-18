import { useId } from "react";
import { BOARD_GUIDE_CELL } from "../constants/board.constants";

export function BoardGuides({ width, height }: { width: number; height: number }) {
  const id = `board-guides-${useId().replace(/:/g, "")}`;
  return (
    <g className="board-guides" aria-hidden="true" pointerEvents="none">
      <defs>
        <pattern id={id} width={BOARD_GUIDE_CELL} height={BOARD_GUIDE_CELL} patternUnits="userSpaceOnUse">
          <path
            d={`M ${BOARD_GUIDE_CELL} 0 L 0 0 0 ${BOARD_GUIDE_CELL}`}
            fill="none"
            stroke="rgb(100 116 139 / 0.22)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
      </defs>
      <rect x={0} y={0} width={width} height={height} fill={`url(#${id})`} />
    </g>
  );
}
