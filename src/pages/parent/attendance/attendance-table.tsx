import { useTranslation } from "react-i18next";
import type { AttendanceEntry } from "@/modules/parent";
import { formatMessageTime } from "@/shared/lib";
import { stayLabel } from "./attendance-format";
import { DateTile, FocusBar, StatusChip } from "./attendance-parts";

const HEAD = "px-3 pb-3 text-left text-caption-strong tracking-wide text-ink-tertiary uppercase first:pl-5";

export function AttendanceTable({
  entries,
  teachers,
  now,
  onOpen,
}: {
  entries: AttendanceEntry[];
  teachers: Map<string, string>;
  now: number;
  onOpen: (entry: AttendanceEntry) => void;
}) {
  const { t } = useTranslation("parent");
  return (
    <section className="overflow-hidden rounded-[20px] bg-surface pt-5">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="w-[13%]" />
          <col className="w-[16%]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-line">
            <th className={HEAD}>{t("attendanceView.columns.lesson")}</th>
            <th className={HEAD}>{t("attendanceView.columns.in")}</th>
            <th className={HEAD}>{t("attendanceView.columns.out")}</th>
            <th className={HEAD}>{t("attendanceView.columns.duration")}</th>
            <th className={HEAD}>{t("attendanceView.columns.focus")}</th>
            <th className={HEAD}>{t("attendanceView.columns.status")}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const row = entry.row;
            return (
              <tr
                key={entry.lesson.id}
                tabIndex={0}
                className="cursor-pointer border-b border-line transition-colors last:border-b-0 hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
                onClick={() => onOpen(entry)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(entry);
                  }
                }}
              >
                <td className="py-3 pr-3 pl-5">
                  <span className="flex min-w-0 items-center gap-3">
                    <DateTile value={entry.lesson.startsAt} status={entry.status} />
                    <span className="flex min-w-0 flex-col">
                      <strong className="truncate text-title-sm text-ink">{entry.lesson.courseTitle}</strong>
                      <small className="truncate text-body-xs text-ink-secondary">{teachers.get(entry.lesson.courseId) ?? ""}</small>
                    </span>
                  </span>
                </td>
                <td className="px-3 text-body-sm text-ink">{row?.joinedAt ? formatMessageTime(row.joinedAt) : "—"}</td>
                <td className="px-3 text-body-sm text-ink">{row?.leftAt ? formatMessageTime(row.leftAt) : "—"}</td>
                <td className="px-3 text-body-sm text-ink">{stayLabel(entry, now, t)}</td>
                <td className="px-3">
                  <FocusBar value={entry.focus} />
                </td>
                <td className="px-3">
                  <StatusChip status={entry.status} lateMinutes={entry.lateMinutes} />
                  {row?.lateReason ? (
                    <small className="mt-1 block truncate text-caption text-ink-tertiary" title={row.lateReason}>
                      {row.lateReason}
                    </small>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
