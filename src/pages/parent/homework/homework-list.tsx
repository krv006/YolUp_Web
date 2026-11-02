import { useTranslation } from "react-i18next";
import { parentHomework, type HomeworkFilter, type HomeworkState } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import type { Assignment } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { STATE_CHIP, STATE_TILE } from "./homework-styles";

const FILTERS: HomeworkFilter[] = ["all", "waiting", "submitted"];

export function StateChip({ assignment, state, now }: { assignment: Assignment; state: HomeworkState; now: number }) {
  const { t } = useTranslation("parent");
  const chip = STATE_CHIP[state];
  if (state === "graded") {
    const submission = assignment.mySubmission;
    return (
      <span className={`inline-flex shrink-0 items-baseline gap-0.5 rounded-xl px-2.5 py-1 ${chip.tone}`}>
        <strong className="font-heading text-[18px]/6 font-semibold">{submission?.gradeValue}</strong>
        <small className="text-caption-strong">/{assignment.maxScore}</small>
      </span>
    );
  }
  let label = t(`homeworkView.state.${state}`);
  if (state === "pending") {
    const left = assignment.dueAt ? parentHomework.countdown(assignment.dueAt, now) : null;
    label = !left
      ? t("homeworkView.noDue")
      : left.days
        ? t("homeworkView.daysLeft", { count: left.days })
        : t("homeworkView.hoursLeft", { count: Math.max(1, left.hours) });
  }
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-caption-strong ${chip.tone}`}>
      {chip.icon ? <Icon name={chip.icon} size={14} /> : null}
      {label}
    </span>
  );
}

function rowMeta(assignment: Assignment, state: HomeworkState, t: (key: string, options?: Record<string, unknown>) => string): string {
  const pattern = t("homeworkView.shortPattern");
  const course = assignment.courseTitle;
  const submission = assignment.mySubmission;
  if (state === "graded" && submission)
    return `${course} · ${t("homeworkView.gradedOn", { date: formatLocalized(submission.checkedAt ?? submission.createdAt, pattern).toLowerCase() })}`;
  if (submission) return `${course} · ${t("homeworkView.submittedOn", { date: formatLocalized(submission.createdAt, pattern).toLowerCase() })}`;
  if (!assignment.dueAt) return `${course} · ${t("homeworkView.noDue")}`;
  if (state === "overdue") return `${course} · ${t("homeworkView.dueWas", { date: formatLocalized(assignment.dueAt, pattern).toLowerCase() })}`;
  return `${course} · ${formatLocalized(assignment.dueAt, `${pattern}, HH:mm`).toLowerCase()}`;
}

function Row({
  assignment,
  now,
  active,
  onSelect,
}: {
  assignment: Assignment;
  now: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation("parent");
  const state = parentHomework.homeworkState(assignment, now);
  const tile = STATE_TILE[state];
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        aria-current={active || undefined}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${active ? "bg-brand-subtle" : "hover:bg-subtle"}`}
        onClick={onSelect}
      >
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tile.tone}`}>
          <Icon name={tile.icon} size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="truncate text-title-sm text-ink">{assignment.title}</strong>
          <small className="truncate text-body-xs text-ink-secondary">{rowMeta(assignment, state, t)}</small>
        </span>
        <StateChip assignment={assignment} state={state} now={now} />
      </button>
    </li>
  );
}

export function HomeworkList({
  assignments,
  now,
  filter,
  selectedId,
  onFilter,
  onSelect,
}: {
  assignments: Assignment[];
  now: number;
  filter: HomeworkFilter;
  selectedId: string | null;
  onFilter: (filter: HomeworkFilter) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("parent");
  const stats = parentHomework.homeworkStats(assignments, now);
  const { waiting, submitted } = parentHomework.splitHomework(assignments, filter, now);
  const sections = [
    { key: "waiting", items: waiting },
    { key: "submitted", items: submitted },
  ].filter((section) => section.items.length);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "waiting", value: String(stats.waiting), tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
          { key: "checking", value: String(stats.checking), tone: "bg-accent-teal-bg text-accent-teal-fg" },
          { key: "average", value: stats.average === null ? "—" : String(stats.average), tone: "bg-accent-green-bg text-accent-green-fg" },
        ].map((tile) => (
          <span key={tile.key} className={`flex flex-col rounded-2xl px-3.5 py-2.5 ${tile.tone}`}>
            <strong className="font-heading text-[22px]/7 font-semibold">{tile.value}</strong>
            <small className="text-caption">{t(`homeworkView.stats.${tile.key}`)}</small>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`flex h-11 items-center rounded-full border px-5 text-button transition-colors ${
              filter === item ? "border-brand bg-brand text-on-action" : "border-line-strong bg-surface text-ink hover:bg-subtle"
            }`}
            onClick={() => onFilter(item)}
          >
            {t(`homeworkView.filters.${item}`)}
          </button>
        ))}
      </div>
      {sections.length ? (
        sections.map((section) => (
          <section key={section.key} className="flex flex-col gap-2">
            <small className="px-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
              {t(`homeworkView.sections.${section.key}`)}
            </small>
            <ul className="overflow-hidden rounded-[20px] bg-surface">
              {section.items.map((assignment) => (
                <Row
                  key={assignment.id}
                  assignment={assignment}
                  now={now}
                  active={assignment.id === selectedId}
                  onSelect={() => onSelect(assignment.id)}
                />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="rounded-[20px] bg-surface px-5 py-10 text-center text-body-sm text-ink-tertiary">
          {t("homeworkView.filteredEmpty")}
        </p>
      )}
    </div>
  );
}
