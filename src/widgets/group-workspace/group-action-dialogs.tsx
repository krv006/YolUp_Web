import { useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Bold,
  CalendarDays,
  FileQuestion,
  FileUp,
  GraduationCap,
  Hourglass,
  Italic,
  Link,
  List,
  Paperclip,
  Underline,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, DurationPicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { ModalCard, modalButton } from "@/shared/ui/modal-card";
import { Icon } from "@/shared/ui/icon";
import {
  buildScheduleDates,
  EVEN_WEEKDAYS,
  findScheduleConflicts,
  findScheduleConflictsForDates,
  MAX_SCHEDULE_LESSONS,
  ODD_WEEKDAYS,
  WEEKDAYS,
} from "@/modules/lesson";
import type { Assignment, Lesson } from "@/shared/types";

export interface LessonDraft { topic: string; date: string; time: string; duration: string; quizId: string }

export interface LessonScheduleDraft extends LessonDraft {
  dates: string[];
  weekdays: number[];
  startsOn: string;
  endsOn: string;
}

export interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: LessonDraft) => void;
  onCreateSchedule?: (values: LessonScheduleDraft) => void;
  existingLessons?: readonly Lesson[];
  initialValues?: Lesson | null;
  quizOptions?: ReadonlyArray<{ id: string; title: string }>;
  onDelete?: () => void;
}

interface AssignmentDraft { title: string; description: string; dueAt: string; skillKey: string; gradingNote: string; lessonId: string }

export interface AddAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: Omit<AssignmentDraft, "gradingNote"> & { body: string; extraInstructions: string; file: File | null }) => void;
  lessons?: readonly Lesson[];
  isLanguageSubject?: boolean;
  initialValues?: Assignment | null;
}

const DURATION_OPTIONS = [30, 45, 60, 90];

function useSkillOptions(): Array<{ value: string; label: string }> {
  const { t } = useTranslation("group");
  return [
    { value: "", label: t("dialogs.assignment.skillOptions.general") },
    { value: "writing", label: t("dialogs.assignment.skillOptions.writing") },
    { value: "reading", label: t("dialogs.assignment.skillOptions.reading") },
    { value: "listening", label: t("dialogs.assignment.skillOptions.listening") },
    { value: "speaking", label: t("dialogs.assignment.skillOptions.speaking") },
  ];
}

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
    format: (date: Date) => `${date.getDate()}-${months[date.getMonth()] ?? ""}`,
  };
}

export function AddLessonDialog({
  open,
  onOpenChange,
  onCreate,
  onCreateSchedule,
  existingLessons = [],
  initialValues = null,
  quizOptions = [],
  onDelete,
}: AddLessonDialogProps) {
  const { t } = useTranslation("group");
  const DATE_LABEL = useDateLabelFormatter();
  const weekdayText = useWeekdayTranslations();
  const [form, setForm] = useState<LessonDraft>(() => ({
    topic: initialValues?.topic ?? "",
    date: initialValues?.date ?? todayString(),
    time: initialValues?.time ?? "18:30",
    duration: String(initialValues?.durationMinutes ?? initialValues?.duration ?? "45"),
    quizId: initialValues?.quizId ?? "",
  }));
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([...ODD_WEEKDAYS]);
  const [range, setRange] = useState(() => ({ from: todayString(), to: monthLaterString() }));

  const canRepeat = Boolean(onCreateSchedule) && !initialValues;
  const isRepeating = canRepeat && repeat;
  const duration = Number(form.duration) || 45;
  const today = todayString();
  const editingPast = Boolean(initialValues) && form.date < today;
  const startsInPast =
    !isRepeating &&
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
    if (isRepeating || !form.date) return [];
    return findScheduleConflicts(existingLessons, {
      date: form.date,
      time: form.time,
      durationMinutes: duration,
      excludeLessonId: initialValues?.id ?? null,
    });
  }, [isRepeating, existingLessons, form.date, form.time, duration, initialValues]);

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
    setForm({ topic: "", date: todayString(), time: "18:30", duration: "45", quizId: "" });
    setRepeat(false);
    setWeekdays([...ODD_WEEKDAYS]);
    setRange({ from: todayString(), to: monthLaterString() });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.time || startsInPast) return;

    if (isRepeating) {
      if (!dates.length || invalidRange) return;
      onCreateSchedule?.({
        ...form,
        topic: "",
        dates,
        weekdays,
        startsOn: range.from,
        endsOn: range.to,
      });
    } else {
      if (!form.topic.trim()) return;
      onCreate({ ...form, date: form.date || todayString() });
    }
    reset();
    onOpenChange(false);
  }

  const sameDays = (a: readonly number[], b: readonly number[]) =>
    a.length === b.length && a.every((day, index) => day === b[index]);

  const timeBusy = singleConflicts.length > 0 || startsInPast;

  return (
    <ModalCard
      open={open}
      onOpenChange={onOpenChange}
      title={initialValues ? t("dialogs.lesson.editTitle") : t("dialogs.lesson.newTitle")}
      subtitle={isRepeating ? t("dialogs.lesson.repeatingSubtitle") : undefined}
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form="lesson-form"
            className={modalButton.primary}
            disabled={
              isRepeating ? !dates.length || invalidRange : !form.topic.trim() || startsInPast
            }
          >
            {initialValues
              ? t("dialogs.lesson.saveChanges")
              : isRepeating
                ? t("dialogs.lesson.saveMultiple", { count: dates.length })
                : t("dialogs.lesson.saveSingle")}
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
      <motion.form
        id="lesson-form"
        className="lesson-form flex flex-col gap-4.5"
        onSubmit={submit}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {canRepeat ? (
          <div
            className="flex w-fit items-center gap-1 rounded-full bg-subtle p-1"
            role="radiogroup"
            aria-label={t("dialogs.lesson.typeAria")}
          >
            {[false, true].map((mode) => (
              <button
                key={String(mode)}
                type="button"
                role="radio"
                aria-checked={repeat === mode}
                className={`flex h-8 items-center rounded-full px-4 text-button transition-colors ${
                  repeat === mode ? "bg-brand text-ink-inverse" : "text-ink-secondary hover:text-ink"
                }`}
                onClick={() => {
                  setRepeat(mode);
                  if (mode) update("topic", "");
                }}
              >
                {mode ? t("dialogs.lesson.repeating") : t("dialogs.lesson.single")}
              </button>
            ))}
          </div>
        ) : null}

        {isRepeating ? null : (
          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">
              {t("dialogs.lesson.topicLabel")}
            </span>
            <input
              autoFocus
              className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
              value={form.topic}
              onChange={(event) => update("topic", event.target.value)}
              placeholder={t("dialogs.lesson.topicPlaceholder")}
            />
          </label>
        )}

        {isRepeating ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-body-xs text-ink-secondary">
                  {t("dialogs.lesson.weekdaysLabel")}
                </span>
                <button
                  type="button"
                  className={`shrink-0 text-body-xs transition-colors ${
                    sameDays(weekdays, ODD_WEEKDAYS) ? "text-brand-strong" : "text-brand"
                  }`}
                  onClick={() => setWeekdays([...ODD_WEEKDAYS])}
                >
                  {t("dialogs.lesson.oddDays")}
                </button>
                <span className="shrink-0 text-body-xs text-ink-tertiary">·</span>
                <button
                  type="button"
                  className={`shrink-0 text-body-xs transition-colors ${
                    sameDays(weekdays, EVEN_WEEKDAYS) ? "text-brand-strong" : "text-brand"
                  }`}
                  onClick={() => setWeekdays([...EVEN_WEEKDAYS])}
                >
                  {t("dialogs.lesson.evenDays")}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-7.5">
                {WEEKDAYS.map((day) => {
                  const active = weekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={active}
                      aria-label={weekdayText.labels[day.value]}
                      className={`flex h-11 items-center justify-center rounded-md text-button transition-colors ${
                        active
                          ? "bg-brand text-ink-inverse"
                          : "bg-subtle text-ink-secondary hover:bg-muted"
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
                  setRange((current) => ({
                    from: value,
                    to: current.to && current.to < value ? value : current.to,
                  }))
                }
              />
              <DatePicker
                label={t("dialogs.lesson.endDate")}
                value={range.to}
                minDate={range.from || today}
                onChange={(value) => setRange((current) => ({ ...current, to: value }))}
              />
            </div>

            <div className="grid grid-cols-2 items-start gap-3">
              <TimePicker
                label={t("dialogs.lesson.startTime")}
                value={form.time}
                onChange={(value) => update("time", value)}
              />
              <DurationPicker
                label={t("dialogs.lesson.duration")}
                icon={Hourglass}
                value={form.duration}
                onChange={(value) => update("duration", value)}
                options={DURATION_OPTIONS}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 items-start gap-3">
              <DatePicker
                label={t("dialogs.lesson.dateLabel")}
                value={form.date}
                minDate={editingPast ? undefined : today}
                onChange={(value) => update("date", value)}
              />
              <div className={`flex flex-col gap-1.5 ${timeBusy ? "is-field-error" : ""}`}>
                <TimePicker
                  label={t("dialogs.lesson.startTime")}
                  value={form.time}
                  onChange={(value) => update("time", value)}
                />
                {timeBusy ? (
                  <small className="px-1 text-body-xs text-danger">
                    {t("dialogs.lesson.timeBusy")}
                  </small>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 items-start gap-3">
              <DurationPicker
                label={t("dialogs.lesson.duration")}
                icon={Hourglass}
                value={form.duration}
                onChange={(value) => update("duration", value)}
                options={DURATION_OPTIONS}
              />
              <SelectPicker
                label={t("dialogs.lesson.quizLabel")}
                icon={FileQuestion}
                value={form.quizId}
                onChange={(value) => update("quizId", value)}
                options={[
                  { value: "", label: t("dialogs.lesson.quizNone") },
                  ...quizOptions.map((quiz) => ({ value: quiz.id, label: quiz.title })),
                ]}
              />
            </div>
          </>
        )}

        {isRepeating ? (
          <p
            className={`flex w-fit items-center gap-2 rounded-md px-3.5 py-2.5 text-body-xs ${
              dates.length ? "bg-brand-subtle text-brand-strong" : "bg-warning-bg text-warning-fg"
            }`}
          >
            <Icon name={dates.length ? "bolt" : "warning"} size={16} />
            {dates.length
              ? t("dialogs.lesson.scheduleFirst", {
                  count: dates.length,
                  limitNote:
                    dates.length >= MAX_SCHEDULE_LESSONS ? t("dialogs.lesson.limitNote") : "",
                  first: DATE_LABEL.format(new Date(dates[0])).toLowerCase(),
                  weekday: weekdayText.labels[new Date(dates[0]).getDay() || 7],
                })
              : t("dialogs.lesson.noMatchingDays")}
          </p>
        ) : null}

        {startsInPast ? (
          <p className="text-body-xs text-danger" role="alert">
            {t("dialogs.lesson.pastTimeError", { time: nowTimeString() })}
          </p>
        ) : null}

        <ConflictNotice single={singleConflicts} schedule={scheduleConflicts} />
      </motion.form>
    </ModalCard>
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
    <div className="flex flex-col gap-1.5 rounded-md bg-warning-bg px-4 py-3.5" role="alert">
      <strong className="flex items-center gap-2 text-title-sm text-warning-fg">
        <Icon name="warning" size={16} className="text-warning" />
        {single.length
          ? t("dialogs.conflict.singleTitle")
          : t("dialogs.conflict.scheduleTitle", { count: schedule.length })}
      </strong>
      <p className="text-body-xs text-warning-fg">
        {lines.map((line) => (
          <span key={line.key}>{`${line.text}. `}</span>
        ))}
        {t("dialogs.conflict.note")}
      </p>
    </div>
  );
}

const EMPTY_ASSIGNMENT: AssignmentDraft = {
  title: "",
  description: "",
  dueAt: "",
  skillKey: "",
  gradingNote: "",
  lessonId: "",
};

export function AddAssignmentDialog({
  open,
  onOpenChange,
  onCreate,
  lessons = [],
  isLanguageSubject = false,
  initialValues = null,
}: AddAssignmentDialogProps) {
  const { t } = useTranslation("group");
  const skillOptions = useSkillOptions();
  const [form, setForm] = useState<AssignmentDraft>(() =>
    initialValues
      ? {
          title: initialValues.title,
          description: initialValues.description,
          dueAt: initialValues.dueAt ?? "",
          skillKey: initialValues.skillKey || "",
          gradingNote: "",
          lessonId: initialValues.lessonId ?? "",
        }
      : EMPTY_ASSIGNMENT
  );
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const lessonOptions = useMemo(() => {
    const finished = lessons
      .filter((lesson) => lesson.status === "finished")
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((lesson) => ({
        value: lesson.id,
        label: `${lesson.title} · ${lesson.date}`,
      }));
    return [{ value: "", label: t("dialogs.assignment.notLinkedToLesson") }, ...finished];
  }, [lessons, t]);

  function update(field: keyof AssignmentDraft, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    const { gradingNote, ...rest } = form;
    onCreate({
      ...rest,
      skillKey: isLanguageSubject ? rest.skillKey : "",
      body: rest.description,
      extraInstructions: gradingNote,
      file,
    });
    setForm(EMPTY_ASSIGNMENT);
    setFile(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent
          className="group-action-dialog assignment-dialog"
          title={initialValues ? t("dialogs.assignment.editTitle") : t("dialogs.assignment.newTitle")}
          description={t("dialogs.assignment.description")}
        >
          <motion.form
            className="group-action-form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label>
              <span>{t("dialogs.assignment.titleLabel")}</span>
              <input
                autoFocus
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder={t("dialogs.assignment.titlePlaceholder")}
              />
            </label>
            <div className="rich-assignment-field">
              <div
                className="rich-toolbar"
                aria-label={t("dialogs.assignment.toolbarAria")}
              >
                <button type="button" aria-label={t("dialogs.assignment.boldAria")}>
                  <Bold size={14} />
                </button>
                <button type="button" aria-label={t("dialogs.assignment.italicAria")}>
                  <Italic size={14} />
                </button>
                <button type="button" aria-label={t("dialogs.assignment.underlineAria")}>
                  <Underline size={14} />
                </button>
                <span />
                <button type="button" aria-label={t("dialogs.assignment.listAria")}>
                  <List size={14} />
                </button>
                <button type="button" aria-label={t("dialogs.assignment.linkAria")}>
                  <Link size={14} />
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder={t("dialogs.assignment.descriptionPlaceholder")}
                rows={5}
              />
            </div>
            <div className="assignment-upload-row">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                hidden
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <button type="button" onClick={() => fileRef.current?.click()}>
                <FileUp size={16} /> {initialValues?.hasAttachment ? t("dialogs.assignment.replaceFile") : t("dialogs.assignment.attachFile")}
              </button>
              {file ? (
                <span>
                  <Paperclip size={14} /> {file.name}
                </span>
              ) : initialValues?.hasAttachment ? (
                <span>
                  <Paperclip size={14} /> {t("dialogs.assignment.currentFilePrefix")} {initialValues.attachmentName || t("dialogs.assignment.fileAttachedFallback")}
                </span>
              ) : null}
            </div>
            <div className="form-grid-two">
              <DatePicker
                label={t("dialogs.assignment.dueLabel")}
                value={form.dueAt}
                onChange={(value) => update("dueAt", value)}
                includeTime
                optional
              />
              {isLanguageSubject ? (
                <SelectPicker
                  label={t("dialogs.assignment.checkTypeLabel")}
                  icon={GraduationCap}
                  value={form.skillKey}
                  onChange={(value) => update("skillKey", value)}
                  options={skillOptions}
                />
              ) : (
                <SelectPicker
                  label={t("dialogs.assignment.lessonLabel")}
                  icon={CalendarDays}
                  value={form.lessonId}
                  onChange={(value) => update("lessonId", value)}
                  options={lessonOptions}
                />
              )}
            </div>

            {isLanguageSubject ? (
              <SelectPicker
                label={t("dialogs.assignment.lessonLabel")}
                icon={CalendarDays}
                value={form.lessonId}
                onChange={(value) => update("lessonId", value)}
                options={lessonOptions}
              />
            ) : null}
            <label>
              <span>{t("dialogs.assignment.gradingLabel")}</span>
              <input
                value={form.gradingNote}
                onChange={(event) => update("gradingNote", event.target.value)}
                placeholder={t("dialogs.assignment.gradingPlaceholder")}
              />
            </label>
            <div className="dialog-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {t("dialogs.assignment.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!form.title.trim() || !form.description.trim()}
              >
                {initialValues ? t("dialogs.assignment.saveChanges") : t("dialogs.assignment.submit")}
              </Button>
            </div>
          </motion.form>
        </DialogContent>
      )}
    </Dialog>
  );
}
