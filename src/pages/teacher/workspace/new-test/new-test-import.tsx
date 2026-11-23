import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  quizApi,
  useDownloadQuizTemplate,
  useImportGoogleLink,
  useImportQuizDocx,
  useImportQuizText,
} from "@/modules/quiz";
import type { QuizDetail, QuizImportPreview } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { CARD, FIELD, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const TEMPLATE_QUESTION_COUNT = 10;

export interface NewTestImportProps {
  onCreated: (quiz: QuizDetail) => void;
}

/** «Tayyor testni yuklash»: Word/Excel fayl, Google Form/Doc havolasi yoki joylangan matn — hammasi qoralama test bo'ladi. */
export function NewTestImport({ onCreated }: NewTestImportProps) {
  const { t } = useTranslation("quiz");
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<QuizImportPreview | null>(null);
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const request = { topic: t("tests.importedTopic") };
  const importDocx = useImportQuizDocx();
  const importLink = useImportGoogleLink();
  const importText = useImportQuizText();
  const downloadTemplate = useDownloadQuizTemplate();
  const previewFile = useMutation({
    mutationFn: (value: File) => quizApi.importDocxPreview(value),
    onSuccess: setPreview,
    onError: (error: Error) => toast.error(error.message),
  });

  function pickFile(next: File | null) {
    setFile(next);
    setPreview(null);
    if (next) previewFile.mutate(next);
  }

  function createFromFile() {
    if (!file) return;
    importDocx.mutate({ file, request }, { onSuccess: (result) => onCreated(result.quiz) });
  }

  function readLink() {
    const url = link.trim();
    if (!/docs\.google\.com\/(forms|document)\//.test(url)) {
      setLinkError(t("newPage.import.googleInvalid"));
      return;
    }
    setLinkError(null);
    importLink.mutate(
      { source: url.includes("/forms/") ? "google_form" : "google_doc", url, request },
      { onSuccess: (result) => onCreated(result.quiz) }
    );
  }

  function readText() {
    if (!text.trim()) return;
    importText.mutate({ text, request }, { onSuccess: (result) => onCreated(result.quiz) });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={CARD}>
        <header className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-title text-ink">
            <Icon name="description" size={20} className="text-brand" />
            {t("newPage.import.fileTitle")}
          </h2>
          <p className="text-body-sm text-ink-secondary">{t("newPage.import.fileHint")}</p>
        </header>

        <input
          ref={fileRef}
          type="file"
          accept=".docx,.xlsx"
          className="hidden"
          onChange={(event) => {
            pickFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" className={SECONDARY_BUTTON} onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} />
            {file ? file.name : t("newPage.import.pickFile")}
          </button>
          {(["docx", "xlsx"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className="flex h-10 items-center gap-1.5 rounded-full px-3 text-button text-brand transition-colors hover:text-brand-strong disabled:opacity-50"
              disabled={downloadTemplate.isPending}
              onClick={() => downloadTemplate.mutate({ type, count: TEMPLATE_QUESTION_COUNT })}
            >
              <Icon name="download" size={16} />
              {t(type === "docx" ? "newPage.import.templateWord" : "newPage.import.templateExcel")}
            </button>
          ))}
        </div>

        {previewFile.isPending ? (
          <small className="text-body-xs text-ink-secondary">{t("newPage.import.reading")}</small>
        ) : null}
        <InlineError error={previewFile.error ?? importDocx.error} />

        {preview ? (
          <div className="flex flex-col gap-3">
            <p className="flex flex-col gap-1 rounded-md bg-subtle px-4 py-3">
              <strong className="text-title-sm text-ink">
                {t("newPage.import.found", { count: preview.questions.length })}
              </strong>
              {preview.warnings.length ? (
                <small className="text-body-xs text-warning-fg">
                  {t("newPage.import.foundWarnings", { count: preview.warnings.length })}
                </small>
              ) : null}
            </p>
            <button
              type="button"
              className={`${PRIMARY_BUTTON} self-start`}
              disabled={importDocx.isPending}
              onClick={createFromFile}
            >
              {t("newPage.import.createTest")}
            </button>
          </div>
        ) : null}
      </section>

      <section className={CARD}>
        <header className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-title text-ink">
            <Icon name="link" size={20} className="text-brand" />
            {t("newPage.import.googleTitle")}
          </h2>
          <p className="text-body-sm text-ink-secondary">{t("newPage.import.googleHint")}</p>
        </header>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            className={`${FIELD} min-w-64 flex-1`}
            value={link}
            placeholder="https://docs.google.com/forms/d/e/…"
            onChange={(event) => {
              setLink(event.target.value);
              setLinkError(null);
            }}
          />
          <button
            type="button"
            className={PRIMARY_BUTTON}
            disabled={importLink.isPending || !link.trim()}
            onClick={readLink}
          >
            {t("newPage.import.read")}
          </button>
        </div>
        {linkError ? <small className="text-body-xs text-error-text">{linkError}</small> : null}
        <InlineError error={importLink.error} />
      </section>

      <section className={CARD}>
        <header className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-title text-ink">
            <Icon name="text-fields" size={20} className="text-brand" />
            {t("newPage.import.textTitle")}
          </h2>
          <p className="text-body-sm text-ink-secondary">{t("newPage.import.textHint")}</p>
        </header>
        <textarea
          className="min-h-40 w-full resize-y rounded-md border border-transparent bg-subtle px-4 py-3 font-mono text-body-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
          value={text}
          placeholder={t("newPage.import.textPlaceholder")}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="button"
          className={`${PRIMARY_BUTTON} self-start`}
          disabled={importText.isPending || !text.trim()}
          onClick={readText}
        >
          {t("newPage.import.read")}
        </button>
        <InlineError error={importText.error} />
      </section>
    </div>
  );
}

/** So'rov xatosi sahifada qoladi (toast bir necha soniyada yo'qoladi). */
function InlineError({ error }: { error: Error | null }) {
  return error ? (
    <small role="alert" className="text-body-xs text-error-text">
      {error.message}
    </small>
  ) : null;
}
