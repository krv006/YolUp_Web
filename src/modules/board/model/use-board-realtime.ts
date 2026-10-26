import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BoardState, StrokeDto } from "../api/board.dto";
import type { BoardSocketEvent } from "../lib/board-socket-manager";
import { boardKeys } from "./board.queries";
import { useBoardChannel } from "./use-board-channel";

const BOARD_STATE_EVENTS = new Set<BoardSocketEvent["type"]>(["stroke", "erase", "sheet"]);

function updateSheet(
  state: BoardState,
  index: number,
  update: (strokes: StrokeDto[]) => StrokeDto[]
): BoardState {
  return {
    ...state,
    sheets: state.sheets.map((sheet) =>
      sheet.index === index ? { ...sheet, strokes: update(sheet.strokes) } : sheet
    ),
  };
}

function applyEvent(state: BoardState | undefined, event: BoardSocketEvent): BoardState | undefined {
  if (!state) return state;

  switch (event.type) {
    case "stroke":
      return updateSheet(state, event.sheet, (strokes) =>
        strokes.some((item) => item.id === event.stroke.id) ? strokes : [...strokes, event.stroke]
      );

    case "erase":
      return updateSheet(state, event.sheet, (strokes) =>
        strokes.filter((item) => !event.strokeIds.includes(item.id))
      );

    case "sheet":
      return state.sheets.some((sheet) => sheet.index === event.index)
        ? state
        : {
            ...state,
            sheets: [
              ...state.sheets,
              { index: event.index, title: event.title ?? "", strokes: [] },
            ],
          };

    case "sheet_renamed":
      return {
        ...state,
        sheets: state.sheets.map((sheet) =>
          sheet.index === event.index ? { ...sheet, title: event.title ?? "" } : sheet
        ),
      };

    default:
      return state;
  }
}

export function useBoardRealtime(lessonId: string, enabled = true, identity?: string | null) {
  const queryClient = useQueryClient();

  const handleEvent = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type === "board_granted" || event.type === "board_revoked") {
        if (!identity || event.studentId !== identity) return;
        const canDraw = event.type === "board_granted";
        queryClient.setQueryData<BoardState>(boardKeys.state(lessonId), (current) =>
          current ? { ...current, canDraw } : current
        );
        return;
      }
      if (!BOARD_STATE_EVENTS.has(event.type)) return;
      queryClient.setQueryData<BoardState>(boardKeys.state(lessonId), (current) =>
        applyEvent(current, event)
      );
    },
    [lessonId, queryClient, identity]
  );

  return useBoardChannel(lessonId, enabled, handleEvent);
}
