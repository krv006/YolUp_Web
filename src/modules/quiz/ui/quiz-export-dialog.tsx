import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { QuizExportMode, QuizExportType } from "../api/quiz.api";

export interface QuizExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Hozir yuklanayotgan fayl (`mode:type`) — tugma aylanib turadi. */
  pending?: string | null;
  onExport: (type: QuizExportType, mode: QuizExportMode) => void;
}

const MODES: QuizExportMode[] = ["student", "teacher"];

const FORMATS: ReadonlyArray<{ type: QuizExportType; icon: string; teacherOnly?: boolean }> = [
  { type: "pdf", icon: "description-fill" },
  { type: "docx", icon: "description-fill" },
  { type: "xlsx", icon: "grid-view", teacherOnly: true },
];

export function QuizExportDialog({
  open,
  onOpenChange,
  title,
  pending = null,
  onExport,
}: QuizExportDialogProps) {
  const { t } = useTranslation("quiz");
  const isCompact = useIsCompact();
  const [mode, setMode] = useState<QuizExportMode>("student");
  const [type, setType] = useState<QuizExportType>("pdf");

  function pickMode(next: QuizExportMode) {
    setMode(next);
    if (next === "student" && type === "xlsx") setType("pdf");
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant={isCompact ? "adaptive" : "confirm"}
      width="lg:w-120"
      title={t("exportDialog.title")}
      description={t("exportDialog.description", { title })}
      footerClassName={isCompact ? "px-4 pt-5 pb-8.5" : undefined}
      footer={
        <button
          type="button"
          className={`${dialogButton.primary} max-lg:h-13 max-lg:text-title max-lg:font-semibold`}
          disabled={Boolean(pending)}
          onClick={() => onExport(type, mode)}
        >
          {t("exportDialog.submit")}
        </button>
      }
    >
      <div className="flex flex-col gap-3 max-lg:-mt-0.5 max-lg:gap-2.5">
        {MODES.map((item) => {
          const active = mode === item;
          return (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={active}
              className={`flex items-center gap-3.5 rounded-md px-4.5 py-3 text-left transition-colors max-lg:h-17.5 max-lg:rounded-lg max-lg:border-[1.5px] max-lg:px-4 max-lg:py-0 ${
                active ? "border border-brand bg-brand-subtle" : "border border-line bg-surface"
              }`}
              onClick={() => pickMode(item)}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink max-lg:text-title">
                  {t(`exportDialog.${item}`)}
                </strong>
                <small className="truncate text-body-xs text-ink-tertiary max-lg:text-ink-secondary">
                  {t(`exportDialog.${item}Hint`)}
                </small>
              </span>
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full max-lg:size-5.5 ${
                  active ? "bg-brand" : "border-2 border-line-strong bg-surface max-lg:border-[1.5px]"
                }`}
              >
                {active ? <i className="size-2.5 rounded-full bg-surface not-italic" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <span className="text-overline text-ink-tertiary uppercase max-lg:-mt-[5px] max-lg:-mb-1.5 max-lg:text-caption-strong max-lg:text-ink-secondary">
        {t("exportDialog.format")}
      </span>

      <div className="grid grid-cols-3 gap-3 max-lg:gap-2.5">
        {FORMATS.map((format) => {
          const disabled = Boolean(format.teacherOnly) && mode !== "teacher";
          const active = type === format.type && !disabled;
          return (
            <button
              key={format.type}
              type="button"
              className={`flex h-23 flex-col items-center justify-center gap-2 rounded-md border transition-colors disabled:opacity-40 max-lg:h-18.5 max-lg:gap-1.5 max-lg:rounded-lg max-lg:border-[1.5px] ${
                active ? "border-brand bg-brand-subtle text-brand" : "border-line bg-surface text-ink"
              }`}
              disabled={disabled}
              onClick={() => setType(format.type)}
            >
              <Icon name={format.icon} size={22} className={active ? "" : "text-icon-secondary"} />
              <small className="text-title-sm max-lg:text-ink">{t(`exportDialog.type.${format.type}`)}</small>
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}
