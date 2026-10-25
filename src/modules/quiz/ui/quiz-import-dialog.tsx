import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { QuizImportPreview, QuizSummary } from "@/shared/types";
import { quizApi } from "../api/quiz.api";
import type { QuizImportRequest } from "../api/quiz.dto";
import { useImportGoogleLink, useImportQuizDocx } from "../model/quiz.queries";

export interface QuizImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: QuizImportRequest;
  onImported?: (quiz: QuizSummary) => void;
}

const ACCEPT = ".docx,.xlsx,.json";

export function QuizImportDialog({
  open,
  onOpenChange,
  request,
  onImported,
}: QuizImportDialogProps) {
  const { t } = useTranslation("quiz");
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [preview, setPreview] = useState<QuizImportPreview | null>(null);

  const importDocx = useImportQuizDocx();
  const importLink = useImportGoogleLink();
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

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => pick(event.target.files?.[0] ?? null)}
      />

      <p className="flex flex-wrap items-center gap-2 text-body-xs text-ink-tertiary">
        {t("importDialog.templates")}
        {[".docx", ".xlsx", ".json"].map((extension) => (
          <button
            key={extension}
            type="button"
            className="text-brand transition-colors hover:text-brand-strong"
            onClick={() => toast.info(t("importDialog.templateSoon"))}
          >
            {extension}
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
