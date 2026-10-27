import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import type { QuizQuestionType } from "@/shared/types";

export interface QuestionTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (type: QuizQuestionType) => void;
}

const TYPES: QuizQuestionType[] = [
  "single",
  "multiple",
  "true_false",
  "numeric",
  "matching",
  "ordering",
  "fill_blank",
  "essay",
];

const TYPE_ICON: Record<QuizQuestionType, string> = {
  single: "radio-unchecked",
  multiple: "check-box-fill",
  true_false: "task-alt",
  numeric: "functions",
  text: "text-fields",
  matching: "link",
  ordering: "sort",
  fill_blank: "text-fields",
  essay: "edit-note",
};

export function QuestionTypeDialog({ open, onOpenChange, onPick }: QuestionTypeDialogProps) {
  const { t } = useTranslation("quiz");
  const isCompact = useIsCompact();
  const [hovered, setHovered] = useState<QuizQuestionType | null>(null);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant={isCompact ? "adaptive" : "confirm"}
      title={t("typeDialog.title")}
      description={t("typeDialog.description")}
      footer={isCompact ? <span aria-hidden="true" /> : undefined}
      footerClassName="pb-6"
    >
      <div className="grid grid-cols-2 gap-3 max-lg:-mt-1 max-lg:gap-2.5">
        {TYPES.map((type) => {
          const active = hovered === type;
          return (
            <button
              key={type}
              type="button"
              className={`flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-colors max-lg:h-26.5 max-lg:gap-0 max-lg:rounded-lg max-lg:px-3.5 max-lg:pt-3 max-lg:pb-0 ${
                active ? "border-brand bg-brand-subtle max-lg:border-[1.5px]" : "border-line bg-surface hover:bg-subtle"
              }`}
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(type)}
              onBlur={() => setHovered(null)}
              onClick={() => onPick(type)}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-brand-subtle text-brand max-lg:rounded-md">
                <Icon name={TYPE_ICON[type]} size={18} />
              </span>
              <strong className="text-title-sm text-ink max-lg:mt-3 max-lg:text-title">
                {isCompact ? t(`editor.mobile.types.${type}`) : t(`types.${type}`)}
              </strong>
              <small className="text-body-xs text-ink-tertiary max-lg:mt-1 max-lg:text-ink-secondary">
                {t(`typeDialog.hints.${type}`)}
              </small>
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}
