export { boardApi } from "./api/board.api";
export type {
  AwayStudent,
  BoardSheet,
  BoardState,
  PendingCameraRequest,
  PendingMicRequest,
  PeriodicElement,
  Point,
  StrokeDto,
  StrokeInput,
  StrokeKind,
  StrokeShapeDto,
} from "./api/board.dto";
export { mapBoardDto, mapPeriodicElementDto } from "./lib/board.mappers";
export { BoardSocketManager, parseBoardEvent } from "./lib/board-socket-manager";
export type { BoardSocketEvent } from "./lib/board-socket-manager";
export {
  boardKeys,
  useAddSheet,
  useAddStroke,
  useAddStrokes,
  useBoard,
  useEraseStrokes,
  useGrantDraw,
  usePeriodicTable,
  useSolveFormula,
} from "./model/board.queries";
export { useBoardChannel } from "./model/use-board-channel";
export { useBoardRealtime } from "./model/use-board-realtime";
export { AwayStudentsNotice } from "./ui/away-students-notice";
export { BoardPanel } from "./ui/board-panel";
export { BoardStroke } from "./ui/board-stroke";
export { BoardToolbar } from "./ui/board-toolbar";
export type { BoardTool } from "./ui/board-toolbar";
export { BOARD_COLORS, BOARD_TEXT_SIZE, BOARD_WIDTHS } from "./constants/board.constants";
export { MathMarkup } from "./ui/math-markup";
export { FormulaPalette } from "./ui/formula-palette";
export { MathFieldInput } from "./ui/math-field-input";
export type { MathFieldInputHandle } from "./ui/math-field-input";
export { PeriodicTableDialog } from "./ui/periodic-table-dialog";
export { FLOW_MARGIN, nextFlowPoint, nextTextPoint, strokeSpan } from "./lib/board-flow";
export { arrowHeadPoints, boxFromDrag, buildStroke, strokeKindOf } from "./lib/board.geometry";
export type { DrawKind } from "./lib/board.geometry";
