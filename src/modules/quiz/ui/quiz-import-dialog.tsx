import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { MOBILE_INPUT } from "@/shared/ui/mobile-fields";
import { Icon } from "@/shared/ui/icon";
import type { QuizImportPreview, QuizSummary } from "@/shared/types";
import { quizApi } from "../api/quiz.api";
import type { QuizImportRequest } from "../api/quiz.dto";
import { useDownloadQuizTemplate, useImportGoogleLink, useImportQuizDocx } from "../model/quiz.queries";

export interface QuizImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: QuizImportRequest;
  onImported?: (quiz: QuizSummary) => void;
}

const ACCEPT = ".docx,.xlsx,.json";
const TEMPLATES = ["docx", "xlsx"] as const;
const TEMPLATE_QUESTION_COUNT = 10;

export function QuizImportDialog({
  open,
  onOpenChange,
  request,
  onImported,
}: QuizImportDialogProps) {
  const { t } = useTranslation("quiz");
  const isCompact = useIsCompact();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [preview, setPreview] = useState<QuizImportPreview | null>(null);

  const importDocx = useImportQuizDocx();
  const importLink = useImportGoogleLink();
  const downloadTemplate = useDownloadQuizTemplate();
  const previewFile = useMutation({
    mutationFn: (value: File) => quizApi.importDocxPreview(value),
    onSuccess: setPreview,
    onError: (error: Error) => toast.error(error.message),
  });

  const pending = importDocx.isPending || importLink.isPending || previewFile.isPending;

  function reset() {
    setFile(null);
    setLink("");
    setPreview(null);
  }

  function pick(next: File | null) {
    setFile(next);
    setPreview(null);
    if (next) previewFile.mutate(next);
  }

  function submit() {
    if (file) {
      importDocx.mutate(
        { file, request },
        {
          onSuccess: (result) => {
            onImported?.(result.quiz);
            reset();
            onOpenChange(false);
          },
        }
      );
      return;
    }
    if (!link.trim()) return;
    const source = link.includes("/forms/") ? "google_form" : "google_doc";
    importLink.mutate(
      { source, url: link.trim(), request },
      {
        onSuccess: (result) => {
          onImported?.(result.quiz);
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={(event) => pick(event.target.files?.[0] ?? null)}
    />
  );

  if (isCompact)
    return (
      <AppDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          onOpenChange(next);
        }}
        variant="adaptive"
        title={t("importDialog.title")}
        description={t("importDialog.description")}
        footerClassName="px-4 pt-5 pb-8.5"
        footer={
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className={`${dialogButton.secondary} h-13 border-line-strong text-title font-semibold`}
              onClick={() => onOpenChange(false)}
            >
              {t("importDialog.cancel")}
            </button>
            <button
              type="button"
              className={`${dialogButton.primary} h-13 text-title font-semibold`}
              disabled={pending || (!file && !link.trim())}
              onClick={submit}
            >
              {t("importDialog.submit")}
            </button>
          </div>
        }
      >
        <div className="-mt-0.5 flex flex-col">
          <button
            type="button"
            className="flex h-28 flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-brand bg-subtle px-6 text-center transition-colors hover:bg-brand-subtle"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={22} className="text-brand" />
            <strong className="mt-2 max-w-full truncate text-title text-ink">
              {file ? file.name : t("importDialog.pickFile")}
            </strong>
            <small className="mt-1 text-body-xs text-ink-secondary">{t("importDialog.pickHint")}</small>
          </button>
          {fileInput}

          <p className="mt-3 flex flex-wrap items-center gap-2 text-body-xs text-ink-secondary">
            {t("importDialog.templates")}
            {TEMPLATES.map((type) => (
              <button
                key={type}
                type="button"
                className="font-medium text-brand transition-colors hover:text-brand-strong disabled:opacity-50"
                disabled={downloadTemplate.isPending}
                onClick={() => downloadTemplate.mutate({ type, count: TEMPLATE_QUESTION_COUNT })}
              >
                .{type}
              </button>
            ))}
          </p>

          <label className="mt-[11px] flex flex-col gap-3">
            <span className="text-caption-strong text-ink-secondary uppercase">{t("importDialog.googleLabel")}</span>
            <input
              className={`${MOBILE_INPUT} h-14 font-semibold`}
              value={link}
              placeholder="docs.google.com/forms/d/1aB…"
              onChange={(event) => {
                setLink(event.target.value);
                setFile(null);
                setPreview(null);
              }}
            />
          </label>

          <p className="mt-3 text-body-xs text-ink-secondary">{t("importDialog.googleHint")}</p>

          {preview ? (
            <div className="mt-2 flex flex-col gap-px rounded-lg bg-warning-bg px-3 pt-3 pb-[9px]">
              <strong className="flex items-center gap-2 text-title text-ink">
                <Icon name="warning-fill" size={18} className="shrink-0 text-accent-saffron-fg" />
                {t("importDialog.found", {
                  count: preview.questions.length,
                  warnings: preview.warnings.length,
                })}
              </strong>
              {preview.warnings.slice(0, 2).map((warning) => (
                <small key={warning.questionNumber} className="text-body-sm text-ink-secondary">
                  {t("importDialog.warningLine", {
                    number: warning.questionNumber,
                    reason: warning.reason,
                  })}
                </small>
              ))}
            </div>
          ) : null}
        </div>
      </AppDialog>
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      variant="confirm"
      title={t("importDialog.title")}
      description={t("importDialog.description")}
      footer={
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("importDialog.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={pending || (!file && !link.trim())}
            onClick={submit}
          >
            {t("importDialog.submit")}
          </button>
        </div>
      }
    >
      <button
        type="button"
        className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-brand bg-brand-subtle/40 px-6 py-7 text-center transition-colors hover:bg-brand-subtle"
        onClick={() => fileRef.current?.click()}
      >
        <Icon name="upload" size={22} className="text-brand" />
        <strong className="text-title-sm text-ink">
          {file ? file.name : t("importDialog.pickFile")}
        </strong>
        <small className="text-body-xs text-ink-tertiary">{t("importDialog.pickHint")}</small>
      </button>

      {fileInput}

      <p className="flex flex-wrap items-center gap-2 text-body-xs text-ink-tertiary">
        {t("importDialog.templates")}
        {TEMPLATES.map((type) => (
          <button
            key={type}
            type="button"
            className="text-brand transition-colors hover:text-brand-strong disabled:opacity-50"
            disabled={downloadTemplate.isPending}
            onClick={() => downloadTemplate.mutate({ type, count: TEMPLATE_QUESTION_COUNT })}
          >
            .{type}
          </button>
        ))}
      </p>

      <label className="flex flex-col gap-2">
        <span className="text-overline text-ink-tertiary uppercase">
          {t("importDialog.googleLabel")}
        </span>
        <input
          className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
          value={link}
          placeholder="docs.google.com/forms/d/1aB…"
          onChange={(event) => {
            setLink(event.target.value);
            setFile(null);
            setPreview(null);
          }}
        />
      </label>

      <p className="text-body-xs text-ink-tertiary">{t("importDialog.googleHint")}</p>

      {preview ? (
        <p className="flex flex-col gap-1 rounded-md bg-warning-bg px-4 py-3.5">
          <strong className="flex items-center gap-2 text-title-sm text-warning-fg">
            <Icon name="warning" size={16} className="text-warning" />
            {t("importDialog.found", {
              count: preview.questions.length,
              warnings: preview.warnings.length,
            })}
          </strong>
          {preview.warnings.slice(0, 2).map((warning) => (
            <small key={warning.questionNumber} className="text-body-xs text-warning-fg">
              {t("importDialog.warningLine", {
                number: warning.questionNumber,
                reason: warning.reason,
              })}
            </small>
          ))}
        </p>
      ) : null}
    </AppDialog>
  );
}
