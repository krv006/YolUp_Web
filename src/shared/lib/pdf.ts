import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

type PdfModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let loader: Promise<PdfModule> | null = null;

function loadPdfjs(): Promise<PdfModule> {
  loader ??= Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return loader;
}

export async function openPdfDocument(url: string): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();
  return pdfjs.getDocument({ url, isEvalSupported: false }).promise;
}

export type { PDFDocumentProxy };
