import type { Point, StrokeDto, StrokeShapeDto } from "../api/board.dto";

const TOLERANCE = 0.6;

function near(a: number | undefined, b: number | undefined): boolean {
  return typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= TOLERANCE;
}

function nearPoint(a: Point | undefined, b: Point | undefined): boolean {
  return Boolean(a && b && near(a[0], b[0]) && near(a[1], b[1]));
}

export function confirmsPending(stroke: StrokeDto, shape: StrokeShapeDto): boolean {
  if (stroke.type !== shape.type) return false;
  if (stroke.type === undefined && shape.type === undefined) return nearPoint(stroke.points?.[0], shape.points?.[0]);
  if (stroke.type === "line" && shape.type === "line")
    return near(stroke.x1, shape.x1) && near(stroke.y1, shape.y1) && near(stroke.x2, shape.x2) && near(stroke.y2, shape.y2);
  if ((stroke.type === "rect" || stroke.type === "ellipse") && (shape.type === "rect" || shape.type === "ellipse"))
    return near(stroke.x, shape.x) && near(stroke.y, shape.y) && near(stroke.w, shape.w) && near(stroke.h, shape.h);
  if ((stroke.type === "text" || stroke.type === "code") && (shape.type === "text" || shape.type === "code"))
    return stroke.text.trim() === shape.text.trim() && near(stroke.x, shape.x);
  if (stroke.type === "math" && shape.type === "math") return stroke.latex.trim() === shape.latex.trim() && near(stroke.x, shape.x);
  return false;
}
