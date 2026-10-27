import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { File, FileQuestion, FileText, Image, Loader2, Lock, Music, Video, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import {
  blobForViewing,
  fileKindLabel,
  fileKindOf,
  fileNameFor,
  openPdfDocument,
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

const TONE: Record<string, string> = {
  pdf: "bg-danger-bg text-danger",
  image: "bg-accent-violet-bg text-accent-violet-fg",
  video: "bg-brand-subtle text-brand",
  audio: "bg-accent-green-bg text-success",
  other: "bg-subtle text-ink-secondary",
};

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
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name, mimeType]);

  useEffect(() => {
    if (!isCompact || file?.kind !== "pdf") return undefined;
    let active = true;
    let loaded: PDFDocumentProxy | null = null;
    openPdfDocument(file.url)
      .then((document) => {
        loaded = document;
        if (!active) return void document.destroy();
        setPdf(document);
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
  }, [isCompact, file, t]);

  const subtitle = [file ? sizeLabel(file.size) : "", meta, file ? fileKindLabel(file.kind) : ""]
    .filter(Boolean)
    .join(" · ");

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

            <div className="relative mt-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-2xl bg-surface shadow-lg">
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
                <PdfPageCanvas document={pdf} page={page} />
              ) : file.kind === "image" ? (
                <img className="w-full" src={file.url} alt={file.fileName} draggable={false} />
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

              {file && (file.kind === "pdf" || file.kind === "image") ? (
                <span
                  className="pointer-events-none absolute inset-0 grid -rotate-[35deg] place-items-center text-title-lg font-semibold text-ink/10 select-none"
                  aria-hidden="true"
                >
                  {t("fileViewer.watermark")}
                </span>
              ) : null}
            </div>

            {pdf ? (
              <div className="mt-4 flex h-10 shrink-0 items-center pr-0.5">
                <span className="min-w-0 flex-1 text-body-sm font-semibold text-ink">
                  {t("fileViewer.pageOf", { page, total: pdf.numPages })}
                </span>
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
                  className="ml-3 grid size-10 place-items-center rounded-full text-ink disabled:text-ink-tertiary"
                  aria-label={t("fileViewer.nextPage")}
                  disabled={page >= pdf.numPages}
                  onClick={() => setPage((current) => Math.min(pdf.numPages, current + 1))}
                >
                  <AppIcon name="chevron-right" size={20} />
                </button>
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

            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink transition-opacity hover:opacity-85"
              aria-label={t("fileViewer.close")}
              onClick={() => onOpenChange(false)}
            >
              <X size={18} />
            </button>
          </header>

          <div className="relative mx-auto flex w-full max-w-190 min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-surface">
            {error ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-ink-secondary">
                <FileQuestion size={30} />
                <p className="text-body-sm">{error}</p>
              </div>
            ) : !file ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-ink-tertiary">
                <Loader2 size={26} className="animate-spin" />
                <p className="text-body-sm">{t("fileViewer.opening")}</p>
              </div>
            ) : file.kind === "pdf" ? (
              <iframe
                className="size-full border-0"
                src={`${file.url}#toolbar=0`}
                title={file.fileName}
              />
            ) : file.kind === "image" ? (
              <img
                className="max-h-full max-w-full object-contain"
                src={file.url}
                alt={file.fileName}
                draggable={false}
              />
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

            {file && (file.kind === "pdf" || file.kind === "image") ? (
              <span
                className="pointer-events-none absolute inset-0 grid -rotate-12 select-none place-items-center text-h1 text-brand/10"
                aria-hidden="true"
              >
                {t("fileViewer.watermark")}
              </span>
            ) : null}
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

function Icon({ kind }: { kind?: FileKind }) {
  if (kind === "pdf") return <FileText size={18} />;
  if (kind === "image") return <Image size={18} />;
  if (kind === "video") return <Video size={18} />;
  if (kind === "audio") return <Music size={18} />;
  return <File size={18} />;
}
