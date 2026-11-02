import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { parentAttendance, type AttendanceEntry, type AttendanceStatus } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { MobilePageHeader, MobileSearchField } from "@/shared/ui/mobile-page";
import { AttendanceDetail } from "./attendance-detail";
import { AttendanceRowMobile } from "./attendance-mobile";
import { useAttendanceView } from "./use-attendance-view";

const ALL = new Set<AttendanceStatus>(["attended", "late", "missed", "upcoming"]);

export function AttendanceSearchPage() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const compact = useIsCompact();
  const view = useAttendanceView();
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<AttendanceEntry | null>(null);
  if (!compact) return <Navigate to={ROUTES.parent.attendance} replace />;

  const needle = query.trim();
  const results = needle ? parentAttendance.filterEntries(view.entries, { period: "all", courseId: null, statuses: ALL, query: needle }, view.now) : [];

  return (
    <div className="flex flex-col gap-4 px-4 pt-5 pb-10">
      <MobilePageHeader title={t("mobile.attendance.searchTitle")} backLabel={t("attendanceView.title")} onBack={() => navigate(ROUTES.parent.attendance)} />
      <MobileSearchField value={query} onChange={setQuery} placeholder={t("attendanceView.search")} clearLabel={t("attendanceView.clearSearch")} />
      {needle && !results.length ? (
        <div className="flex flex-col items-center gap-3 px-6 pt-20 text-center">
          <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
            <Icon name="search" size={30} />
          </span>
          <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("attendanceView.notFound.title")}</strong>
          <p className="text-body-sm text-ink-secondary">{t("attendanceView.notFound.text", { query: needle })}</p>
        </div>
      ) : null}
      {results.length ? (
        <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
          {results.map((entry) => (
            <AttendanceRowMobile key={entry.lesson.id} entry={entry} now={view.now} onOpen={setOpened} />
          ))}
        </ul>
      ) : null}
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
