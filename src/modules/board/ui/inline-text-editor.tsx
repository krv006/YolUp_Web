import { useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Point } from "../api/board.dto";
import { baselineOffset } from "../lib/board-measure";

export interface InlineTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  anchor: Point;
  size: number;
  color: string;
  boardWidth: number;
  scale: number;
  onCommit: () => void;
}

const LINE_HEIGHT = 1.35;

export function InlineTextEditor({ value, onChange, anchor, size, color, boardWidth, scale, onCommit }: InlineTextEditorProps) {
  const { t } = useTranslation("board");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fontPx = size * scale;
  const family = getComputedStyle(document.body).fontFamily;
  const offset = baselineOffset(fontPx, LINE_HEIGHT, family);
  const font = { fontSize: fontPx, lineHeight: LINE_HEIGHT, fontWeight: 600, fontFamily: "inherit", letterSpacing: "normal" };

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" || (event.key === "Enter" && (event.metaKey || event.ctrlKey))) {
      event.preventDefault();
      onCommit();
    }
  }

  return (
    <div
      className="absolute z-20"
      style={{
        top: 0,
        left: `${(anchor[0] / boardWidth) * 100}%`,
        marginTop: `calc(${(anchor[1] / boardWidth) * 100}% - ${offset}px)`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="grid w-max">
        <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-pre" style={font}>
          {`${value} `}
        </span>
        <textarea
          ref={areaRef}
          rows={1}
          value={value}
          wrap="off"
          spellCheck={false}
          aria-label={t("inline.textAria")}
          className="col-start-1 row-start-1 m-0 block min-w-[1ch] resize-none overflow-hidden whitespace-pre border-0 bg-transparent p-0 outline-none"
          style={{ ...font, color, caretColor: color }}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onCommit}
        />
      </div>
    </div>
  );
}
