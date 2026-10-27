import { useEffect, useRef } from "react";
import type { PDFDocumentProxy } from "@/shared/lib";

export function PdfPageCanvas({ document, page }: { document: PDFDocumentProxy; page: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;

    void document.getPage(page).then((pdfPage) => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (cancelled || !host || !canvas || !context) return;
      const width = host.clientWidth;
      const ratio = window.devicePixelRatio || 1;
      const viewport = pdfPage.getViewport({ scale: (width / pdfPage.getViewport({ scale: 1 }).width) * ratio });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${viewport.height / ratio}px`;
      task = pdfPage.render({ canvasContext: context, viewport });
      task.promise.catch(() => undefined);
    });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [document, page]);

  return (
    <div ref={hostRef} className="w-full">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
