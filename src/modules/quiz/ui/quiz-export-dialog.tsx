import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import type { QuizExportMode, QuizExportType } from "../api/quiz.api";

export interface QuizExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Hozir yuklanayotgan fayl (`mode:type`) — tugma aylanib turadi. */
  pending?: string | null;
  onExport: (type: QuizExportType, mode: QuizExportMode) => void;
}

const OPTIONS: ReadonlyArray<{ mode: QuizExportMode; types: ReadonlyArray<QuizExportType> }> = [
  { mode: "student", types: ["pdf", "docx"] },
  { mode: "teacher", types: ["pdf", "docx", "xlsx"] },
];

const PHONE_TYPES: ReadonlyArray<QuizExportType> = ["pdf", "docx", "xlsx"];

/** Testni qog'ozga/faylga chiqarish: o'quvchiga tarqatish nusxasi (javobsiz) va o'qituvchi nusxasi (javoblar bilan). */
export function QuizExportDialog({
  open,
  onOpenChange,
  title,
  pending = null,
  onExport,
}: QuizExportDialogProps) {
  const { t } = useTranslation("quiz");
  const isCompact = useIsCompact();

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("exportDialog.title")}
      description={isCompact ? t("exportDialog.phoneDescription", { title }) : title}
      footer={
        <button
          type="button"
          className={dialogButton.secondary}
          onClick={() => onOpenChange(false)}
        >
          {t("exportDialog.close")}
        </button>
      }
    >
      {isCompact ? (
        <div className="flex flex-col">
          {PHONE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="flex h-14 items-center gap-3 rounded-xl px-2 text-left text-body text-ink transition-colors hover:bg-subtle disabled:opacity-50"
              disabled={Boolean(pending)}
              onClick={() => onExport(type, "teacher")}
            >
              {pending === `teacher:${type}` ? (
                <Loader2 size={19} className="shrink-0 animate-spin text-ink-secondary" />
              ) : (
                <Download size={19} className="shrink-0 text-ink-secondary" />
              )}
              {t(`exportDialog.type.${type}`)}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {OPTIONS.map(({ mode, types }) => (
            <div key={mode} className="flex flex-col gap-2">
              <strong className="text-label-strong text-ink">{t(`exportDialog.${mode}`)}</strong>
              <p className="text-caption text-ink-tertiary">{t(`exportDialog.${mode}Hint`)}</p>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-label-strong text-ink transition-colors hover:bg-subtle disabled:opacity-50"
                    disabled={Boolean(pending) && pending !== `${mode}:${type}`}
                    onClick={() => onExport(type, mode)}
                  >
                    {pending === `${mode}:${type}` ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : type === "xlsx" ? (
                      <FileSpreadsheet size={15} />
                    ) : (
                      <FileText size={15} />
                    )}
                    {t(`exportDialog.type.${type}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppDialog>
  );
}
