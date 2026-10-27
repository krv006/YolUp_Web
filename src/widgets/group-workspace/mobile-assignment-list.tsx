import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Assignment, QuizSummary } from "@/shared/types";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";

const DAY_MS = 86_400_000;

type Tone = "teal" | "brand" | "success" | "violet" | "danger";

const PILL: Record<Tone, string> = {
  teal: "bg-accent-teal-bg text-accent-teal-fg",
  brand: "bg-brand-subtle text-brand",
  success: "bg-success-bg text-success-fg",
  violet: "bg-accent-violet-bg text-accent-violet-fg",
  danger: "bg-danger-bg text-error-text",
};

const BAR: Record<Tone, string> = {
  teal: "bg-brand",
  brand: "bg-brand",
  success: "bg-success",
  violet: "bg-brand",
  danger: "bg-danger",
};

interface Row {
  id: string;
  title: string;
  meta: string;
  pill: { tone: Tone; icon: string; label: string };
  aside: string;
  progress: number;
  onOpen: () => void;
  menu: Array<{ id: string; label: string; danger?: boolean; run: () => void }>;
}

export interface MobileAssignmentListProps {
  assignments: Assignment[];
  quizzes: QuizSummary[];
  courseTitle: string;
  courseImage?: string | null;
  courseTone?: string;
  onOpenAssignment: (assignment: Assignment) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignment: Assignment) => void;
  onOpenQuiz: (quiz: QuizSummary) => void;
  onEditQuiz: (quiz: QuizSummary) => void;
}

function shortDate(value: string, months: string[]): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
}

function clock(value: string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function MobileAssignmentList({
  assignments,
  quizzes,
  courseTitle,
  courseImage,
  courseTone,
  onOpenAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onOpenQuiz,
  onEditQuiz,
}: MobileAssignmentListProps) {
  const { t } = useTranslation("group");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const [now] = useState(() => Date.now());

  function daysLeft(dueAt: string | null): number | null {
    if (!dueAt) return null;
    const due = new Date(dueAt).getTime();
    if (Number.isNaN(due)) return null;
    return Math.ceil((due - now) / DAY_MS);
  }

  const assignmentRows: Row[] = assignments.map((item) => {
    const total = item.stats?.studentsCount ?? item.submissions.length;
    const submitted = item.stats?.submittedCount ?? item.submissionsCount ?? item.submissions.length;
    const pending = item.submissions.filter((entry) => !entry.grade).length;
    const left = daysLeft(item.dueAt);
    const draft = item.status === "draft";
    const closed = left !== null && left < 0;
    const done = total > 0 && submitted >= total;
    const skill = item.skillKey ? t(`dialogs.assignment.skillOptions.${item.skillKey}`) : "";

    const pill: Row["pill"] = draft
      ? { tone: "violet", icon: "edit", label: t("mobileAssignments.draft") }
      : (closed || done) && pending > 0
        ? { tone: "brand", icon: "quiz", label: t("mobileAssignments.review", { count: pending }) }
        : closed || done
          ? { tone: "success", icon: "check-circle", label: t("mobileAssignments.finished") }
          : left === null
            ? { tone: "teal", icon: "clock", label: t("mobileAssignments.noDue") }
            : { tone: "teal", icon: "clock", label: t("mobileAssignments.daysLeft", { count: Math.max(left, 0) }) };

    return {
      id: item.id,
      title: item.title,
      meta: draft
        ? t("mobileAssignments.draftMeta")
        : [
            item.dueAt
              ? t("mobileAssignments.due", {
                  date: left !== null && left < 0 ? shortDate(item.dueAt, months) : `${shortDate(item.dueAt, months)}, ${clock(item.dueAt)}`,
                })
              : t("mobileAssignments.noDue"),
            skill,
          ]
            .filter(Boolean)
            .join(" · "),
      pill,
      aside: draft
        ? t("mobileAssignments.notSent")
        : pill.tone === "success" && item.stats?.averageScore != null
          ? t("mobileAssignments.average", { value: item.stats.averageScore.toFixed(1).replace(".", ",") })
          : t("mobileAssignments.submitted", { done: submitted, total }),
      progress:
        draft || !total
          ? 0
          : pill.tone === "brand"
            ? Math.round(((submitted - pending) / total) * 100)
            : Math.min(100, Math.round((submitted / total) * 100)),
      onOpen: () => onOpenAssignment(item),
      menu: [
        { id: "open", label: t("mobileAssignments.open"), run: () => onOpenAssignment(item) },
        { id: "edit", label: t("mobileAssignments.edit"), run: () => onEditAssignment(item) },
        { id: "delete", label: t("mobileAssignments.delete"), danger: true, run: () => onDeleteAssignment(item) },
      ],
    };
  });

  const quizRows: Row[] = quizzes.map((quiz) => {
    const left = daysLeft(quiz.dueAt);
    const draft = quiz.status === "draft";
    const closed = left !== null && left < 0;
    return {
      id: `quiz-${quiz.id}`,
      title: quiz.title,
      meta: t("mobileAssignments.quizMeta", { count: quiz.questionCount }),
      pill: draft
        ? { tone: "violet", icon: "edit", label: t("mobileAssignments.draft") }
        : closed
          ? { tone: "success", icon: "check-circle", label: t("mobileAssignments.finished") }
          : { tone: "teal", icon: "clock", label: left === null ? t("mobileAssignments.noDue") : t("mobileAssignments.daysLeft", { count: Math.max(left, 0) }) },
      aside: draft ? t("mobileAssignments.notSent") : "",
      progress: draft ? 0 : closed ? 100 : 0,
      onOpen: () => onOpenQuiz(quiz),
      menu: [
        { id: "open", label: t("mobileAssignments.results"), run: () => onOpenQuiz(quiz) },
        { id: "edit", label: t("mobileAssignments.edit"), run: () => onEditQuiz(quiz) },
      ],
    };
  });

  return (
    <div className="flex flex-col gap-3">
      {[...assignmentRows, ...quizRows].map((row) => (
        <article
          key={row.id}
          role="button"
          tabIndex={0}
          className="flex flex-col gap-3 rounded-xl bg-surface px-4 pt-4 pb-3"
          onClick={row.onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter") row.onOpen();
          }}
        >
          <div className="flex items-center gap-3">
            <GroupTile
              name={courseTitle}
              tone={courseTone}
              src={courseImage}
              className="size-11 rounded-xl bg-subtle"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title text-ink">{row.title}</strong>
              <small className="truncate text-body-sm text-ink-secondary">{row.meta}</small>
            </span>
            <Dropdown>
              <DropdownTrigger asChild>
                <button
                  type="button"
                  className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle"
                  aria-label={t("mobileAssignments.menu")}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Icon name="more" size={20} />
                </button>
              </DropdownTrigger>
              <DropdownContent>
                {row.menu.map((item) => (
                  <DropdownItem
                    key={item.id}
                    destructive={item.danger}
                    onClick={(event) => event.stopPropagation()}
                    onSelect={item.run}
                  >
                    {item.label}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </Dropdown>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-caption-strong ${PILL[row.pill.tone]}`}
            >
              <Icon name={row.pill.icon} size={14} />
              {row.pill.label}
            </span>
            {row.aside ? (
              <small className="ml-auto shrink-0 text-body-xs text-ink-secondary">{row.aside}</small>
            ) : null}
          </div>

          <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
            <span
              className={`block h-full rounded-full ${BAR[row.pill.tone]}`}
              style={{ width: `${row.progress}%` }}
            />
          </span>
        </article>
      ))}
    </div>
  );
}
