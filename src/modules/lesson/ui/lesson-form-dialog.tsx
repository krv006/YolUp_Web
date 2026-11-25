import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Lesson } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { ModalCard, modalButton } from "@/shared/ui/modal-card";
import {
  MOBILE_INPUT,
  MobileChoiceChips,
  MobileFieldLabel,
  MobilePickerField,
  MobileToggle,
} from "@/shared/ui/mobile-fields";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { bulkRowErrors, bulkRowsReady, createBulkRow, nextBulkRow, type BulkLessonRow } from "../lib/bulk-lessons";
import {
  buildScheduleDates,
  EVEN_WEEKDAYS,
  findScheduleConflicts,
  findScheduleConflictsForDates,
  MAX_SCHEDULE_LESSONS,
  ODD_WEEKDAYS,
  WEEKDAYS,
} from "../lib/lesson-schedule";
import { BulkLessonRows } from "./bulk-lesson-rows";

export interface LessonDraft { topic: string; date: string; time: string; duration: string; quizId: string }

export interface LessonScheduleDraft extends LessonDraft {
  courseId: string;
  dates: string[];
  weekdays: number[];
  startsOn: string;
  endsOn: string;
}

type LessonDialogMode = "single" | "repeat" | "bulk";

export interface LessonFormCourse {
  id: string;
  title: string;
  studentCount?: number;
  tone?: string;
  image?: string | null;
}

export interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses?: readonly LessonFormCourse[];
  courseId?: string;
  onCreate: (values: LessonDraft & { courseId: string }) => void;
  onCreateSchedule?: (values: LessonScheduleDraft) => void;
  onCreateBulk?: (rows: BulkLessonRow[], courseId: string) => Promise<unknown>;
  existingLessons?: readonly Lesson[];
  initialValues?: Lesson | null;
  onDelete?: () => void;
}

const MOBILE_DURATIONS = [45, 60, 90, 120] as const;

function useWeekdayTranslations(): { labels: Record<number, string>; short: Record<number, string> } {
  const { t } = useTranslation("group");
  const labels = t("dialogs.lesson.weekdayLabels", { returnObjects: true }) as string[];
  const short = t("dialogs.lesson.weekdayShort", { returnObjects: true }) as string[];
  return {
    labels: Object.fromEntries(WEEKDAYS.map((day, index) => [day.value, labels[index]])),
    short: Object.fromEntries(WEEKDAYS.map((day, index) => [day.value, short[index]])),
  };
}

function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function todayString(): string {
  return toDateValue(new Date());
}

function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function monthLaterString(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return toDateValue(date);
}

function useDateLabelFormatter(): { format: (date: Date) => string } {
  const { t } = useTranslation("lesson");
  const months = t("list.months", { returnObjects: true }) as string[];
  return {
    format: (date: Date) => `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`,
  };
}

export function LessonFormDialog({
  open,
  onOpenChange,
  courses,
  courseId: fixedCourseId = "",
  onCreate,
  onCreateSchedule,
  onCreateBulk,
  existingLessons = [],
  initialValues = null,
  onDelete,
}: LessonFormDialogProps) {
  const { t } = useTranslation("group");
  const { t: tl } = useTranslation("lesson");
  const [pickedCourse, setPickedCourse] = useState(initialValues?.courseId ?? "");
  const courseId = fixedCourseId || pickedCourse;
  const needsCourse = !fixedCourseId && Boolean(courses?.length);
  const DATE_LABEL = useDateLabelFormatter();
  const weekdayText = useWeekdayTranslations();
  const isCompact = useIsCompact();
  const [form, setForm] = useState<LessonDraft>(() => ({
    topic: initialValues?.topic ?? "",
    date: initialValues?.date ?? todayString(),
    time: initialValues?.time ?? "18:30",
    duration: String(initialValues?.durationMinutes ?? initialValues?.duration ?? "90"),
    quizId: initialValues?.quizId ?? "",
  }));
  const [mode, setMode] = useState<LessonDialogMode>("single");
  const [weekdays, setWeekdays] = useState<number[]>([...ODD_WEEKDAYS]);
  const [range, setRange] = useState(() => ({ from: todayString(), to: monthLaterString() }));
  const [rows, setRows] = useState<BulkLessonRow[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savingBulk, setSavingBulk] = useState(false);

  const canRepeat = Boolean(onCreateSchedule) && !initialValues;
  const canBulk = Boolean(onCreateBulk) && !initialValues;
  const isRepeating = canRepeat && mode === "repeat";
  const isBulk = canBulk && mode === "bulk";
  const singleMode = !isRepeating && !isBulk;
  const modes: Array<{ id: LessonDialogMode; label: string }> = [
    { id: "single", label: t("dialogs.lesson.single") },
    ...(canRepeat ? [{ id: "repeat" as const, label: t("dialogs.lesson.repeating") }] : []),
    ...(canBulk ? [{ id: "bulk" as const, label: t("dialogs.lesson.bulk") }] : []),
  ];
  const shortModes = modes.map((item) => ({ ...item, label: t(`dialogs.lesson.short.${item.id}`) }));
  const duration = Number(form.duration) || 90;
  const durationPicker = {
    value: duration,
    options: MOBILE_DURATIONS,
    onChange: (value: number) => update("duration", String(value)),
  };
  const today = todayString();
  const editingPast = Boolean(initialValues) && form.date < today;
  const startsInPast =
    singleMode &&
    !editingPast &&
    Boolean(form.date) &&
    (form.date < today || (form.date === today && form.time < nowTimeString()));
  const invalidRange = isRepeating && Boolean(range.to) && range.to < range.from;

  const dates = useMemo(
    () =>
      isRepeating
        ? buildScheduleDates({ startsOn: range.from, endsOn: range.to, weekdays })
        : [],
    [isRepeating, range.from, range.to, weekdays]
  );

  const singleConflicts = useMemo(() => {
    if (!singleMode || !form.date) return [];
    return findScheduleConflicts(existingLessons, {
      date: form.date,
      time: form.time,
      durationMinutes: duration,
      excludeLessonId: initialValues?.id ?? null,
    });
  }, [singleMode, existingLessons, form.date, form.time, duration, initialValues]);

  const scheduleConflicts = useMemo(
    () => (isRepeating ? findScheduleConflictsForDates(existingLessons, dates, form.time, duration) : []),
    [isRepeating, existingLessons, dates, form.time, duration]
  );

  function update(field: keyof LessonDraft, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleWeekday(value: number) {
    setWeekdays((current) =>
      current.includes(value) ? current.filter((day) => day !== value) : [...current, value].sort()
    );
  }

  function reset() {
    setForm({ topic: "", date: todayString(), time: "18:30", duration: "90", quizId: "" });
    setPickedCourse("");
    setMode("single");
    setWeekdays([...ODD_WEEKDAYS]);
    setRange({ from: todayString(), to: monthLaterString() });
    setRows([]);
    setRowErrors({});
  }

  function changeMode(next: LessonDialogMode) {
    if (next === "repeat") update("topic", "");
    if (next === "bulk" && !rows.length) {
      const first = createBulkRow({ topic: form.topic.trim(), date: form.date, time: form.time, duration });
      setRows([first, nextBulkRow(first)]);
    }
    setMode(next);
  }

  function changeRows(next: BulkLessonRow[]) {
    setRows(next);
    setRowErrors({});
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId) return;
    if (isBulk) {
      if (!bulkRowsReady(rows) || savingBulk) return;
      setSavingBulk(true);
      setRowErrors({});
      onCreateBulk?.(rows, courseId)
        .then(
          () => {
            reset();
            onOpenChange(false);
          },
          (error: unknown) => setRowErrors(bulkRowErrors(error, rows))
        )
        .finally(() => setSavingBulk(false));
      return;
    }
    if (!form.time || startsInPast) return;

    if (isRepeating) {
      if (!dates.length || invalidRange) return;
      onCreateSchedule?.({
        ...form,
        courseId,
        topic: "",
        dates,
        weekdays,
        startsOn: range.from,
        endsOn: range.to,
      });
    } else {
      if (!form.topic.trim()) return;
      onCreate({ ...form, courseId, date: form.date || todayString() });
    }
    reset();
    onOpenChange(false);
  }

  const sameDays = (a: readonly number[], b: readonly number[]) =>
    a.length === b.length && a.every((day, index) => day === b[index]);

  const timeBusy = singleConflicts.length > 0 || startsInPast;

  const dateDisplay = (value: string) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    const label = DATE_LABEL.format(date);
    if (value === today) return t("dialogs.lesson.todayDate", { date: label });
    return `${weekdayText.short[date.getDay() || 7]}, ${label}`;
  };
  const submitDisabled = !courseId || (isBulk
    ? !bulkRowsReady(rows) || savingBulk
    : isRepeating
      ? !dates.length || invalidRange || scheduleConflicts.length > 0
      : !form.topic.trim() || startsInPast || singleConflicts.length > 0);
  const submitLabel = initialValues
    ? t("dialogs.lesson.saveChanges")
    : isBulk
      ? t("dialogs.lesson.saveMultiple", { count: rows.length })
      : isRepeating
        ? t("dialogs.lesson.saveMultiple", { count: dates.length })
        : t("dialogs.lesson.saveSingle");

  if (isCompact)
    return (
      <ModalCard
        open={open}
        onOpenChange={onOpenChange}
        title={initialValues ? t("dialogs.lesson.editTitle") : t("dialogs.lesson.newTitle")}
        subtitle={
          initialValues
            ? t("dialogs.lesson.editDescription")
            : timeBusy
              ? undefined
              : isBulk
                ? t("dialogs.lesson.bulkSubtitle")
                : isRepeating
                  ? t("dialogs.lesson.repeatingSubtitle")
                  : t("dialogs.lesson.mobileSubtitle")
        }
        footer={
          <div className="flex flex-col gap-4">
            <button type="submit" form="lesson-form" className={modalButton.primary} disabled={submitDisabled}>
              {submitLabel}
            </button>
            {initialValues && onDelete ? (
              <button
                type="button"
                className="flex h-6 items-center gap-2 self-start pl-4 text-body font-medium text-error-text"
                onClick={() => {
                  onOpenChange(false);
                  onDelete();
                }}
              >
                <Icon name="trash" size={20} /> {t("dialogs.lesson.deleteLesson")}
              </button>
            ) : null}
          </div>
        }
      >
        <form id="lesson-form" className="flex flex-col gap-4" onSubmit={submit}>
          {needsCourse ? (
            <MobileFieldLabel label={tl("scheduleDialog.group")}>
              <div className="mt-0.5 grid grid-cols-2 gap-x-2 gap-y-3">
                {courses?.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    aria-pressed={course.id === courseId}
                    className={`flex h-14 min-w-0 items-center gap-2.5 rounded-lg border-[1.5px] px-3 text-left transition-colors ${
                      course.id === courseId ? "border-brand bg-brand-subtle" : "border-transparent bg-subtle"
                    }`}
                    onClick={() => setPickedCourse(course.id)}
                  >
                    <GroupTile
                      name={course.title}
                      tone={course.tone}
                      src={course.image}
                      className="size-8 rounded-md bg-surface text-caption-strong"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-body-sm font-semibold text-ink">{course.title}</strong>
                      <small className="truncate text-caption text-ink-secondary">
                        {tl("schedule.students", { count: course.studentCount ?? 0 })}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </MobileFieldLabel>
          ) : null}
          {singleMode ? (
            <MobileFieldLabel label={t("dialogs.lesson.topicLabel")}>
              <input
                className={MOBILE_INPUT}
                value={form.topic}
                onChange={(event) => update("topic", event.target.value)}
                placeholder={t("dialogs.lesson.topicPlaceholder")}
              />
            </MobileFieldLabel>
          ) : null}

          {modes.length > 1 && !timeBusy ? (
            <MobileToggle
              items={modes.length > 2 ? shortModes : modes}
              value={isBulk ? "bulk" : isRepeating ? "repeat" : "single"}
              onChange={changeMode}
            />
          ) : null}

          {isBulk ? (
            <BulkLessonRows
              compact
              rows={rows}
              errors={rowErrors}
              existingLessons={existingLessons}
              onChange={changeRows}
            />
          ) : isRepeating ? (
            <>
              <MobileFieldLabel
                label={t("dialogs.lesson.weekdaysLabel")}
                aside={
                  <span className="shrink-0 text-body-sm text-brand-strong">
                    <button type="button" onClick={() => setWeekdays([...ODD_WEEKDAYS])}>
                      {t("dialogs.lesson.oddDays")}
                    </button>
                    {" · "}
                    <button type="button" onClick={() => setWeekdays([...EVEN_WEEKDAYS])}>
                      {t("dialogs.lesson.evenDays")}
                    </button>
                  </span>
                }
              >
                <div className="flex justify-between">
                  {WEEKDAYS.map((day) => {
                    const active = weekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        aria-pressed={active}
                        aria-label={weekdayText.labels[day.value]}
                        className={`grid size-11 place-items-center rounded-full text-body-sm font-medium transition-colors ${
                          active ? "bg-brand text-on-action" : "bg-subtle text-ink"
                        }`}
                        onClick={() => toggleWeekday(day.value)}
                      >
                        {weekdayText.short[day.value]}
                      </button>
                    );
                  })}
                </div>
              </MobileFieldLabel>

              <div className="grid grid-cols-2 gap-3">
                <MobileFieldLabel label={t("dialogs.lesson.startDate")}>
                  <MobilePickerField
                    type="date"
                    value={range.from}
                    min={today}
                    display={DATE_LABEL.format(new Date(`${range.from}T00:00:00`))}
                    ariaLabel={t("dialogs.lesson.startDate")}
                    onChange={(value) =>
                      setRange((current) => ({
                        from: value,
                        to: current.to && current.to < value ? value : current.to,
                      }))
                    }
                  />
                </MobileFieldLabel>
                <MobileFieldLabel label={t("dialogs.lesson.endDate")}>
                  <MobilePickerField
                    type="date"
                    value={range.to}
                    min={range.from || today}
                    display={DATE_LABEL.format(new Date(`${range.to}T00:00:00`))}
                    ariaLabel={t("dialogs.lesson.endDate")}
                    onChange={(value) => setRange((current) => ({ ...current, to: value }))}
                  />
                </MobileFieldLabel>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MobileFieldLabel label={t("dialogs.lesson.timeShort")}>
                  <MobilePickerField
                    type="time"
                    value={form.time}
                    display={form.time}
                    ariaLabel={t("dialogs.lesson.startTime")}
                    duration={durationPicker}
                    onChange={(value) => update("time", value)}
                  />
                </MobileFieldLabel>
                <MobileFieldLabel label={t("dialogs.lesson.duration")}>
                  <MobilePickerField
                    type="select"
                    value={String(duration)}
                    display={t("dialogs.lesson.minutesValue", { count: duration })}
                    options={MOBILE_DURATIONS.map((value) => ({
                      value: String(value),
                      label: t("dialogs.lesson.minutesValue", { count: value }),
                    }))}
                    ariaLabel={t("dialogs.lesson.duration")}
                    onChange={(value) => update("duration", value)}
                  />
                </MobileFieldLabel>
              </div>

              <p
                className={`flex min-h-15 items-center gap-3 rounded-xl px-4 py-2.5 text-body-sm ${
                  dates.length ? "bg-brand-subtle text-brand" : "bg-warning-bg text-warning-fg"
                }`}
              >
                <Icon name={dates.length ? "bolt" : "warning"} size={20} className="shrink-0" />
                {dates.length
                  ? t("dialogs.lesson.scheduleFirst", {
                      count: dates.length,
                      limitNote: dates.length >= MAX_SCHEDULE_LESSONS ? t("dialogs.lesson.limitNote") : "",
                      first: DATE_LABEL.format(new Date(dates[0])).toLowerCase(),
                      weekday: weekdayText.labels[new Date(dates[0]).getDay() || 7],
                    })
                  : t("dialogs.lesson.noMatchingDays")}
              </p>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <MobileFieldLabel label={t("dialogs.lesson.dateLabel")}>
                  <MobilePickerField
                    type="date"
                    value={form.date}
                    min={editingPast ? undefined : today}
                    display={dateDisplay(form.date)}
                    ariaLabel={t("dialogs.lesson.dateLabel")}
                    onChange={(value) => update("date", value)}
                  />
                </MobileFieldLabel>
                <div className="flex flex-col gap-1.5">
                  <MobileFieldLabel label={t("dialogs.lesson.startShort")}>
                    <MobilePickerField
                      type="time"
                      value={form.time}
                      display={form.time}
                      invalid={timeBusy}
                      ariaLabel={t("dialogs.lesson.startTime")}
                      duration={durationPicker}
                      onChange={(value) => update("time", value)}
                    />
                  </MobileFieldLabel>
                  {timeBusy ? (
                    <small className="text-caption text-error-text">{t("dialogs.lesson.timeBusy")}</small>
                  ) : null}
                </div>
              </div>

              {timeBusy ? null : (
                <MobileFieldLabel label={t("dialogs.lesson.durationMinutes")}>
                  <MobileChoiceChips
                    items={MOBILE_DURATIONS}
                    value={duration}
                    onChange={(value) => update("duration", String(value))}
                  />
                </MobileFieldLabel>
              )}
            </>
          )}

          {startsInPast && !singleConflicts.length ? (
            <p className="text-body-sm text-error-text" role="alert">
              {t("dialogs.lesson.pastTimeError", { time: nowTimeString() })}
            </p>
          ) : null}

          <ConflictNotice single={singleConflicts} schedule={scheduleConflicts} />
        </form>
      </ModalCard>
    );

  const activeMode = isBulk ? "bulk" : isRepeating ? "repeat" : "single";
  const durationChips = (
    <div className="flex flex-col gap-2">
      <span className="text-body-xs text-ink-secondary">{tl("scheduleDialog.duration")}</span>
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={tl("scheduleDialog.duration")}>
        {MOBILE_DURATIONS.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={duration === value}
            className={`flex h-10 items-center justify-center rounded-full text-button transition-colors ${
              duration === value ? "bg-brand text-ink-inverse" : "text-ink-secondary hover:bg-subtle"
            }`}
            onClick={() => update("duration", String(value))}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width={isBulk ? "lg:w-160" : undefined}
      title={initialValues ? t("dialogs.lesson.editTitle") : tl("scheduleDialog.title")}
      description={
        isBulk
          ? t("dialogs.lesson.bulkSubtitle")
          : isRepeating
            ? t("dialogs.lesson.repeatingSubtitle")
            : tl("scheduleDialog.description")
      }
      footer={
        <div className="flex w-full flex-col gap-2">
          <button type="submit" form="lesson-form" className={`${dialogButton.primary} w-full flex-none`} disabled={submitDisabled}>
            {submitLabel}
          </button>
          {initialValues && onDelete ? (
            <button
              type="button"
              className="mx-auto flex h-10 items-center gap-2 rounded-full px-4 text-button text-danger transition-colors hover:bg-danger-bg"
              onClick={() => {
                onOpenChange(false);
                onDelete();
              }}
            >
              <Icon name="trash" size={17} /> {t("dialogs.lesson.deleteLesson")}
            </button>
          ) : null}
        </div>
      }
    >
      <form id="lesson-form" className="lesson-form flex flex-col gap-4.5" onSubmit={submit}>
        {needsCourse ? (
          <SelectPicker
            label={tl("scheduleDialog.group")}
            searchable
            value={courseId}
            onChange={setPickedCourse}
            options={(courses ?? []).map((course) => ({ value: course.id, label: course.title }))}
          />
        ) : null}

        {modes.length > 1 ? (
          <div className="flex w-fit items-center gap-1 rounded-full bg-subtle p-1" role="radiogroup" aria-label={t("dialogs.lesson.typeAria")}>
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={activeMode === item.id}
                className={`flex h-8 items-center rounded-full px-4 text-button transition-colors ${
                  activeMode === item.id ? "bg-brand text-ink-inverse" : "text-ink-secondary hover:text-ink"
                }`}
                onClick={() => changeMode(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {singleMode ? (
          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{tl("scheduleDialog.topic")}</span>
            <input
              autoFocus={!needsCourse}
              className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
              value={form.topic}
              onChange={(event) => update("topic", event.target.value)}
              placeholder={tl("scheduleDialog.topicPlaceholder")}
            />
          </label>
        ) : null}

        {isBulk ? (
          <BulkLessonRows rows={rows} errors={rowErrors} existingLessons={existingLessons} onChange={changeRows} />
        ) : isRepeating ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-body-xs text-ink-secondary">{t("dialogs.lesson.weekdaysLabel")}</span>
                <button
                  type="button"
                  className={`shrink-0 text-body-xs transition-colors ${sameDays(weekdays, ODD_WEEKDAYS) ? "text-brand-strong" : "text-brand"}`}
                  onClick={() => setWeekdays([...ODD_WEEKDAYS])}
                >
                  {t("dialogs.lesson.oddDays")}
                </button>
                <span className="shrink-0 text-body-xs text-ink-tertiary">·</span>
                <button
                  type="button"
                  className={`shrink-0 text-body-xs transition-colors ${sameDays(weekdays, EVEN_WEEKDAYS) ? "text-brand-strong" : "text-brand"}`}
                  onClick={() => setWeekdays([...EVEN_WEEKDAYS])}
                >
                  {t("dialogs.lesson.evenDays")}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((day) => {
                  const active = weekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={active}
                      aria-label={weekdayText.labels[day.value]}
                      className={`flex h-11 items-center justify-center rounded-md text-button transition-colors ${
                        active ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary hover:bg-muted"
                      }`}
                      onClick={() => toggleWeekday(day.value)}
                    >
                      {weekdayText.short[day.value]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-3">
              <DatePicker
                label={t("dialogs.lesson.startDate")}
                value={range.from}
                minDate={today}
                onChange={(value) =>
                  setRange((current) => ({ from: value, to: current.to && current.to < value ? value : current.to }))
                }
              />
              <DatePicker
                label={t("dialogs.lesson.endDate")}
                value={range.to}
                minDate={range.from || today}
                onChange={(value) => setRange((current) => ({ ...current, to: value }))}
              />
            </div>

            <TimePicker label={tl("scheduleDialog.start")} value={form.time} onChange={(value) => update("time", value)} />
            {durationChips}

            <p
              className={`flex w-fit items-center gap-2 rounded-md px-3.5 py-2.5 text-body-xs ${
                dates.length ? "bg-brand-subtle text-brand-strong" : "bg-warning-bg text-warning-fg"
              }`}
            >
              <Icon name={dates.length ? "bolt" : "warning"} size={16} />
              {dates.length
                ? t("dialogs.lesson.scheduleFirst", {
                    count: dates.length,
                    limitNote: dates.length >= MAX_SCHEDULE_LESSONS ? t("dialogs.lesson.limitNote") : "",
                    first: DATE_LABEL.format(new Date(dates[0])).toLowerCase(),
                    weekday: weekdayText.labels[new Date(dates[0]).getDay() || 7],
                  })
                : t("dialogs.lesson.noMatchingDays")}
            </p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 items-start gap-3">
              <DatePicker
                label={tl("scheduleDialog.date")}
                value={form.date}
                minDate={editingPast ? undefined : today}
                onChange={(value) => update("date", value)}
              />
              <div className={`flex flex-col gap-1.5 ${timeBusy ? "is-field-error" : ""}`}>
                <TimePicker label={tl("scheduleDialog.start")} value={form.time} onChange={(value) => update("time", value)} />
                {timeBusy ? <small className="px-1 text-body-xs text-danger">{t("dialogs.lesson.timeBusy")}</small> : null}
              </div>
            </div>
            {durationChips}
          </>
        )}

        {startsInPast ? (
          <p className="text-body-xs text-danger" role="alert">
            {t("dialogs.lesson.pastTimeError", { time: nowTimeString() })}
          </p>
        ) : null}

        <ConflictNotice single={singleConflicts} schedule={scheduleConflicts} />
      </form>
    </AppDialog>
  );
}

function ConflictNotice({
  single,
  schedule,
}: {
  single: Lesson[];
  schedule: Array<{ date: string; conflicts: Lesson[] }>;
}) {
  const { t } = useTranslation("group");
  const DATE_LABEL = useDateLabelFormatter();
  if (!single.length && !schedule.length) return null;

  const lines = single.length
    ? single.map((lesson) => ({
        key: lesson.id,
        text: t("dialogs.conflict.lessonLine", {
          course: lesson.courseTitle,
          title: lesson.title,
          time: lesson.time,
          duration: lesson.durationMinutes,
        }),
      }))
    : [
        ...schedule.slice(0, 4).map(({ date, conflicts }) => ({
          key: date,
          text: t("dialogs.conflict.scheduleLine", {
            date: DATE_LABEL.format(new Date(date)),
            course: conflicts[0].courseTitle,
            time: conflicts[0].time,
          }),
        })),
        ...(schedule.length > 4
          ? [{ key: "more", text: t("dialogs.conflict.andMore", { count: schedule.length - 4 }) }]
          : []),
      ];

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-warning-bg px-4 py-3.5 lg:rounded-md" role="alert">
      <strong className="flex items-center gap-2 text-title-sm text-warning-fg">
        <Icon name="warning" size={18} className="text-warning" />
        {single.length
          ? t("dialogs.conflict.singleTitle")
          : t("dialogs.conflict.scheduleTitle", { count: schedule.length })}
      </strong>
      <p className="text-body-sm text-warning-fg lg:text-body-xs">
        {lines.map((line) => (
          <span key={line.key}>{`${line.text}. `}</span>
        ))}
        {t("dialogs.conflict.note")}
      </p>
    </div>
  );
}
