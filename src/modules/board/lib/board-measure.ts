import type { Point } from "../api/board.dto";
import type { StrokeBox } from "./board-edit";

export function clientToBoard(svg: SVGSVGElement, clientX: number, clientY: number, width: number, height: number): Point {
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    const rect = svg.getBoundingClientRect();
    return [
      Math.round(((clientX - rect.left) * width) / rect.width),
      Math.round(((clientY - rect.top) * height) / rect.height),
    ];
  }
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  return [Math.round(point.x), Math.round(point.y)];
}

export function strokeNode(svg: SVGSVGElement, id: string): SVGGraphicsElement | null {
  const node = svg.querySelector(`[data-stroke-id="${CSS.escape(id)}"]`);
  return node instanceof SVGGraphicsElement ? node : null;
}

export function measureNode(svg: SVGSVGElement, id: string): StrokeBox | null {
  const node = strokeNode(svg, id);
  if (!node) return null;
  if (node instanceof SVGForeignObjectElement) {
    const content = node.querySelector(".math-markup");
    const matrix = svg.getScreenCTM();
    if (!content || !matrix) return null;
    const rect = content.getBoundingClientRect();
    const inverse = matrix.inverse();
    const from = new DOMPoint(rect.left, rect.top).matrixTransform(inverse);
    const to = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse);
    return { minX: from.x, minY: from.y, maxX: to.x, maxY: to.y };
  }
  const box = node.getBBox();
  return { minX: box.x, minY: box.y, maxX: box.x + box.width, maxY: box.y + box.height };
}

export function boardScale(svg: SVGSVGElement, width: number): number {
  const rect = svg.getBoundingClientRect();
  return rect.width > 0 ? rect.width / width : 1;
}
