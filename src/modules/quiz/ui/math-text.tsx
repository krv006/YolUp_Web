import { Fragment } from "react";
import { MathMarkup } from "@/modules/board";

export interface MathTextProps {
  text: string;
  size?: number;
}

function hasMath(text: string): boolean {
  return /\$[^$]+\$/.test(text);
}

export function MathText({ text, size = 17 }: MathTextProps) {
  if (!hasMath(text)) return <>{text}</>;
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.length > 2 && part.startsWith("$") && part.endsWith("$") ? (
          <MathMarkup key={index} latex={part.slice(1, -1)} size={size} />
        ) : (
          <Fragment key={index}>{part}</Fragment>
        )
      )}
    </>
  );
}
