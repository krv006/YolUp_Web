import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "@/shared/lib";

type PdfPage = Awaited<ReturnType<PDFDocumentProxy["getPage"]>>;

const RERENDER_DELAY_MS = 120;
const MAX_CANVAS_PIXELS = 12_000_000;

export interface PdfPageCanvasProps {
  document: PDFDocumentProxy;
  page: number;
  width: number;
  aspect?: number;
  lazy?: boolean;
}

export function PdfPageCanvas({ document, page, width, aspect = Math.SQRT2, lazy = false }: PdfPageCanvasProps) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendered = useRef(false);
  const [visible, setVisible] = useState(!lazy);
  const [pdfPage, setPdfPage] = useState<PdfPage | null>(null);

  useEffect(() => {
    if (visible || !host) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [host, visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    void document.getPage(page).then((loaded) => {
      if (active) setPdfPage(loaded);
    });
    return () => {
      active = false;
    };
  }, [document, page, visible]);

  const base = pdfPage?.getViewport({ scale: 1 });
  const height = width * (base ? base.height / base.width : aspect);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!pdfPage || !canvas || !context || width <= 0) return undefined;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    const timer = window.setTimeout(
      () => {
        const natural = pdfPage.getViewport({ scale: 1 });
        const wanted = (width / natural.width) * (window.devicePixelRatio || 1);
        const limit = Math.sqrt(MAX_CANVAS_PIXELS / (natural.width * natural.height));
        const viewport = pdfPage.getViewport({ scale: Math.min(wanted, limit) });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        rendered.current = true;
        task = pdfPage.render({ canvasContext: context, viewport });
        task.promise.catch(() => undefined);
      },
      rendered.current ? RERENDER_DELAY_MS : 0
    );
    return () => {
      window.clearTimeout(timer);
      task?.cancel();
    };
  }, [pdfPage, width]);

  return (
    <div ref={setHost} className="shrink-0 bg-surface" style={{ width, height }}>
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
}
