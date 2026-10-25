import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  multiple: "check-box",
  true_false: "check-circle",
  numeric: "functions",
  text: "text-fields",
  matching: "link",
  ordering: "sort",
  fill_blank: "text-fields",
  essay: "edit-note",
};

export function QuestionTypeDialog({ open, onOpenChange, onPick }: QuestionTypeDialogProps) {
  const { t } = useTranslation("quiz");
  const [hovered, setHovered] = useState<QuizQuestionType | null>(null);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      title={t("typeDialog.title")}
      description={t("typeDialog.description")}
    >
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map((type) => {
          const active = hovered === type;
          return (
            <button
              key={type}
              type="button"
              className={`flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-colors ${
                active ? "border-brand bg-brand-subtle" : "border-line bg-surface hover:bg-subtle"
              }`}
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(type)}
              onBlur={() => setHovered(null)}
              onClick={() => onPick(type)}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-brand-subtle text-brand">
                <Icon name={TYPE_ICON[type]} size={18} />
              </span>
              <strong className="text-title-sm text-ink">{t(`types.${type}`)}</strong>
              <small className="text-body-xs text-ink-tertiary">{t(`typeDialog.hints.${type}`)}</small>
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
}
