import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { downloadFile, parentAttendance, parentFamily, printTable, type AttendanceEntry } from "@/modules/parent";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";
import { stayLabel } from "./attendance-format";

type Format = "pdf" | "excel";

const FORMATS: Array<{ id: Format; icon: string; tone: string }> = [
  { id: "pdf", icon: "description", tone: "bg-danger-bg text-error-text" },
  { id: "excel", icon: "grid-view", tone: "bg-accent-green-bg text-accent-green-fg" },
];

export function AttendanceReport({
  open,
  onOpenChange,
  childName,
  entries,
  teachers,
  now,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  entries: AttendanceEntry[];
  teachers: Map<string, string>;
  now: number;
}) {
  const { t } = useTranslation("parent");
  const months = parentAttendance.monthsWithLessons(entries, now);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("pdf");
  const [withFocus, setWithFocus] = useState(true);
  const compact = useIsCompact();
  const selected = months.find((item) => `${item.year}-${item.month}` === monthKey) ?? months[0] ?? null;

  function monthLabel(year: number, month: number): string {
    return formatLocalized(new Date(year, month, 1), "LLLL yyyy");
  }

  function generate() {
    if (!selected) return;
    const rows = entries
      .filter((entry) => entry.status !== "upcoming" && parentAttendance.inMonth(entry, selected.year, selected.month))
      .sort((a, b) => a.lesson.startsAt.localeCompare(b.lesson.startsAt));
    const stats = parentAttendance.attendanceStats(rows);
    const columns = [
      t("attendanceView.report.columns.date"),
      t("attendanceView.columns.lesson"),
      t("attendanceView.report.columns.teacher"),
      t("attendanceView.columns.in"),
      t("attendanceView.columns.out"),
      t("attendanceView.columns.duration"),
      ...(withFocus ? [t("attendanceView.columns.focus")] : []),
      t("attendanceView.columns.status"),
    ];
    const table = rows.map((entry) => [
      formatLocalized(entry.lesson.startsAt, t("attendanceView.report.datePattern")),
      entry.lesson.courseTitle,
      teachers.get(entry.lesson.courseId) ?? "",
      entry.row?.joinedAt ? formatMessageTime(entry.row.joinedAt) : "—",
      entry.row?.leftAt ? formatMessageTime(entry.row.leftAt) : "—",
      stayLabel(entry, now, t),
      ...(withFocus ? [entry.focus === null ? "—" : `${entry.focus}%`] : []),
      entry.status === "late"
        ? t("attendanceView.status.late", { minutes: entry.lateMinutes })
        : t(`attendanceView.status.${entry.status}`),
    ]);
    const month = formatLocalized(new Date(selected.year, selected.month, 1), "LLLL").toLowerCase();
    const base = `${t("attendanceView.report.filePrefix")}_${parentFamily.latinize(childName.split(" ")[0] ?? "")}_${parentFamily.latinize(month)}`;
    const label = monthLabel(selected.year, selected.month);

    if (format === "excel") {
      const file = `${base}.csv`;
      downloadFile(file, parentAttendance.toCsv([columns, ...table]), "text/csv;charset=utf-8");
      toast.success(t("attendanceView.report.done", { file }));
    } else {
      printTable({
        documentTitle: base,
        heading: t("attendanceView.report.heading", { name: childName }),
        subtitle: label,
        summary: [
          { label: t("attendanceView.calendar.lessons"), value: String(stats.attended + stats.late + stats.missed) },
          { label: t("attendanceView.legend.attended"), value: String(stats.attended) },
          { label: t("attendanceView.legend.late"), value: String(stats.late) },
          { label: t("attendanceView.legend.missed"), value: String(stats.missed) },
          { label: t("attendanceView.summary.label"), value: stats.percent === null ? "—" : `${stats.percent}%` },
        ],
        columns,
        rows: table,
      });
    }
    onOpenChange(false);
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="sheet"
      width="lg:w-140"
      icon={
        compact ? undefined : (
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-subtle text-brand">
            <Icon name="download" size={24} />
          </span>
        )
      }
      title={t("attendanceView.report.title")}
      description={t("attendanceView.report.subtitle", { name: childName })}
      titleClassName="font-heading text-[20px]/7 font-semibold"
      footerClassName={compact ? "px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]" : "justify-end px-6 pt-5 pb-6"}
      footer={
        <>
          {compact ? null : <button
            type="button"
            className="flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={() => onOpenChange(false)}
          >
            {t("attendanceView.report.cancel")}
          </button>}
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-full bg-brand px-5 text-on-action transition-colors hover:bg-brand-strong disabled:opacity-40 ${compact ? "h-13 flex-1 text-title-sm font-semibold" : "h-11 text-button"}`}
            disabled={!selected}
            onClick={generate}
          >
            <Icon name="download" size={18} />
            {t("attendanceView.report.download")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4 px-1">
        <label className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-ink">{t("attendanceView.report.period")}</span>
          <select
            className="h-13 w-full rounded-2xl border border-transparent bg-subtle px-4 text-body text-ink outline-none focus:border-focus"
            value={selected ? `${selected.year}-${selected.month}` : ""}
            onChange={(event) => setMonthKey(event.target.value)}
          >
            {months.map((item) => (
              <option key={`${item.year}-${item.month}`} value={`${item.year}-${item.month}`}>
                {t("attendanceView.report.periodOption", { month: monthLabel(item.year, item.month), count: item.count })}
              </option>
            ))}
          </select>
        </label>

        <div role="radiogroup" className="grid grid-cols-2 gap-3">
          {FORMATS.map((item) => {
            const active = format === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                  active ? "border-brand bg-brand-subtle" : "border-transparent bg-subtle hover:bg-muted"
                }`}
                onClick={() => setFormat(item.id)}
              >
                <span className="flex w-full items-center justify-between">
                  <span className={`grid size-10 place-items-center rounded-xl ${item.tone}`}>
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span
                    className={`grid size-5 place-items-center rounded-full border-2 ${active ? "border-brand" : "border-line-strong"}`}
                  >
                    {active ? <span className="size-2.5 rounded-full bg-brand" /> : null}
                  </span>
                </span>
                <span className="flex flex-col gap-0.5">
                  <strong className="text-title-sm text-ink">{t(`attendanceView.report.${item.id}`)}</strong>
                  <small className="text-body-xs text-ink-secondary">{t(`attendanceView.report.${item.id}Text`)}</small>
                </span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-4 border-t border-line pt-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-blue-bg text-accent-blue-fg">
            <Icon name="visibility" size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="text-title-sm text-ink">{t("attendanceView.report.focus")}</strong>
            <small className="text-body-xs text-ink-secondary">{t("attendanceView.report.focusText")}</small>
          </span>
          <Switch
            size="lg"
            checked={withFocus}
            className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-line-strong"
            onCheckedChange={setWithFocus}
          />
        </label>
      </div>
    </AppDialog>
  );
}
