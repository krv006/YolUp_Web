import { useTranslation } from "react-i18next";
import { parentAttendance, type AttendanceEntry } from "@/modules/parent";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { stayLabel } from "./attendance-format";
import { subjectLook } from "./attendance-styles";

export function AttendanceDetail({
  entry,
  teacher,
  subject,
  now,
  onClose,
}: {
  entry: AttendanceEntry | null;
  teacher: string;
  subject: string;
  now: number;
  onClose: () => void;
}) {
  const { t } = useTranslation("parent");
  const look = subjectLook(subject);
  const row = entry?.row ?? null;
  const segments = entry ? parentAttendance.exitSegments(entry) : [];
  const when = entry ? formatLocalized(entry.lesson.startsAt, t("attendanceView.detail.datePattern")) : "";

  return (
    <AppDialog
      open={Boolean(entry)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant="panel"
      width="lg:w-115"
      icon={
        <span className={`grid size-12 place-items-center rounded-2xl ${look.tone}`}>
          <Icon name={look.icon} size={24} />
        </span>
      }
      title={entry?.lesson.courseTitle ?? ""}
      description={[when, teacher].filter(Boolean).join(" · ")}
      titleClassName="font-heading text-[20px]/7 font-semibold"
      footerClassName="justify-end px-5 pt-4 pb-5"
      footer={
        <button
          type="button"
          className="flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
          onClick={onClose}
        >
          {t("attendanceView.detail.close")}
        </button>
      }
    >
      {entry ? (
        row?.joinedAt ? (
          <div className="flex flex-col gap-4 pb-2">
            <section className="flex flex-col gap-3 rounded-2xl bg-subtle p-4">
              <div className="grid grid-cols-3 gap-2">
                <span className="flex flex-col">
                  <small className="text-caption text-ink-secondary">{t("attendanceView.detail.in")}</small>
                  <strong className="text-title text-ink">{formatMessageTime(row.joinedAt)}</strong>
                </span>
                <span className="flex flex-col items-center">
                  <small className="text-caption text-ink-secondary">{t("attendanceView.detail.duration")}</small>
                  <strong className="text-title text-ink">{stayLabel(entry, now, t)}</strong>
                </span>
                <span className="flex flex-col items-end">
                  <small className="text-caption text-ink-secondary">{t("attendanceView.detail.out")}</small>
                  <strong className="text-title text-ink">{row.leftAt ? formatMessageTime(row.leftAt) : "—"}</strong>
                </span>
              </div>
              <span className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
                {segments.map((segment) => (
                  <span
                    key={`${segment.from}-${segment.to}`}
                    className={`h-full rounded-full ${segment.away ? "bg-danger" : "bg-success"}`}
                    style={{ width: `${(segment.to - segment.from) * 100}%` }}
                  />
                ))}
              </span>
              <span className="flex flex-wrap gap-4 text-caption text-ink-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success" />
                  {t("attendanceView.detail.focused")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-danger" />
                  {t("attendanceView.detail.away")}
                </span>
              </span>
            </section>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "visibility", tone: "bg-accent-blue-bg text-accent-blue-fg", value: entry.focus === null ? "—" : `${entry.focus}%`, label: t("attendanceView.detail.focus") },
                { icon: "fact-check", tone: "bg-accent-green-bg text-accent-green-fg", value: row.attentionTotal ? `${row.attentionAnswered}/${row.attentionTotal}` : "—", label: t("attendanceView.detail.attention") },
                { icon: "warning", tone: "bg-accent-saffron-bg text-accent-saffron-fg", value: String(row.focus.exits), label: t("attendanceView.detail.exits") },
              ].map((card) => (
                <span key={card.label} className="flex flex-col gap-2 rounded-2xl border border-line p-3.5">
                  <span className={`grid size-8 place-items-center rounded-lg ${card.tone}`}>
                    <Icon name={card.icon} size={18} />
                  </span>
                  <strong className="font-heading text-[20px]/7 font-semibold text-ink">{card.value}</strong>
                  <small className="text-caption text-ink-secondary">{card.label}</small>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-3 rounded-2xl bg-subtle px-4 py-4 text-body-sm text-ink-secondary">
            <Icon name={entry.status === "upcoming" ? "schedule" : "cancel"} size={20} className="shrink-0" />
            {entry.status === "upcoming"
              ? t("attendanceView.detail.upcoming", { time: formatMessageTime(entry.lesson.startsAt) })
              : t("attendanceView.detail.notJoined")}
          </p>
        )
      ) : null}
    </AppDialog>
  );
}
