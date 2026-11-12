import { useTranslation } from "react-i18next";
import type { AssignmentCopy } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { formatDue } from "./format-due";

export interface BankCopiesProps {
  copies: AssignmentCopy[];
  compact?: boolean;
  onOpen: (id: string) => void;
}

export function BankCopies({ copies, compact = false, onOpen }: BankCopiesProps) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  if (!copies.length) return null;

  return (
    <section className={`flex flex-col gap-1 bg-surface p-2 ${compact ? "rounded-xl" : "rounded-lg"}`}>
      <strong className="px-3 pt-2 pb-1 text-title-sm text-ink">{t("bank.copiesTitle", { count: copies.length })}</strong>
      <ul className="flex flex-col">
        {copies.map((copy) => (
          <li key={copy.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-subtle"
              onClick={() => onOpen(copy.id)}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
                <Icon name={copy.studentIds ? "person" : "groups"} size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="truncate text-title-sm text-ink">{copy.courseTitle || t("bank.copyNoGroup")}</strong>
                <small className="truncate text-body-xs text-ink-secondary">
                  {[
                    copy.dueAt ? t("bank.copyDue", { date: formatDue(copy.dueAt, months) }) : t("bank.copyNoDue"),
                    t("bank.copySubmitted", { count: copy.submissionsCount }),
                  ].join(" · ")}
                </small>
                <small className="truncate text-caption text-ink-tertiary">
                  {copy.studentIds
                    ? t("bank.copyStudents", { count: copy.studentIds.length })
                    : t("bank.copyWholeGroup")}
                </small>
              </span>
              <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
