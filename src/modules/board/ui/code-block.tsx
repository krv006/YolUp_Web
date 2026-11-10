import type { ComponentProps } from "react";
import type { CodeStrokeDto } from "../api/board.dto";
import { CODE_BACKGROUND, CODE_FONT, CODE_LINE_HEIGHT, CODE_PAD, codeBoxWidth } from "../lib/code-highlight";
import { useCodeTokens } from "../model/use-code-tokens";

export function CodeBlock({
  stroke,
  color,
  monochrome = false,
  ...rest
}: { stroke: CodeStrokeDto; color: string; monochrome?: boolean } & Omit<ComponentProps<"g">, "color" | "stroke">) {
  const size = stroke.size ?? 20;
  const lineHeight = size * CODE_LINE_HEIGHT;
  const lines = useCodeTokens(String(stroke.text ?? ""), stroke.language);

  return (
    <g {...rest}>
      <rect
        x={stroke.x - CODE_PAD}
        y={stroke.y - size * 1.05}
        width={codeBoxWidth(stroke)}
        height={size * 1.5 + (lines.length - 1) * lineHeight}
        rx={4}
        fill={CODE_BACKGROUND}
      />
      <text
        x={stroke.x}
        y={stroke.y}
        fontSize={size}
        fill={color}
        fontFamily={CODE_FONT}
        xmlSpace="preserve"
        style={{ whiteSpace: "pre" }}
      >
        {lines.map((tokens, index) => (
          <tspan key={index} x={stroke.x} dy={index === 0 ? 0 : lineHeight}>
            {tokens.length
              ? tokens.map((token, tokenIndex) => (
                  <tspan key={tokenIndex} fill={monochrome ? undefined : (token.color ?? undefined)}>
                    {token.text}
                  </tspan>
                ))
              : " "}
          </tspan>
        ))}
      </text>
    </g>
  );
}
