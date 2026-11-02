import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AttendancePeriod, AttendanceStatus } from "@/modules/parent";
import { Icon } from "@/shared/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { DEFAULT_STATUSES, STATUS_DOT } from "./attendance-styles";

export interface AttendanceFilterValue {
  period: AttendancePeriod;
  courseId: string | null;
  statuses: Set<AttendanceStatus>;
}

const PERIODS: AttendancePeriod[] = ["week", "month", "quarter"];
const STATUSES: AttendanceStatus[] = ["attended", "late", "missed", "upcoming"];

export function AttendanceFilter({
  value,
  groups,
  onApply,
}: {
  value: AttendanceFilterValue;
  groups: Array<{ id: string; title: string }>;
  onApply: (value: AttendanceFilterValue) => void;
}) {
  const { t } = useTranslation("parent");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const active = value.courseId !== null || value.statuses.size !== DEFAULT_STATUSES.length || value.statuses.has("upcoming");

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft({ ...value, statuses: new Set(value.statuses) });
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`relative flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-button transition-colors ${
            active ? "border-brand bg-brand-subtle text-brand" : "border-line-strong bg-surface text-ink hover:bg-subtle"
          }`}
        >
          <Icon name="filter-list" size={18} />
          {t("attendanceView.filter.title")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[340px] rounded-3xl border border-line bg-surface p-5 text-ink shadow-xl">
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("attendanceView.filter.period")}</small>
            <div className="grid grid-cols-3 gap-2">
              {PERIODS.map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`flex h-10 items-center justify-center rounded-full border text-body-sm font-medium transition-colors ${
                    draft.period === period ? "border-brand bg-brand text-on-action" : "border-line-strong text-ink hover:bg-subtle"
                  }`}
                  onClick={() => setDraft((current) => ({ ...current, period }))}
                >
                  {t(`attendanceView.filter.periods.${period}`)}
                </button>
              ))}
            </div>
          </section>

          <label className="flex flex-col gap-2">
            <small className="text-body-sm font-medium text-ink">{t("attendanceView.filter.group")}</small>
            <select
              className="h-12 w-full rounded-2xl border border-transparent bg-subtle px-4 text-body text-ink outline-none focus:border-focus"
              value={draft.courseId ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, courseId: event.target.value || null }))}
            >
              <option value="">{t("attendanceView.filter.allGroups")}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </label>

          <section className="flex flex-col gap-1">
            <small className="text-caption-strong tracking-wide text-ink-tertiary uppercase">{t("attendanceView.filter.status")}</small>
            {STATUSES.map((status) => {
              const checked = draft.statuses.has(status);
              return (
                <button
                  key={status}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  className="flex h-11 items-center gap-3 rounded-xl px-1 text-left text-body-sm text-ink transition-colors hover:bg-subtle"
                  onClick={() =>
                    setDraft((current) => {
                      const statuses = new Set(current.statuses);
                      if (statuses.has(status)) statuses.delete(status);
                      else statuses.add(status);
                      return { ...current, statuses };
                    })
                  }
                >
                  <span
                    className={`grid size-5 place-items-center rounded-md border-2 ${
                      checked ? "border-brand bg-brand text-on-action" : "border-line-strong"
                    }`}
                  >
                    {checked ? <Icon name="check" size={14} /> : null}
                  </span>
                  <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
                  {t(`attendanceView.legend.${status}`)}
                </button>
              );
            })}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-full text-button text-brand transition-colors hover:bg-brand-subtle"
              onClick={() => setDraft({ period: value.period, courseId: null, statuses: new Set(DEFAULT_STATUSES) })}
            >
              {t("attendanceView.filter.clear")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-full bg-brand text-button text-on-action transition-colors hover:bg-brand-strong"
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
            >
              {t("attendanceView.filter.apply")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
