import { useMemo, useState } from "react";
import { CalendarCheck2, Download, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AttendanceAccordion, useAttendance } from "@/modules/attendance";
import { useSelectedChild } from "@/modules/parent";
import { formatDuration } from "@/shared/lib";
import { Button, LoadingFallback, RouteState } from "@/shared/ui/legacy";

export function ParentAttendanceLegacy() {
  const { t } = useTranslation("parent");
  const { selectedChildId, selectedChild } = useSelectedChild();
  const attendanceQuery = useAttendance(selectedChildId ? { student: selectedChildId } : {});
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const items = attendanceQuery.data ?? [];
    if (!needle) return items;
    return items.filter((item) => `${item.child} ${item.lesson}`.toLowerCase().includes(needle));
  }, [attendanceQuery.data, search]);

  const totalAway = useMemo(
    () => rows.reduce((sum, item) => sum + item.focus.awaySeconds, 0),
    [rows]
  );

  if (attendanceQuery.isLoading) return <LoadingFallback label={t("attendance.loading")} />;
  if (attendanceQuery.isError) {
    return (
      <RouteState
        title={t("attendance.loadError")}
        actionLabel={t("attendance.retry")}
        onAction={attendanceQuery.refetch}
      />
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{t("attendance.eyebrow")}</span>
          <h1>{t("attendance.title")}</h1>
          <p>
            {selectedChild
              ? t("attendance.subtitleWithChild", { name: selectedChild.name })
              : t("attendance.subtitleNoChild")}
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Download size={17} /> {t("attendance.report")}
        </Button>
      </div>

      <div className="attendance-toolbar">
        <label className="portal-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("attendance.searchPlaceholder")}
          />
        </label>
        <span>
          <CalendarCheck2 size={17} /> {t("attendance.recordsCount", { count: rows.length })}
          {totalAway ? t("attendance.awaySuffix", { duration: formatDuration(totalAway) }) : ""}
        </span>
      </div>

      <AttendanceAccordion rows={rows} />
    </div>
  );
}
