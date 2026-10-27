import { useTranslation } from "react-i18next";
import { useBoard } from "../model/board.queries";
import { useBoardRealtime } from "../model/use-board-realtime";
import { BoardStroke } from "./board-stroke";

export interface BoardPreviewProps {
  lessonId: string;
  currentUserId?: string | null;
}

function ignore() {}

export function BoardPreview({ lessonId, currentUserId }: BoardPreviewProps) {
  const { t } = useTranslation("board");
  const realtime = useBoardRealtime(lessonId, true, currentUserId);
  const board = useBoard(lessonId, { live: realtime.connected });
  const state = board.data;
  const sheets = state?.sheets ?? [];
  const sheet = sheets[sheets.length - 1];

  return (
    <div className="flex size-full flex-col bg-surface">
      <small className="shrink-0 px-4 pt-4 text-caption text-ink-secondary">
        {t("preview.label", { page: Math.max(sheets.length, 1) })}
      </small>
      {state && sheet?.strokes.length ? (
        <svg
          className="pointer-events-none min-h-0 w-full flex-1 text-ink"
          viewBox={`0 0 ${state.width} ${state.height}`}
          preserveAspectRatio="xMidYMin meet"
          aria-hidden="true"
        >
          {sheet.strokes.map((stroke) => (
            <BoardStroke key={stroke.id} stroke={stroke} selected={false} onSelect={ignore} />
          ))}
        </svg>
      ) : (
        <p className="m-auto px-6 text-center text-body-sm text-ink-secondary">{t("preview.empty")}</p>
      )}
    </div>
  );
}
