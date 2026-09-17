import type { StrokeDto } from "../api/board.dto";
import { arrowHeadPoints, polylinePoints, textLines } from "../lib/board.geometry";
import { listMarkers } from "../lib/rich-text";
import { MathMarkup } from "./math-markup";

export interface BoardStrokeProps {
  stroke: StrokeDto;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function BoardStroke({ stroke, selected, onSelect }: BoardStrokeProps) {
  const color = selected ? "var(--destructive)" : (stroke.color ?? "currentColor");
  const shared = {
    onClick: () => onSelect(stroke.id),
    style: { cursor: "pointer" as const },
  };

  switch (stroke.type) {
    case "text": {
      const size = stroke.size ?? 22;
      const lineHeight = size * 1.35;
      if (stroke.lines?.length) {
        const markers = listMarkers(stroke.lines);
        return (
          <text {...shared} x={stroke.x} y={stroke.y} fontSize={size} fill={color} fontWeight={600}>
            {stroke.lines.map((line, index) => (
              <tspan key={index} x={stroke.x} dy={index === 0 ? 0 : lineHeight}>
                {markers[index] ? <tspan fontWeight={700}>{markers[index]}</tspan> : null}
                {line.runs.length ? (
                  line.runs.map((run, runIndex) => (
                    <tspan
                      key={runIndex}
                      fontWeight={run.bold ? 800 : 600}
                      fontStyle={run.italic ? "italic" : undefined}
                      textDecoration={run.underline ? "underline" : undefined}
                    >
                      {run.text}
                    </tspan>
                  ))
                ) : (
                  <tspan>{"\u00a0"}</tspan>
                )}
              </tspan>
            ))}
          </text>
        );
      }
      return (
        <text
          {...shared}
          x={stroke.x}
          y={stroke.y}
          fontSize={stroke.size ?? 22}
          fill={color}
          fontWeight={600}
        >
          {textLines(stroke).map((line, index) => (
            <tspan key={index} x={stroke.x} dy={index === 0 ? 0 : (stroke.size ?? 22) * 1.35}>
              {line}
            </tspan>
          ))}
        </text>
      );
    }

    case "math":
      return (
        <foreignObject
          {...shared}
          x={stroke.x}
          y={stroke.y - (stroke.size ?? 24)}
          width={640}
          height={(stroke.size ?? 24) * 3}
          overflow="visible"
        >
          <MathMarkup latex={stroke.latex} size={stroke.size ?? 24} color={color} />
        </foreignObject>
      );

    case "line":
      return (
        <g {...shared} stroke={color} strokeWidth={stroke.width ?? 4} strokeLinecap="round">
          <line x1={stroke.x1} y1={stroke.y1} x2={stroke.x2} y2={stroke.y2} />
          {stroke.arrow ? (
            <polyline
              points={arrowHeadPoints(stroke.x1, stroke.y1, stroke.x2, stroke.y2)}
              fill="none"
              strokeLinejoin="round"
            />
          ) : null}
        </g>
      );

    case "rect":
      return (
        <rect
          {...shared}
          x={stroke.x}
          y={stroke.y}
          width={stroke.w}
          height={stroke.h}
          rx={6}
          fill="none"
          stroke={color}
          strokeWidth={stroke.width ?? 4}
        />
      );

    case "ellipse":
      return (
        <ellipse
          {...shared}
          cx={stroke.x + stroke.w / 2}
          cy={stroke.y + stroke.h / 2}
          rx={stroke.w / 2}
          ry={stroke.h / 2}
          fill="none"
          stroke={color}
          strokeWidth={stroke.width ?? 4}
        />
      );

    default:
      return (
        <polyline
          {...shared}
          points={polylinePoints(stroke.points)}
          fill="none"
          stroke={color}
          strokeWidth={stroke.width ?? 4}
          strokeOpacity={stroke.opacity ?? 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}
