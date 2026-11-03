import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { parentAttendance, type AttendanceEntry, type AttendancePeriod, type AttendanceStatus } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileChoiceChips } from "@/shared/ui/mobile-fields";
import { MobileEmptyCard, MobileSegment, MobileTitleHeader, mobileButton, mobileRoundButton } from "@/shared/ui/mobile-page";
import { ParentErrorBanner, ParentLockedCard } from "@/widgets/parent-shell";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { lessonEnd } from "../dashboard/home-format";
import { AttendanceDetail } from "./attendance-detail";
import { stayLabel } from "./attendance-format";
import { DateTile, StatusChip } from "./attendance-parts";
import { AttendanceReport } from "./attendance-report";
import { DEFAULT_STATUSES } from "./attendance-styles";
import { AttendanceDonut } from "./attendance-summary";
import { useAttendanceView } from "./use-attendance-view";

type StatusFilter = "all" | "attended" | "late" | "missed";

export function AttendanceRowMobile({ entry, now, onOpen }: { entry: AttendanceEntry; now: number; onOpen: (entry: AttendanceEntry) => void }) {
  const { t } = useTranslation("parent");
  const row = entry.row;
  const meta =
    entry.status === "live" && row?.joinedAt
      ? t("mobile.attendance.since", { time: formatMessageTime(row.joinedAt), duration: stayLabel(entry, now, t) })
      : row?.joinedAt
        ? `${formatMessageTime(row.joinedAt)} → ${row.leftAt ? formatMessageTime(row.leftAt) : "…"} · ${stayLabel(entry, now, t)}`
        : `${formatMessageTime(entry.lesson.startsAt)} – ${formatMessageTime(lessonEnd(entry.lesson))}${entry.status === "missed" ? ` · ${t("mobile.attendance.absent")}` : ""}`;
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={() => onOpen(entry)}>
        <DateTile value={entry.lesson.startsAt} status={entry.status} />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-title-sm text-ink">{entry.lesson.courseTitle}</strong>
          <small className="truncate text-body-xs text-ink-secondary">{meta}</small>
        </span>
        <StatusChip status={entry.status} lateMinutes={entry.lateMinutes} />
      </button>
    </li>
  );
}

export function AttendanceMobile() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const view = useAttendanceView();
  const [period, setPeriod] = useState<AttendancePeriod>("month");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [draft, setDraft] = useState({ period, courseId, status });
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [opened, setOpened] = useState<AttendanceEntry | null>(null);

  const statuses = new Set<AttendanceStatus>(status === "all" ? DEFAULT_STATUSES : [status]);
  const filtered = parentAttendance.filterEntries(view.entries, { period, courseId, statuses, query: "" }, view.now);
  const stats = parentAttendance.attendanceStats(filtered);
  const filtersOn = courseId !== null || status !== "all";

  return (
    <div className="flex flex-col gap-4 px-4 pt-5">
      <MobileTitleHeader
        eyebrow={t("attendanceView.eyebrow")}
        title={t("attendanceView.title")}
        action={
          <span className="flex shrink-0 gap-2">
            {view.locked ? null : (
              <button type="button" className={`${mobileRoundButton} bg-surface`} aria-label={t("attendanceView.search")} onClick={() => navigate(ROUTES.parent.attendanceSearch)}>
                <Icon name="search" size={22} />
              </button>
            )}
            {view.entries.length ? (
              <>
                <button
                  type="button"
                  className={`${mobileRoundButton} ${filtersOn ? "bg-brand-subtle text-brand" : "bg-surface"}`}
                  aria-label={t("attendanceView.filter.title")}
                  onClick={() => {
                    setDraft({ period, courseId, status });
                    setFilterOpen(true);
                  }}
                >
                  <Icon name="tune" size={22} />
                </button>
                <button type="button" className={`${mobileRoundButton} bg-surface`} aria-label={t("attendanceView.reportButton")} onClick={() => setReportOpen(true)}>
                  <Icon name="download" size={22} />
                </button>
              </>
            ) : null}
          </span>
        }
      />
      {view.locked ? null : (
        <MobileSegment
          items={(["week", "month", "all"] as const).map((id) => ({ id, label: t(`attendanceView.periods.${id}`) }))}
          value={period === "quarter" ? "all" : period}
          onChange={setPeriod}
        />
      )}
      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}

      {view.loading ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          <span className="h-[150px] animate-pulse rounded-[20px] bg-surface" />
          <span className="h-[280px] animate-pulse rounded-[20px] bg-surface" />
        </div>
      ) : !view.child ? (
        <MobileConnect />
      ) : view.locked ? (
        <ParentLockedCard childId={view.child.id} childName={view.child.name} />
      ) : !view.entries.length ? (
        view.failed ? (
          <MobileEmptyCard
            icon="warning"
            title={t("mobile.attendance.failedTitle")}
            description={t("mobile.attendance.failedText")}
            action={{ label: t("mobile.attendance.reload"), icon: "refresh", onClick: view.retry }}
          />
        ) : (
          <MobileEmptyCard icon="event-repeat" title={t("attendanceView.empty.title")} description={t("attendanceView.empty.text")} />
        )
      ) : (
        <>
          <AttendanceDonut stats={stats} />
          <div className="flex items-center justify-between px-1">
            <strong className="font-heading text-[18px]/6 font-semibold text-ink">{formatLocalized(view.now, "LLLL, yyyy")}</strong>
            <button type="button" className="text-body-sm font-medium text-brand" onClick={() => navigate(ROUTES.parent.attendanceCalendar)}>
              {t("attendanceView.calendar.calendar")}
            </button>
          </div>
          {filtered.length ? (
            <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
              {filtered.map((entry) => (
                <AttendanceRowMobile key={entry.lesson.id} entry={entry} now={view.now} onOpen={setOpened} />
              ))}
            </ul>
          ) : (
            <MobileEmptyCard icon="filter-list" title={t("attendanceView.filtered.title")} description={t("attendanceView.filtered.text")} />
          )}
        </>
      )}

      <AppDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        variant="sheet"
        title={t("attendanceView.filter.title")}
        description={t("mobile.attendance.filterHint")}
        footer={
          <>
            <button type="button" className={mobileButton.secondary} onClick={() => setDraft({ period: "month", courseId: null, status: "all" })}>
              {t("attendanceView.filter.clear")}
            </button>
            <button
              type="button"
              className={mobileButton.primary}
              onClick={() => {
                setPeriod(draft.period);
                setCourseId(draft.courseId);
                setStatus(draft.status);
                setFilterOpen(false);
              }}
            >
              {t("attendanceView.filter.apply")}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <section className="flex flex-col gap-2">
            <small className="text-body-sm font-medium text-ink">{t("attendanceView.filter.period")}</small>
            <MobileChoiceChips
              items={["week", "month", "quarter"] as const}
              value={draft.period === "all" ? "quarter" : draft.period}
              render={(id) => t(`attendanceView.filter.periods.${id}`)}
              onChange={(value) => setDraft((current) => ({ ...current, period: value }))}
            />
          </section>
          <label className="flex flex-col gap-2">
            <small className="text-body-sm font-medium text-ink">{t("attendanceView.filter.group")}</small>
            <select
              className="h-13 w-full rounded-2xl border border-transparent bg-subtle px-4 text-body text-ink outline-none focus:border-focus"
              value={draft.courseId ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, courseId: event.target.value || null }))}
            >
              <option value="">{t("attendanceView.filter.allGroups")}</option>
              {view.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </label>
          <section className="flex flex-col gap-2">
            <small className="text-body-sm font-medium text-ink">{t("attendanceView.filter.status")}</small>
            <div className="grid grid-cols-2 gap-2">
              {(["all", "attended", "late", "missed"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={draft.status === id}
                  className={`flex h-11 items-center justify-center rounded-full text-body-sm font-medium ${
                    draft.status === id ? "bg-brand text-on-action" : "border border-line-strong bg-surface text-ink"
                  }`}
                  onClick={() => setDraft((current) => ({ ...current, status: id }))}
                >
                  {id === "all" ? t("attendanceView.periods.all") : t(`attendanceView.legend.${id}`)}
                </button>
              ))}
            </div>
          </section>
        </div>
      </AppDialog>

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
        childName={view.child?.name ?? ""}
        entries={view.entries}
        teachers={view.teachers}
        now={view.now}
      />
    </div>
  );
}
