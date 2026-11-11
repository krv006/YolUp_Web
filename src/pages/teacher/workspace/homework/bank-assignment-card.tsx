import { useTranslation } from "react-i18next";
import type { Assignment } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";

export interface BankAssignmentCardProps {
  item: Assignment;
  compact?: boolean;
  onOpen: () => void;
  onGive: () => void;
}

export function BankAssignmentCard({ item, compact = false, onOpen, onGive }: BankAssignmentCardProps) {
  const { t } = useTranslation("homework");
  const meta = [
    item.questionsCount ? t("bank.questions", { count: item.questionsCount }) : "",
    item.copiesCount ? t("bank.copies", { count: item.copiesCount }) : t("bank.notGiven"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={`flex items-center gap-3 bg-surface ${compact ? "rounded-xl p-4" : "rounded-lg p-5"}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
        <Icon name="menu-book" size={20} />
      </span>
      <button type="button" className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left" onClick={onOpen}>
        <strong className="w-full truncate text-title text-ink">{item.title}</strong>
        <small className="w-full truncate text-body-xs text-ink-tertiary">{meta}</small>
      </button>
      <button
        type="button"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-button text-on-action transition-colors hover:bg-brand-strong"
        onClick={onGive}
      >
        <Icon name="send" size={16} />
        {t("bank.give")}
      </button>
    </article>
  );
}
