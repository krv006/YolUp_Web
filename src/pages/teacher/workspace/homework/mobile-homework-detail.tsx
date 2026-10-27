import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Assignment, Submission } from "@/shared/types";

type AiGroupSummary = NonNullable<Assignment["aiGroupSummary"]>;
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger, Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";

type Filter = "all" | "unchecked" | "graded";

const STATUS: Record<string, { tone: string; icon: string }> = {
  pending: { tone: "bg-brand-subtle text-brand", icon: "quiz" },
  late: { tone: "bg-accent-saffron-bg text-accent-saffron-fg", icon: "hourglass-empty" },
  graded: { tone: "bg-success-bg text-success-fg", icon: "check-circle" },
  checking: { tone: "bg-accent-violet-bg text-accent-violet-fg", icon: "auto-awesome" },
  error: { tone: "bg-danger-bg text-error-text", icon: "warning" },
};

function rowStatus(row: Submission): keyof typeof STATUS {
  if (row.gradeValue !== null || row.grade) return "graded";
  if (row.status === "checking") return "checking";
  if (row.status === "error") return "error";
  if (row.isLate) return "late";
  return "pending";
}

export interface MobileHomeworkDetailProps {
  item: Assignment | null;
  eyebrow: string;
  summary: AiGroupSummary | null;
  summaryPending: boolean;
  missing: number;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRemind: () => void;
  onSummary: () => void;
  onOpenSubmission: (row: Submission) => void;
}

export function MobileHomeworkDetail({
  item,
  eyebrow,
  summary,
  summaryPending,
  missing,
  onBack,
  onEdit,
  onDelete,
  onRemind,
  onSummary,
  onOpenSubmission,
}: MobileHomeworkDetailProps) {
  const { t } = useTranslation("homework");
  const [filter, setFilter] = useState<Filter>("all");
  const submissions = useMemo(() => item?.submissions ?? [], [item]);
  const total = item?.stats?.studentsCount ?? submissions.length;
  const unchecked = submissions.filter((row) => rowStatus(row) !== "graded").length;
  const rows = submissions.filter((row) =>
    filter === "unchecked" ? rowStatus(row) !== "graded" : filter === "graded" ? rowStatus(row) === "graded" : true
  );

  const stats = [
    { value: `${submissions.length}/${total}`, label: t("detail.stats.submitted"), tone: "text-ink" },
    { value: String(unchecked), label: t("mobileDetail.review"), tone: "text-brand" },
    { value: String(missing), label: t("detail.stats.missing"), tone: "text-error-text" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
        <header className="flex items-center justify-between">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-subtle text-ink"
            onClick={onBack}
            aria-label={t("mobileDetail.back")}
          >
            <Icon name="chevron-left" size={22} />
          </button>
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full bg-subtle text-ink"
                aria-label={t("mobileDetail.menu")}
              >
                <Icon name="more" size={22} />
              </button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem onSelect={onEdit}>{t("detail.edit")}</DropdownItem>
              <DropdownItem destructive onSelect={onDelete}>
                {t("detail.delete")}
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </header>

        <small className="mt-4 truncate text-caption text-ink-secondary">{eyebrow}</small>
        <h1 className="mt-0.5 text-[22px]/[28px] font-bold text-ink">{item?.title}</h1>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <span key={stat.label} className="flex h-16 flex-col justify-center rounded-xl bg-surface px-3">
              <strong className={`text-title-lg leading-6 ${stat.tone}`}>{stat.value}</strong>
              <small className="truncate text-caption text-ink-secondary">{stat.label}</small>
            </span>
          ))}
        </div>

        <section className="mt-4 flex flex-col gap-3 rounded-xl bg-surface p-4">
          <strong className="flex items-center gap-2 text-title text-ink">
            <Icon name="auto-awesome" size={20} className="text-accent-saffron-fg" />
            {t("mobileDetail.aiSummary")}
          </strong>
          <p className="text-body-sm text-ink-secondary">
            {summary ? summary.text || summary.summary : t("detail.aiAdviceHint")}
          </p>
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-subtle text-button text-brand disabled:opacity-50"
            disabled={summaryPending || !submissions.length}
            onClick={onSummary}
          >
            <Icon name="auto-awesome" size={18} />
            {t("mobileDetail.groupAdvice")}
          </button>
        </section>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              ["all", `${t("detail.filters.all")} · ${total}`],
              ["unchecked", t("detail.status.pending_review")],
              ["graded", t("mobileDetail.graded")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium transition-colors ${
                filter === id ? "bg-brand text-on-action" : "border border-line-strong bg-surface text-ink"
              }`}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-4 flex flex-col overflow-hidden rounded-xl bg-surface">
          {rows.map((row) => {
            const status = rowStatus(row);
            const grade = row.gradeValue ?? (row.grade ? Number(row.grade) : null);
            return (
              <li key={row.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => onOpenSubmission(row)}
                >
                  <Avatar name={row.studentName} size="sm" className="[&_.avatar]:size-11" />
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <strong className="max-w-full truncate text-title text-ink">{row.studentName}</strong>
                    <span className={`flex h-6 items-center gap-1 rounded-full px-2 text-caption-strong ${STATUS[status].tone}`}>
                      <Icon name={STATUS[status].icon} size={13} />
                      {t(`mobileDetail.status.${status}`)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <small className="text-caption text-ink-secondary">
                      AI {row.overallScore === null ? "—" : Math.round(((row.overallScore ?? 0) / 100) * (item?.maxScore || 5))}
                    </small>
                    <strong className={`text-title-lg leading-6 ${grade === null ? "text-ink-secondary" : "text-success-fg"}`}>
                      {grade === null ? "—" : grade}
                    </strong>
                  </span>
                </button>
              </li>
            );
          })}
          {!rows.length ? (
            <li className="px-4 py-8 text-center text-body-sm text-ink-secondary">{t("detail.noStudents")}</li>
          ) : null}
        </ul>
      </div>

      <div className="shrink-0 rounded-t-2xl bg-surface px-4 pt-3 pb-8">
        <button
          type="button"
          className="flex h-13 w-full items-center justify-center gap-2 rounded-full border border-line-strong text-button text-ink disabled:opacity-50"
          disabled={!missing}
          onClick={onRemind}
        >
          <Icon name="notifications" size={18} />
          {t("detail.remind", { count: missing })}
        </button>
      </div>
    </div>
  );
}
