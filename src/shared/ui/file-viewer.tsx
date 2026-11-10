import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { File, FileQuestion, FileText, Image, Loader2, Lock, Minus, Music, Plus, Video, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useZoomGestures } from "@/shared/hooks/use-zoom-gestures";
import {
  blobForViewing,
  fileKindLabel,
  fileKindOf,
  fileNameFor,
  openPdfDocument,
  stepZoom,
  ZOOM_MAX,
  ZOOM_MIN,
  type FileKind,
  type PDFDocumentProxy,
} from "@/shared/lib";
import { Icon as AppIcon } from "@/shared/ui/icon";
import { PdfPageCanvas } from "@/shared/ui/pdf-page-canvas";

export interface FileViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  mimeType?: string;
  /** Sarlavha ostidagi qo'shimcha izoh (masalan "12 sahifa · Mirkamol Atakhanov"). */
  meta?: string;
  load: (signal: AbortSignal) => Promise<Blob>;
}

interface LoadedFile {
  url: string;
  kind: FileKind;
  fileName: string;
  size: number;
}

interface LoadedPdf {
  document: PDFDocumentProxy;
  aspect: number;
}

interface Size {
  width: number;
  height: number;
}

const TONE: Record<string, string> = {
  pdf: "bg-danger-bg text-danger",
  image: "bg-accent-violet-bg text-accent-violet-fg",
  video: "bg-brand-subtle text-brand",
  audio: "bg-accent-green-bg text-success",
  other: "bg-subtle text-ink-secondary",
};

const PAGE_GAP = 12;

function sizeLabel(bytes: number): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function FileViewer({
  open,
  onOpenChange,
  name,
  mimeType = "",
  meta,
  load,
}: FileViewerProps) {
  const { t } = useTranslation();
  const isCompact = useIsCompact();
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [area, setArea] = useState<Size>({ width: 0, height: 0 });
  const [natural, setNatural] = useState<Size | null>(null);
  const previousZoom = useRef(1);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    let objectUrl: string | null = null;

    load(controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        const type = blob.type || mimeType;
        const kind = fileKindOf(type, name);
        objectUrl = URL.createObjectURL(blobForViewing(blob, kind));
        setFile({
          url: objectUrl,
          kind,
          fileName: fileNameFor(name, type),
          size: blob.size,
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : t("fileViewer.openError"));
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setFile(null);
      setError(null);
      setZoom(1);
      setNatural(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name, mimeType]);

  useEffect(() => {
    if (file?.kind !== "pdf") return undefined;
    let active = true;
    let loaded: PDFDocumentProxy | null = null;
    openPdfDocument(file.url)
      .then(async (document) => {
        loaded = document;
        if (!active) return void document.destroy();
        const first = (await document.getPage(1)).getViewport({ scale: 1 });
        if (!active) return;
        setPdf({ document, aspect: first.height / first.width });
        setPage(1);
      })
      .catch(() => {
        if (active) setError(t("fileViewer.openError"));
      });
    return () => {
      active = false;
      setPdf(null);
      void loaded?.destroy();
    };
  }, [file, t]);

  useEffect(() => {
    if (!viewport) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setArea({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewport]);

  useLayoutEffect(() => {
    const ratio = zoom / previousZoom.current;
    previousZoom.current = zoom;
    if (!viewport || ratio === 1) return;
    viewport.scrollLeft = (viewport.scrollLeft + viewport.clientWidth / 2) * ratio - viewport.clientWidth / 2;
    viewport.scrollTop = (viewport.scrollTop + viewport.clientHeight / 2) * ratio - viewport.clientHeight / 2;
  }, [zoom, viewport]);

  const zoomable = Boolean(file && (file.kind === "pdf" || file.kind === "image") && !error);
  useZoomGestures(zoomable ? viewport : null, zoom, setZoom);

  const subtitle = [file ? sizeLabel(file.size) : "", meta, file ? fileKindLabel(file.kind) : ""]
    .filter(Boolean)
    .join(" · ");

  const gutter = isCompact ? 0 : PAGE_GAP * 2;
  const pageWidth = Math.max(0, (area.width - gutter) * zoom);
  const fitImageWidth = natural
    ? Math.min(area.width - gutter, ((area.height - gutter) * natural.width) / natural.height, natural.width)
    : 0;
  const imageWidth = isCompact ? area.width * zoom : fitImageWidth * zoom;

  const zoomControls = zoomable ? (
    <ZoomControls zoom={zoom} onZoom={setZoom} compact={isCompact} />
  ) : null;

  const watermark =
    file && (file.kind === "pdf" || file.kind === "image") ? (
      <span
        className={
          isCompact
            ? "pointer-events-none absolute inset-0 grid -rotate-[35deg] place-items-center text-title-lg font-semibold text-ink/10 select-none"
            : "pointer-events-none absolute inset-0 grid -rotate-12 select-none place-items-center text-h1 text-brand/10"
        }
        aria-hidden="true"
      >
        {t("fileViewer.watermark")}
      </span>
    ) : null;

  const image =
    file?.kind === "image" ? (
      <div className="flex min-h-full w-max min-w-full items-center justify-center" style={{ padding: gutter / 2 }}>
        <img
          className="block max-w-none"
          style={imageWidth > 0 ? { width: imageWidth } : { maxWidth: "100%" }}
          src={file.url}
          alt={file.fileName}
          draggable={false}
          onLoad={(event) =>
            setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })
          }
        />
      </div>
    ) : null;

  if (isCompact)
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 flex flex-col bg-canvas bg-auth-gradient px-4 pt-5 pb-[88px] font-body text-ink outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
            onContextMenu={(event) => event.preventDefault()}
          >
            <header className="flex h-11 shrink-0 items-center">
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
                aria-label={t("fileViewer.close")}
                onClick={() => onOpenChange(false)}
              >
                <AppIcon name="close" size={20} />
              </button>
              <DialogPrimitive.Title className="min-w-0 flex-1 truncate px-2 text-center text-title-lg font-semibold text-ink">
                {file?.fileName ?? name}
              </DialogPrimitive.Title>
            </header>
            <DialogPrimitive.Description className="sr-only">
              {subtitle || t("fileViewer.opening")}
            </DialogPrimitive.Description>

            <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface shadow-lg">
              <div ref={setViewport} className="size-full overflow-auto overscroll-contain">
                {error ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-ink-secondary">
                    <FileQuestion size={30} />
                    <p className="text-body-sm">{error}</p>
                  </div>
                ) : !file || (file.kind === "pdf" && !pdf) ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-ink-tertiary">
                    <Loader2 size={26} className="animate-spin" />
                    <p className="text-body-sm">{t("fileViewer.opening")}</p>
                  </div>
                ) : file.kind === "pdf" && pdf ? (
                  <PdfPageCanvas document={pdf.document} page={page} width={pageWidth} aspect={pdf.aspect} />
                ) : file.kind === "image" ? (
                  image
                ) : file.kind === "video" ? (
                  <video className="w-full" src={file.url} controls playsInline controlsList="nodownload" />
                ) : file.kind === "audio" ? (
                  <div className="flex h-full items-center px-4">
                    <audio className="w-full" src={file.url} controls controlsList="nodownload" />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-ink-tertiary">
                    <FileQuestion size={30} />
                    <p className="text-body-sm">{t("fileViewer.unsupported")}</p>
                  </div>
                )}
              </div>
              {watermark}
            </div>

            {pdf || zoomControls ? (
              <div className="mt-4 flex h-10 shrink-0 items-center pr-0.5">
                <span className="min-w-0 flex-1 text-body-sm font-semibold text-ink">
                  {pdf ? t("fileViewer.pageOf", { page, total: pdf.document.numPages }) : null}
                </span>
                {zoomControls}
                {pdf ? (
                  <>
                    <i className="mx-2 h-5 w-px shrink-0 bg-line not-italic" aria-hidden="true" />
                    <button
                      type="button"
                      className="grid size-10 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
                      aria-label={t("fileViewer.prevPage")}
                      disabled={page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <AppIcon name="chevron-left" size={20} />
                    </button>
                    <button
                      type="button"
                      className="ml-1 grid size-10 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
                      aria-label={t("fileViewer.nextPage")}
                      disabled={page >= pdf.document.numPages}
                      onClick={() => setPage((current) => Math.min(pdf.document.numPages, current + 1))}
                    >
                      <AppIcon name="chevron-right" size={20} />
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}

            <p className="mt-3.5 flex h-11 shrink-0 items-center gap-3 rounded-xl bg-brand-subtle pl-[15px] text-body-sm font-medium text-brand-strong">
              <AppIcon name="bolt-fill" size={18} className="shrink-0" />
              {t("fileViewer.platformOnlyNote")}
            </p>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col gap-4 px-10 py-6 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
          onContextMenu={(event) => event.preventDefault()}
        >
          <header className="flex shrink-0 items-center gap-3">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-md ${
                TONE[file?.kind ?? "other"] ?? TONE.other
              }`}
            >
              <Icon kind={file?.kind} />
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <DialogPrimitive.Title className="truncate text-title-sm text-ink-inverse">
                {file?.fileName ?? name}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="truncate text-body-xs text-ink-inverse-secondary">
                {subtitle || t("fileViewer.opening")}
              </DialogPrimitive.Description>
            </span>

            {zoomControls}

            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink transition-opacity hover:opacity-85"
              aria-label={t("fileViewer.close")}
              onClick={() => onOpenChange(false)}
            >
              <X size={18} />
            </button>
          </header>

          <div className="relative mx-auto flex w-full max-w-300 min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-surface">
            {error ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-ink-secondary">
                <FileQuestion size={30} />
                <p className="text-body-sm">{error}</p>
              </div>
            ) : !file || (file.kind === "pdf" && !pdf) ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-ink-tertiary">
                <Loader2 size={26} className="animate-spin" />
                <p className="text-body-sm">{t("fileViewer.opening")}</p>
              </div>
            ) : file.kind === "pdf" && pdf ? (
              <div ref={setViewport} className="size-full overflow-auto overscroll-contain bg-subtle">
                <div className="flex w-max min-w-full flex-col items-center" style={{ gap: PAGE_GAP, padding: PAGE_GAP }}>
                  {Array.from({ length: pdf.document.numPages }, (_, index) => (
                    <PdfPageCanvas
                      key={index + 1}
                      document={pdf.document}
                      page={index + 1}
                      width={pageWidth}
                      aspect={pdf.aspect}
                      lazy={index > 1}
                    />
                  ))}
                </div>
              </div>
            ) : file.kind === "image" ? (
              <div ref={setViewport} className="size-full overflow-auto overscroll-contain">
                {image}
              </div>
            ) : file.kind === "video" ? (
              <video
                className="max-h-full max-w-full"
                src={file.url}
                controls
                playsInline
                controlsList="nodownload"
              />
            ) : file.kind === "audio" ? (
              <audio className="w-full px-10" src={file.url} controls controlsList="nodownload" />
            ) : (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-ink-tertiary">
                <FileQuestion size={30} />
                <p className="text-body-sm">{t("fileViewer.unsupported")}</p>
              </div>
            )}

            {watermark}
          </div>

          <p className="flex shrink-0 items-center justify-center gap-2 text-body-xs text-ink-inverse-secondary">
            <Lock size={14} />
            {t("fileViewer.platformOnlyNote")}
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ZoomControls({ zoom, onZoom, compact }: { zoom: number; onZoom: (zoom: number) => void; compact: boolean }) {
  const { t } = useTranslation();
  const button = compact
    ? "grid size-10 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
    : "grid size-7 place-items-center rounded-full text-ink transition-colors hover:bg-subtle disabled:text-ink-tertiary disabled:hover:bg-transparent";

  return (
    <span className={compact ? "flex items-center" : "flex h-9 shrink-0 items-center gap-0.5 rounded-full bg-surface px-1"}>
      <button
        type="button"
        className={button}
        aria-label={t("fileViewer.zoomOut")}
        title={t("fileViewer.zoomOut")}
        disabled={zoom <= ZOOM_MIN}
        onClick={() => onZoom(stepZoom(zoom, -1))}
      >
        <Minus size={compact ? 20 : 16} />
      </button>
      {compact ? null : (
        <button
          type="button"
          className="h-7 min-w-12 rounded-full px-1 font-numeric text-caption-strong text-ink transition-colors hover:bg-subtle"
          aria-label={t("fileViewer.zoomReset")}
          title={t("fileViewer.zoomReset")}
          onClick={() => onZoom(1)}
        >
          {Math.round(zoom * 100)}%
        </button>
      )}
      <button
        type="button"
        className={button}
        aria-label={t("fileViewer.zoomIn")}
        title={t("fileViewer.zoomIn")}
        disabled={zoom >= ZOOM_MAX}
        onClick={() => onZoom(stepZoom(zoom, 1))}
      >
        <Plus size={compact ? 20 : 16} />
      </button>
    </span>
  );
}

function Icon({ kind }: { kind?: FileKind }) {
  if (kind === "pdf") return <FileText size={18} />;
  if (kind === "image") return <Image size={18} />;
  if (kind === "video") return <Video size={18} />;
  if (kind === "audio") return <Music size={18} />;
  return <File size={18} />;
}
