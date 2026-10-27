import { useTranslation } from "react-i18next";
import type { ExamSummary } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import {
  MobileEmptyCard,
  MobileListSkeleton,
  MobilePageHeader,
  MobileSegment,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";

export interface MobileMockListProps {
  exams: ExamSummary[];
  loading: boolean;
  chips: Array<{ id: string; label: string }>;
  filter: string;
  sectionCount: (exam: ExamSummary) => number | null;
  summary: (exam: ExamSummary) => { submitted: number; total: number; average: number | null } | null;
  onFilterChange: (filter: string) => void;
  onBack: () => void;
  onCreate: () => void;
  onOpen: (exam: ExamSummary) => void;
  onDelete: (exam: ExamSummary) => void;
}

const CHIP: Record<string, { tone: string; icon: string }> = {
  running: { tone: "bg-danger-bg text-error-text", icon: "videocam-fill" },
  upcoming: { tone: "bg-accent-teal-bg text-accent-teal-fg", icon: "schedule" },
  finished: { tone: "bg-subtle text-ink-secondary", icon: "check-circle" },
};

const ACTION: Record<string, string> = {
  running: "bg-brand text-on-action hover:bg-brand-strong",
  upcoming: "border border-line-strong bg-surface text-ink hover:bg-subtle",
  finished: "bg-brand-subtle text-brand-strong hover:bg-tint",
};

export function MobileMockList(props: MobileMockListProps) {
  const { t } = useTranslation("exam");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];

  function duration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours ? t("mock.mobile.hours", { hours, minutes: rest }) : t("mock.minutes", { count: rest });
  }

  function subtitle(exam: ExamSummary): string {
    if (exam.state === "upcoming") {
      const date = new Date(exam.startsAt);
      const stamp = Number.isNaN(date.getTime())
        ? ""
        : `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      return [exam.courseTitle, stamp].filter(Boolean).join(" · ");
    }
    if (exam.state === "finished") {
      const stats = props.summary(exam);
      return [
        exam.courseTitle,
        stats ? `${stats.submitted}/${stats.total}` : null,
        stats?.average != null ? t("mock.mobile.average", { value: stats.average.toFixed(1) }) : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    const sections = props.sectionCount(exam);
    return [exam.courseTitle, sections ? t("mock.mobile.sections", { count: sections }) : null, duration(exam.totalMinutes)]
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-8 font-body text-ink [&>*]:shrink-0">
      <MobilePageHeader
        title={t("mock.title")}
        backLabel={t("mock.mobile.back")}
        onBack={props.onBack}
        action={
          <button type="button" className={mobileRoundButton} aria-label={t("mock.create")} onClick={props.onCreate}>
            <Icon name="add" size={24} />
          </button>
        }
      />

      <div className="mt-4.5">
        <MobileSegment scroll items={props.chips} value={props.filter} onChange={props.onFilterChange} />
      </div>

      {props.loading ? <MobileListSkeleton className="mt-3.5" /> : null}

      <div className="mt-5 flex flex-col gap-5">
        {props.exams.map((exam) => {
          const look = CHIP[exam.state] ?? CHIP.upcoming;
          return (
            <article key={exam.id} className="flex flex-col rounded-xl bg-surface p-4">
              <Dropdown>
                <DropdownTrigger asChild>
                  <button type="button" className="flex min-w-0 items-center gap-3 text-left">
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-violet-bg text-accent-violet-fg">
                      <Icon name="assignment-check-fill" size={20} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <strong className="truncate text-title text-ink">{exam.title}</strong>
                      <small className="truncate text-body-sm text-ink-secondary">{subtitle(exam)}</small>
                    </span>
                  </button>
                </DropdownTrigger>
                <DropdownContent align="start">
                  <DropdownItem onSelect={() => props.onOpen(exam)}>
                    {t(exam.state === "running" ? "mock.watch" : exam.state === "finished" ? "mock.results" : "mock.edit")}
                  </DropdownItem>
                  {exam.state === "running" ? null : (
                    <DropdownItem destructive onSelect={() => props.onDelete(exam)}>
                      {t("mock.delete")}
                    </DropdownItem>
                  )}
                </DropdownContent>
              </Dropdown>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className={`flex h-6 items-center gap-1.5 rounded-full px-2 text-caption-strong ${look.tone}`}>
                  <Icon name={look.icon} size={14} />
                  {t(`mock.state.${exam.state === "upcoming" ? "scheduled" : exam.state}`)}
                </span>
                <button
                  type="button"
                  className={`flex h-11 shrink-0 items-center rounded-full px-4 text-button-sm transition-colors ${
                    ACTION[exam.state] ?? ACTION.upcoming
                  }`}
                  onClick={() => props.onOpen(exam)}
                >
                  {t(exam.state === "running" ? "mock.watch" : exam.state === "finished" ? "mock.results" : "mock.edit")}
                </button>
              </div>
            </article>
          );
        })}

        {!props.loading && !props.exams.length ? (
          <MobileEmptyCard
            icon="assignment-check-fill"
            title={t("mock.empty")}
            action={{ label: t("mock.create"), icon: "add", onClick: props.onCreate }}
          />
        ) : null}
      </div>
    </main>
  );
}
