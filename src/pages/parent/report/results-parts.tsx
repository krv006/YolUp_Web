import { useTranslation } from "react-i18next";
import { useChildRank } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import type { Assignment } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";

export function CourseRank({ childId, courseId, now }: { childId: string | null; courseId: string; now: number }) {
  const { t } = useTranslation("parent");
  const date = new Date(now);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const rank = useChildRank(childId, courseId, month);
  const data = rank.data;
  if (!data || data.rank === null || !data.total) return null;
  return (
    <span
      className="inline-flex items-center gap-1 self-start rounded-full bg-accent-violet-bg px-2.5 py-1 text-caption-strong whitespace-nowrap text-accent-violet-fg"
      title={`${data.rank} / ${data.total}`}
    >
      <Icon name="emoji-events" size={14} />
      {[t("results.rank.place", { rank: data.rank }), data.top_percent !== null ? t("results.rank.top", { value: data.top_percent }) : ""]
        .filter(Boolean)
        .join(" · ")}
    </span>
  );
}
export function MonthPicker({
  months,
  value,
  onChange,
}: {
  months: Array<{ year: number; month: number }>;
  value: { year: number; month: number };
  onChange: (value: { year: number; month: number }) => void;
}) {
  const { t } = useTranslation("parent");
  return (
    <label className="relative flex h-11 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface pr-4 pl-4 text-button text-ink">
      <Icon name="calendar-month" size={18} className="shrink-0" />
      <span>{formatLocalized(new Date(value.year, value.month, 1), "LLLL yyyy")}</span>
      <select
        aria-label={t("results.month")}
        className="absolute inset-0 cursor-pointer opacity-0"
        value={`${value.year}-${value.month}`}
        onChange={(event) => {
          const [year, month] = event.target.value.split("-").map(Number);
          onChange({ year, month });
        }}
      >
        {months.map((item) => (
          <option key={`${item.year}-${item.month}`} value={`${item.year}-${item.month}`}>
            {formatLocalized(new Date(item.year, item.month, 1), "LLLL yyyy")}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GradeRow({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation("parent");
  const submission = assignment.mySubmission;
  const graded = submission?.gradeValue != null;
  return (
    <li className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          graded ? "bg-accent-green-bg text-accent-green-fg" : "bg-accent-teal-bg text-accent-teal-fg"
        }`}
      >
        <Icon name={graded ? "check-circle" : "assignment"} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title-sm text-ink">{assignment.title}</strong>
        <small className="truncate text-body-xs text-ink-secondary">
          {assignment.courseTitle}
          {submission ? ` · ${formatLocalized(submission.checkedAt ?? submission.createdAt, t("homeworkView.shortPattern")).toLowerCase()}` : ""}
        </small>
      </span>
      {graded ? (
        <span className="inline-flex items-baseline gap-0.5 rounded-xl bg-success-bg px-2.5 py-1 text-success-text">
          <strong className="font-heading text-[18px]/6 font-semibold">{submission?.gradeValue}</strong>
          <small className="text-caption-strong">/{assignment.maxScore}</small>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
          <Icon name="pending" size={14} />
          {t("homeworkView.state.checking")}
        </span>
      )}
    </li>
  );
}
