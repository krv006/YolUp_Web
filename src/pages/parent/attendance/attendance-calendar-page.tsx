import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { parentAttendance, type AttendanceEntry } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { formatLocalized } from "@/shared/lib";
import { MobilePageHeader } from "@/shared/ui/mobile-page";
import { AttendanceDetail } from "./attendance-detail";
import { AttendanceRowMobile } from "./attendance-mobile";
import { STATUS_DOT } from "./attendance-styles";
import { MiniCalendar } from "./attendance-summary";
import { useAttendanceView } from "./use-attendance-view";

export function AttendanceCalendarPage() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const compact = useIsCompact();
  const view = useAttendanceView();
  const [month, setMonth] = useState(() => {
    const today = new Date(view.now);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => parentAttendance.dayKey(view.now));
  const [opened, setOpened] = useState<AttendanceEntry | null>(null);
  if (!compact) return <Navigate to={ROUTES.parent.attendance} replace />;

  const byDay = parentAttendance.entriesByDay(view.entries);
  const day = byDay.get(selected) ?? [];
  const [year, monthIndex, date] = selected.split("-").map(Number);

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader title={t("attendanceView.calendar.calendar")} backLabel={t("attendanceView.title")} onBack={() => navigate(ROUTES.parent.attendance)} />
      <div className="flex flex-col gap-3">
        <MiniCalendar
          month={month}
          byDay={byDay}
          now={view.now}
          selected={selected}
          onMonth={(step) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))}
          onPick={(value) => setSelected(parentAttendance.dayKey(value))}
        />
        <span className="flex flex-wrap justify-center gap-4">
          {(["attended", "late", "missed", "upcoming"] as const).map((status) => (
            <span key={status} className="flex items-center gap-1.5 text-caption text-ink-secondary">
              <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
              {t(`attendanceView.legend.${status}`)}
            </span>
          ))}
        </span>
      </div>
      <h2 className="px-1 font-heading text-[18px]/6 font-semibold text-ink">
        {formatLocalized(new Date(year, monthIndex, date), t("attendanceView.detail.datePattern"))}
      </h2>
      {day.length ? (
        <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
          {day.map((entry) => (
            <AttendanceRowMobile key={entry.lesson.id} entry={entry} now={view.now} onOpen={setOpened} />
          ))}
        </ul>
      ) : (
        <p className="rounded-[20px] bg-surface px-4 py-8 text-center text-body-sm text-ink-tertiary">{t("attendanceView.calendar.noLessons")}</p>
      )}
      <AttendanceDetail
        entry={opened}
        teacher={opened ? (view.teachers.get(opened.lesson.courseId) ?? "") : ""}
        subject={opened ? (view.subjects.get(opened.lesson.courseId) ?? opened.lesson.courseTitle) : ""}
        now={view.now}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}
