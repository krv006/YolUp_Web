import { useTranslation } from "react-i18next";
import type { Assignment, Course } from "@/shared/types";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { MobileEmptyCard, MobilePageHeader, MobileSegment, mobileRoundButton } from "@/shared/ui/mobile-page";
import { formatDue } from "./format-due";

export type HomeworkFilter = "active" | "review" | "draft";

export interface MobileHomeworkListProps {
  filter: HomeworkFilter;
  counts: Record<HomeworkFilter, number>;
  sections: Array<{ id: "week" | "earlier"; rows: Assignment[] }>;
  courses: Map<string, Course>;
  loading: boolean;
  onFilterChange: (filter: HomeworkFilter) => void;
  onBack: () => void;
  onCreate: () => void;
  onOpen: (item: Assignment) => void;
  onReview: (item: Assignment) => void;
  onDelete: (item: Assignment) => void;
}

function daysLeft(value: string | null): number | null {
  if (!value) return null;
  const due = new Date(value).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - Date.now()) / 86_400_000);
}

export function MobileHomeworkList({
  filter,
  counts,
  sections,
  courses,
  loading,
  onFilterChange,
  onBack,
  onCreate,
  onOpen,
  onReview,
  onDelete,
}: MobileHomeworkListProps) {
  const { t } = useTranslation("homework");
  const filters: HomeworkFilter[] = ["active", "review", "draft"];
  const empty = !loading && sections.every((section) => !section.rows.length);

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-8 font-body text-ink">
      <MobilePageHeader
        title={t("list.title")}
        backLabel={t("list.mobile.back")}
        onBack={onBack}
        action={
          <button type="button" className={mobileRoundButton} aria-label={t("list.create")} onClick={onCreate}>
            <Icon name="add" size={24} />
          </button>
        }
      />

      <div className="mt-4.5">
        <MobileSegment
          items={filters.map((id) => ({
            id,
            label: counts[id] ? `${t(`list.filters.${id}`)} · ${counts[id]}` : t(`list.filters.${id}`),
          }))}
          value={filter}
          onChange={onFilterChange}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="h-32.5 animate-pulse rounded-xl bg-surface" />
            ))
          : null}

        {sections.map((section) =>
          section.rows.length ? (
            <section key={section.id} className="contents">
              <span className="text-caption-strong text-ink-secondary uppercase">
                {t(`list.sections.${section.id}`)}
              </span>
              {section.rows.map((item) => (
                <AssignmentCard
                  key={item.id}
                  item={item}
                  course={courses.get(item.courseId)}
                  onOpen={() => onOpen(item)}
                  onReview={() => onReview(item)}
                  onDelete={() => onDelete(item)}
                />
              ))}
            </section>
          ) : null
        )}

        {empty ? <MobileEmptyCard icon="assign" title={t("list.empty")} /> : null}
      </div>
    </main>
  );
}

function AssignmentCard({
  item,
  course,
  onOpen,
  onReview,
  onDelete,
}: {
  item: Assignment;
  course: Course | undefined;
  onOpen: () => void;
  onReview: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const days = daysLeft(item.dueAt);
  const due = item.dueAt ? formatDue(item.dueAt, months).replace(", 23:59", "") : "";
  const submitted = item.stats?.submittedCount ?? 0;
  const total = item.stats?.studentsCount ?? 0;
  const pending = item.submissions.filter((row) => row.status !== "done").length;
  const percent = total ? Math.min(100, Math.round((submitted / total) * 100)) : 0;

  return (
    <article className="flex flex-col rounded-xl bg-surface p-4">
      <div className="flex h-11 items-center gap-3">
        <GroupTile
          name={item.courseTitle}
          src={course?.avatarUrl}
          tone={course?.color}
          className="size-11 rounded-md text-title-sm"
        />
        <button type="button" className="flex min-w-0 flex-1 flex-col text-left" onClick={onOpen}>
          <strong className="w-full truncate text-title text-ink">{item.title}</strong>
          <small className="w-full truncate text-body-sm text-ink-secondary">
            {item.courseTitle}
            {due ? ` · ${days !== null && days >= 0 ? t("list.due", { value: due }) : due}` : ""}
          </small>
        </button>
        <Dropdown>
          <DropdownTrigger asChild>
            <button
              type="button"
              className="-mr-3 grid size-11 shrink-0 place-items-center rounded-full text-icon-secondary"
              aria-label={t("list.mobile.more")}
            >
              <Icon name="more" size={20} />
            </button>
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem onSelect={onOpen}>{t("list.open")}</DropdownItem>
            <DropdownItem onSelect={onReview}>{t("list.mobile.review")}</DropdownItem>
            <DropdownItem destructive onSelect={onDelete}>
              {t("list.mobile.delete")}
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>

      <div className="mt-3 flex h-6 items-center gap-3">
        {pending ? (
          <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-2 text-caption-strong text-brand">
            <Icon name="quiz" size={14} />
            {t("list.reviewChip", { count: pending })}
          </span>
        ) : days !== null && days >= 0 ? (
          <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-accent-teal-bg px-2 text-caption-strong text-accent-teal-fg">
            <Icon name="schedule" size={14} />
            {t("list.daysLeft", { count: days })}
          </span>
        ) : null}
        <small className="ml-auto truncate text-body-xs text-ink-secondary">
          {t("list.submitted", { submitted, total })}
        </small>
      </div>

      <span className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
        <i className="block h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </span>
    </article>
  );
}
