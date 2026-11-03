import { useState } from "react";
import { useTranslation } from "react-i18next";
import { parentAttendance, type AttendanceEntry, type AttendancePeriod } from "@/modules/parent";
import { useOnlineStatus } from "@/shared/model";
import { formatLocalized } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { ParentErrorBanner, ParentLockedCard, ParentPageHeader } from "@/widgets/parent-shell";
import { ConnectChild } from "../dashboard/home-empty";
import { AttendanceCalendar, CalendarSide } from "./attendance-calendar";
import { AttendanceDetail } from "./attendance-detail";
import { AttendanceFilter, type AttendanceFilterValue } from "./attendance-filter";
import { AttendanceReport } from "./attendance-report";
import { DEFAULT_STATUSES } from "./attendance-styles";
import { AttendanceDonut, MiniCalendar } from "./attendance-summary";
import { AttendanceTable } from "./attendance-table";
import { useAttendanceView } from "./use-attendance-view";

const SEGMENTS: AttendancePeriod[] = ["week", "month", "all"];

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-[20px] bg-surface px-6 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
        <Icon name={icon} size={30} />
      </span>
      <strong className="font-heading text-[18px]/6 font-semibold text-ink">{title}</strong>
      <p className="max-w-[300px] text-body-sm text-ink-secondary">{text}</p>
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" aria-hidden="true">
      <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <span key={item} className="flex items-center gap-3">
            <span className="size-12 rounded-xl bg-skeleton" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3.5 w-1/3 rounded-full bg-skeleton" />
              <span className="h-3 w-1/5 rounded-full bg-skeleton" />
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-5">
        <div className="h-[200px] rounded-[20px] bg-surface" />
        <div className="h-[300px] rounded-[20px] bg-surface" />
      </div>
    </div>
  );
}

export function ParentAttendance() {
  const { t } = useTranslation("parent");
  const online = useOnlineStatus();
  const view = useAttendanceView();
  const [mode, setMode] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState<AttendanceFilterValue>({
    period: "month",
    courseId: null,
    statuses: new Set(DEFAULT_STATUSES),
  });
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<AttendanceEntry | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const today = new Date(view.now);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(() => parentAttendance.dayKey(view.now));

  const filtered = parentAttendance.filterEntries(view.entries, { ...filter, query }, view.now);
  const stats = parentAttendance.attendanceStats(filtered);
  const byDay = parentAttendance.entriesByDay(view.entries);
  const childName = view.child?.name ?? "";

  function shiftMonth(step: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));
  }

  const reportButton = (
    <button
      type="button"
      className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-40"
      disabled={!view.entries.length}
      onClick={() => setReportOpen(true)}
    >
      <Icon name="download" size={18} />
      {t("attendanceView.reportButton")}
    </button>
  );

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader
        eyebrow={childName ? `${t("attendanceView.eyebrow")} · ${childName}` : t("attendanceView.eyebrow")}
        title={t("attendanceView.title")}
      />

      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}

      {view.loading ? (
        <ListSkeleton />
      ) : !view.child ? (
        <ConnectChild />
      ) : view.locked ? (
        <ParentLockedCard childId={view.child.id} childName={view.child.name} />
      ) : mode === "calendar" ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle"
              aria-label={t("attendanceView.calendar.prev")}
              onClick={() => shiftMonth(-1)}
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <strong className="min-w-[160px] text-center font-heading text-[20px]/7 font-semibold text-ink">
              {formatLocalized(month, "LLLL yyyy")}
            </strong>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full bg-surface text-icon transition-colors hover:bg-subtle"
              aria-label={t("attendanceView.calendar.next")}
              onClick={() => shiftMonth(1)}
            >
              <Icon name="chevron-right" size={20} />
            </button>
            <span className="flex-1" />
            <ModeSwitch mode={mode} onMode={setMode} />
            {reportButton}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <AttendanceCalendar month={month} byDay={byDay} now={view.now} selected={selectedDay} onPick={setSelectedDay} />
            <CalendarSide
              month={month}
              entries={view.entries}
              dayEntries={selectedDay ? (byDay.get(selectedDay) ?? []) : []}
              dayKey={selectedDay}
              now={view.now}
              onOpen={setOpened}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center gap-3">
              <div role="tablist" className="flex shrink-0 items-center gap-1 rounded-full bg-surface p-1">
                {SEGMENTS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    role="tab"
                    aria-selected={filter.period === period}
                    className={`flex h-9 items-center rounded-full px-4 text-button transition-colors ${
                      filter.period === period ? "bg-brand text-on-action" : "text-ink hover:bg-subtle"
                    }`}
                    onClick={() => setFilter((current) => ({ ...current, period }))}
                  >
                    {t(`attendanceView.periods.${period}`)}
                  </button>
                ))}
              </div>
              <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-4">
                <Icon name="search" size={20} className="shrink-0 text-icon-secondary" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-tertiary"
                  value={query}
                  placeholder={t("attendanceView.search")}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query ? (
                  <button
                    type="button"
                    className="grid size-6 place-items-center rounded-full bg-subtle text-icon-secondary"
                    aria-label={t("attendanceView.clearSearch")}
                    onClick={() => setQuery("")}
                  >
                    <Icon name="close" size={14} />
                  </button>
                ) : null}
              </label>
              <AttendanceFilter value={filter} groups={view.groups} onApply={setFilter} />
              {reportButton}
            </div>

            {!view.entries.length ? (
              <Empty icon="event-repeat" title={t("attendanceView.empty.title")} text={t("attendanceView.empty.text")} />
            ) : !filtered.length ? (
              query.trim() ? (
                <Empty
                  icon="search"
                  title={t("attendanceView.notFound.title")}
                  text={t("attendanceView.notFound.text", { query: query.trim() })}
                />
              ) : (
                <Empty icon="filter-list" title={t("attendanceView.filtered.title")} text={t("attendanceView.filtered.text")} />
              )
            ) : (
              <AttendanceTable entries={filtered} teachers={view.teachers} now={view.now} onOpen={setOpened} />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <AttendanceDonut stats={stats} />
            {view.entries.length ? (
              <MiniCalendar
                month={month}
                byDay={byDay}
                now={view.now}
                selected={null}
                onMonth={shiftMonth}
                onPick={(date) => {
                  setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                  setSelectedDay(parentAttendance.dayKey(date));
                  setMode("calendar");
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      <AttendanceDetail
        entry={opened}
        teacher={opened ? (view.teachers.get(opened.lesson.courseId) ?? "") : ""}
        subject={opened ? (view.subjects.get(opened.lesson.courseId) ?? opened.lesson.courseTitle) : ""}
        now={view.now}
        onClose={() => setOpened(null)}
      />
      <AttendanceReport
        open={reportOpen}
        onOpenChange={setReportOpen}
        childName={childName}
        entries={view.entries}
        teachers={view.teachers}
        now={view.now}
      />
    </div>
  );
}

function ModeSwitch({ mode, onMode }: { mode: "list" | "calendar"; onMode: (mode: "list" | "calendar") => void }) {
  const { t } = useTranslation("parent");
  return (
    <div role="tablist" className="flex shrink-0 items-center gap-1 rounded-full bg-surface p-1">
      {(["list", "calendar"] as const).map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={mode === item}
          className={`flex h-9 items-center rounded-full px-5 text-button transition-colors ${
            mode === item ? "bg-brand text-on-action" : "text-ink hover:bg-subtle"
          }`}
          onClick={() => onMode(item)}
        >
          {t(`attendanceView.calendar.${item}`)}
        </button>
      ))}
    </div>
  );
}
