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

const baselineCache = new Map<string, number>();

export function baselineOffset(fontPx: number, lineHeight: number, family: string, weight = 600): number {
  const key = `${weight}|${fontPx}|${lineHeight}|${family}`;
  const cached = baselineCache.get(key);
  if (cached !== undefined) return cached;
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;top:0;left:0;visibility:hidden;white-space:pre;font:${weight} ${fontPx}px/${lineHeight} ${family};`;
  probe.textContent = "Hg";
  const marker = document.createElement("span");
  marker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
  probe.appendChild(marker);
  document.body.appendChild(probe);
  const measured = marker.getBoundingClientRect().top - probe.getBoundingClientRect().top;
  const offset = measured > 0 ? measured : fontPx * (0.9 + (lineHeight - 1) / 2);
  probe.remove();
  baselineCache.set(key, offset);
  return offset;
}

let measureContext: CanvasRenderingContext2D | null | undefined;

export function textWidth(text: string, size: number, family: string, weight = 600): number | null {
  if (measureContext === undefined) measureContext = document.createElement("canvas").getContext("2d");
  const context = measureContext;
  if (!context) return null;
  context.font = `${weight} ${size}px ${family}`;
  return Math.max(0, ...text.split("\n").map((line) => context.measureText(line).width));
}
