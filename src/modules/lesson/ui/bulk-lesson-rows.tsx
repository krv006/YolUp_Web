import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, DurationPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { MobilePickerField } from "@/shared/ui/mobile-fields";
import {
  findBulkOverlaps,
  isBulkRowInPast,
  MAX_BULK_LESSONS,
  nextBulkRow,
  type BulkLessonRow,
} from "../lib/bulk-lessons";
import { addMinutesToTime, findScheduleConflicts } from "../lib/lesson-schedule";

const DURATIONS = [45, 60, 90, 120] as const;

export interface BulkLessonRowsProps {
  rows: BulkLessonRow[];
  onChange: (rows: BulkLessonRow[]) => void;
  errors?: Readonly<Record<string, string>>;
  existingLessons?: readonly Lesson[];
  compact?: boolean;
}

function todayValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function BulkLessonRows({ rows, onChange, errors = {}, existingLessons = [], compact = false }: BulkLessonRowsProps) {
  const { t } = useTranslation("lesson");
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const overlapping = useMemo(() => findBulkOverlaps(rows), [rows]);
  const today = todayValue();

  function update(id: string, patch: Partial<BulkLessonRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function issueOf(row: BulkLessonRow): { text: string; danger: boolean } | null {
    if (errors[row.id]) return { text: errors[row.id], danger: true };
    if (isBulkRowInPast(row)) return { text: t("bulk.past"), danger: true };
    if (overlapping.has(row.id)) return { text: t("bulk.overlap"), danger: false };
    const busy = findScheduleConflicts(existingLessons, {
      date: row.date,
      time: row.time,
      durationMinutes: row.duration,
    })[0];
    return busy ? { text: t("bulk.busy", { title: busy.title }), danger: false } : null;
  }

  function dateLabel(value: string) {
    const date = new Date(`${value}T00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return `${weekdays[(date.getDay() + 6) % 7] ?? ""}, ${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const issue = issueOf(row);
          const number = index + 1;
          return (
            <li
              key={row.id}
              className={`flex flex-col gap-2.5 rounded-xl p-3 ${
                compact ? "bg-subtle" : "border border-line"
              } ${issue?.danger ? "ring-1 ring-danger/40" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-caption-strong text-brand ${
                    compact ? "bg-surface" : "bg-brand-subtle"
                  }`}
                >
                  {number}
                </span>
                <input
                  className={
                    compact
                      ? "h-12 min-w-0 flex-1 rounded-lg border-[1.5px] border-transparent bg-surface px-3.5 text-body text-ink outline-none transition-colors placeholder:text-ink-secondary focus:border-focus"
                      : "h-10 min-w-0 flex-1 rounded-md border border-transparent bg-subtle px-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
                  }
                  value={row.topic}
                  placeholder={t("bulk.topicPlaceholder")}
                  aria-label={t("bulk.topicAria", { number })}
                  onChange={(event) => update(row.id, { topic: event.target.value })}
                />
                {rows.length > 1 ? (
                  <button
                    type="button"
                    className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-danger-bg hover:text-danger"
                    aria-label={t("bulk.remove", { number })}
                    onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                ) : null}
              </div>

              {compact ? (
                <div className="grid grid-cols-2 gap-2">
                  <MobilePickerField
                    type="date"
                    surface
                    value={row.date}
                    min={today}
                    display={dateLabel(row.date)}
                    ariaLabel={t("bulk.dateAria", { number })}
                    onChange={(value) => update(row.id, { date: value })}
                  />
                  <MobilePickerField
                    type="time"
                    surface
                    value={row.time}
                    display={`${row.time}–${addMinutesToTime(row.time, row.duration)}`}
                    ariaLabel={t("bulk.timeAria", { number })}
                    duration={{
                      value: row.duration,
                      options: DURATIONS,
                      onChange: (value) => update(row.id, { duration: value }),
                    }}
                    onChange={(value) => update(row.id, { time: value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 items-start gap-2">
                  <DatePicker
                    label={t("bulk.date")}
                    value={row.date}
                    minDate={today}
                    onChange={(value) => update(row.id, { date: value })}
                  />
                  <TimePicker
                    label={t("bulk.time")}
                    value={row.time}
                    onChange={(value) => update(row.id, { time: value })}
                  />
                  <DurationPicker
                    label={t("bulk.duration")}
                    value={String(row.duration)}
                    options={DURATIONS}
                    onChange={(value) => update(row.id, { duration: Number(value) || row.duration })}
                  />
                </div>
              )}

              {issue ? (
                <small className={`flex items-center gap-1.5 text-body-xs ${issue.danger ? "text-danger" : "text-warning-fg"}`}>
                  <Icon name="warning" size={14} className="shrink-0" />
                  {issue.text}
                </small>
              ) : null}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className={`flex items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-button text-brand transition-colors hover:bg-brand-subtle disabled:opacity-50 ${
          compact ? "h-12" : "h-11"
        }`}
        disabled={rows.length >= MAX_BULK_LESSONS}
        onClick={() => {
          const last = rows[rows.length - 1];
          if (last) onChange([...rows, nextBulkRow(last)]);
        }}
      >
        <Icon name="add" size={18} />
        {t("bulk.addRow")}
      </button>
      <small className="text-center text-caption text-ink-tertiary">
        {t("bulk.limit", { count: rows.length, max: MAX_BULK_LESSONS })}
      </small>
    </div>
  );
}
