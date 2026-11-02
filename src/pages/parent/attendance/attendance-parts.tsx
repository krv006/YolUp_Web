import { useTranslation } from "react-i18next";
import type { AttendanceStatus } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { STATUS_TILE } from "./attendance-styles";

const CHIP: Record<AttendanceStatus, { tone: string; icon: string | null }> = {
  live: { tone: "bg-danger-bg text-error-text", icon: null },
  attended: { tone: "bg-success-bg text-success-text", icon: "check-circle" },
  late: { tone: "bg-warning-bg text-warning-text", icon: "schedule" },
  missed: { tone: "bg-danger-bg text-error-text", icon: "cancel" },
  upcoming: { tone: "bg-accent-teal-bg text-accent-teal-fg", icon: "schedule" },
};

export function StatusChip({ status, lateMinutes = 0 }: { status: AttendanceStatus; lateMinutes?: number }) {
  const { t } = useTranslation("parent");
  const chip = CHIP[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-caption-strong ${chip.tone}`}>
      {chip.icon ? <Icon name={chip.icon} size={14} /> : <span className="size-1.5 rounded-full bg-danger" />}
      {status === "late" ? t("attendanceView.status.late", { minutes: lateMinutes }) : t(`attendanceView.status.${status}`)}
    </span>
  );
}

export function DateTile({ value, status, size = "md" }: { value: string; status: AttendanceStatus; size?: "md" | "sm" }) {
  const date = new Date(value);
  return (
    <span
      className={`flex shrink-0 flex-col items-center justify-center rounded-xl ${STATUS_TILE[status]} ${
        size === "md" ? "size-12" : "size-11"
      }`}
    >
      <strong className="font-heading text-[18px]/5 font-semibold">{date.getDate()}</strong>
      <small className="text-[10px]/3 font-semibold uppercase">{formatLocalized(date, "LLL").replace(".", "")}</small>
    </span>
  );
}

export function FocusBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-body-sm text-ink-tertiary">—</span>;
  const tone = value >= 80 ? "bg-success" : value >= 60 ? "bg-saffron" : "bg-danger";
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-subtle">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </span>
      <small className="text-caption-strong text-ink">{value}%</small>
    </span>
  );
}
