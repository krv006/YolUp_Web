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
  Repeat,
  TriangleAlert,
  Underline,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, DurationPicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
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

interface AssignmentDraft { title: string; description: string; dueAt: string; skillKey: string; grading: string; lessonId: string }

export interface AddAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: AssignmentDraft & { body: string; extraInstructions: string; file: File | null }) => void;
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

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="fullscreen"
      width="lg:w-[610px]"
      title={initialValues ? t("dialogs.lesson.editTitle") : t("dialogs.lesson.newTitle")}
      description={
        initialValues ? t("dialogs.lesson.editDescription") : t("dialogs.lesson.description")
      }
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("dialogs.lesson.cancel")}
          </button>
          <button
            type="submit"
            form="lesson-form"
            className={dialogButton.primary}
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
        </>
      }
    >
          <motion.form
            id="lesson-form"
            className="group-action-form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isRepeating ? null : (
              <label>
                <span>{t("dialogs.lesson.topicLabel")}</span>
                <input
                  autoFocus
                  value={form.topic}
                  onChange={(event) => update("topic", event.target.value)}
                  placeholder={t("dialogs.lesson.topicPlaceholder")}
                />
              </label>
            )}

            {canRepeat ? (
              <div className="schedule-mode" role="radiogroup" aria-label={t("dialogs.lesson.typeAria")}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!repeat}
                  className={repeat ? "" : "is-active"}
                  onClick={() => setRepeat(false)}
                >
                  <CalendarDays size={15} /> {t("dialogs.lesson.single")}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={repeat}
                  className={repeat ? "is-active" : ""}
                  onClick={() => {
                    setRepeat(true);
                    update("topic", "");
                  }}
                >
                  <Repeat size={15} /> {t("dialogs.lesson.repeating")}
                </button>
              </div>
            ) : null}

            {isRepeating ? (
              <>
                <p className="schedule-topic-note">{t("dialogs.lesson.repeatingTopicNote")}</p>
                <div className="field-block">
                  <span className="field-block-label">{t("dialogs.lesson.weekdaysLabel")}</span>
                  <div className="weekday-presets">
                    <button
                      type="button"
                      className={sameDays(weekdays, ODD_WEEKDAYS) ? "is-active" : ""}
                      onClick={() => setWeekdays([...ODD_WEEKDAYS])}
                    >
                      {t("dialogs.lesson.oddDays")}
                    </button>
                    <button
                      type="button"
                      className={sameDays(weekdays, EVEN_WEEKDAYS) ? "is-active" : ""}
                      onClick={() => setWeekdays([...EVEN_WEEKDAYS])}
                    >
                      {t("dialogs.lesson.evenDays")}
                    </button>
                  </div>
                  <div className="weekday-picker">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        aria-pressed={weekdays.includes(day.value)}
                        aria-label={weekdayText.labels[day.value]}
                        className={weekdays.includes(day.value) ? "is-active" : ""}
                        onClick={() => toggleWeekday(day.value)}
                      >
                        {weekdayText.short[day.value]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-grid-two">
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
              </>
            ) : (
              <div className="form-grid-two">
                <DatePicker
                  label={t("dialogs.lesson.dateLabel")}
                  value={form.date}
                  minDate={editingPast ? undefined : today}
                  onChange={(value) => update("date", value)}
                />
                <TimePicker
                  label={t("dialogs.lesson.startTime")}
                  value={form.time}
                  onChange={(value) => update("time", value)}
                />
              </div>
            )}

            {isRepeating ? (
              <div className="form-grid-two">
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
            ) : (
              <DurationPicker
                label={t("dialogs.lesson.duration")}
                icon={Hourglass}
                value={form.duration}
                onChange={(value) => update("duration", value)}
                options={DURATION_OPTIONS}
              />
            )}

            {!isRepeating && quizOptions.length ? (
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
            ) : null}

            {isRepeating ? (
              <p className={`schedule-summary ${dates.length ? "" : "is-empty"}`}>
                {dates.length ? (
                  t("dialogs.lesson.scheduleSummary", {
                    count: dates.length,
                    limitNote: dates.length >= MAX_SCHEDULE_LESSONS ? t("dialogs.lesson.limitNote") : "",
                    first: DATE_LABEL.format(new Date(dates[0])),
                    last: DATE_LABEL.format(new Date(dates[dates.length - 1])),
                  })
                ) : (
                  t("dialogs.lesson.noMatchingDays")
                )}
              </p>
            ) : null}

            {startsInPast ? (
              <p className="schedule-past-warning" role="alert">
                {t("dialogs.lesson.pastTimeError", { time: nowTimeString() })}
              </p>
            ) : null}

            <ConflictNotice single={singleConflicts} schedule={scheduleConflicts} />

            {initialValues && onDelete ? (
              <button
                type="button"
                className="mx-auto flex h-11 items-center gap-2 rounded-full px-4 text-label-strong text-error-text transition-colors hover:bg-error-bg"
                onClick={() => {
                  onOpenChange(false);
                  onDelete();
                }}
              >
                <Icon name="trash" size={17} /> {t("dialogs.lesson.deleteLesson")}
              </button>
            ) : null}
          </motion.form>
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

  return (
    <div className="schedule-conflict" role="alert">
      <TriangleAlert size={16} />
      <div>
        {single.length ? (
          <>
            <strong>{t("dialogs.conflict.singleTitle")}</strong>
            <ul>
              {single.map((lesson) => (
                <li key={lesson.id}>
                  {t("dialogs.conflict.lessonLine", {
                    course: lesson.courseTitle,
                    title: lesson.title,
                    time: lesson.time,
                    duration: lesson.durationMinutes,
                  })}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <strong>{t("dialogs.conflict.scheduleTitle", { count: schedule.length })}</strong>
            <ul>
              {schedule.slice(0, 4).map(({ date, conflicts }) => (
                <li key={date}>
                  {t("dialogs.conflict.scheduleLine", {
                    date: DATE_LABEL.format(new Date(date)),
                    course: conflicts[0].courseTitle,
                    time: conflicts[0].time,
                  })}
                </li>
              ))}
              {schedule.length > 4 ? (
                <li>{t("dialogs.conflict.andMore", { count: schedule.length - 4 })}</li>
              ) : null}
            </ul>
          </>
        )}
        <small>{t("dialogs.conflict.note")}</small>
      </div>
    </div>
  );
}

const EMPTY_ASSIGNMENT: AssignmentDraft = {
  title: "",
  description: "",
  dueAt: "",
  skillKey: "",
  grading: "",
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
          grading: "",
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
    onCreate({
      ...form,
      skillKey: isLanguageSubject ? form.skillKey : "",
      body: form.description,
      extraInstructions: form.grading,
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
                value={form.grading}
                onChange={(event) => update("grading", event.target.value)}
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
