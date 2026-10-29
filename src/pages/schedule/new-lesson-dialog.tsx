import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import {
  MOBILE_INPUT,
  MobileChoiceChips,
  MobileFieldLabel,
  MobilePickerField,
  MobileToggle,
} from "@/shared/ui/mobile-fields";

export interface NewLessonValues {
  courseId: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  repeatWeeks: number;
}

export interface NewLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: ReadonlyArray<{
    id: string;
    title: string;
    studentCount?: number;
    tone?: string;
    image?: string | null;
  }>;
  pending?: boolean;
  onSubmit: (values: NewLessonValues) => void;
}

const DURATIONS = [45, 60, 90, 120];
const MIN_WEEKS = 2;
const MAX_WEEKS = 52;

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function NewLessonDialog({
  open,
  onOpenChange,
  courses,
  pending = false,
  onSubmit,
}: NewLessonDialogProps) {
  const { t } = useTranslation("lesson");
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(90);
  const [weeks, setWeeks] = useState(8);
  const isCompact = useIsCompact();
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const months = t("list.months", { returnObjects: true }) as string[];
  const canSubmit = !pending && Boolean(courseId) && Boolean(topic.trim());

  function submit() {
    onSubmit({
      courseId,
      topic: topic.trim(),
      date,
      time,
      duration: String(duration),
      repeatWeeks: repeat ? weeks : 0,
    });
  }

  if (isCompact) {
    const picked = new Date(`${date}T00:00`);
    const dateLabel = Number.isNaN(picked.getTime())
      ? date
      : `${weekdays[(picked.getDay() + 6) % 7] ?? ""}, ${picked.getDate()}-${(months[picked.getMonth()] ?? "").toLowerCase()}`;

    return (
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        variant="adaptive"
        title={t("scheduleDialog.title")}
        description={t("scheduleDialog.mobileDescription")}
        footerClassName="px-4 pt-7 pb-8.5"
        footer={
          <div className="grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              className={`${dialogButton.secondary} h-13 border-line-strong text-title font-semibold`}
              onClick={() => onOpenChange(false)}
            >
              {t("schedule.cancel")}
            </button>
            <button
              type="button"
              className={`${dialogButton.primary} h-13 text-title font-semibold`}
              disabled={!canSubmit}
              onClick={submit}
            >
              {t("schedule.save")}
            </button>
          </div>
        }
      >
        <div className="-mt-0.5 flex flex-col gap-3">
          <MobileFieldLabel label={t("scheduleDialog.group")}>
            <div className="mt-0.5 grid grid-cols-2 gap-x-2 gap-y-3">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  aria-pressed={course.id === courseId}
                  className={`flex h-14 min-w-0 items-center gap-2.5 rounded-lg border-[1.5px] px-3 text-left transition-colors ${
                    course.id === courseId ? "border-brand bg-brand-subtle" : "border-transparent bg-subtle"
                  }`}
                  onClick={() => setCourseId(course.id)}
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
                      {t("schedule.students", { count: course.studentCount ?? 0 })}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </MobileFieldLabel>

          <MobileFieldLabel label={t("scheduleDialog.topic")}>
            <input
              className={MOBILE_INPUT}
              value={topic}
              placeholder={t("scheduleDialog.topicPlaceholder")}
              onChange={(event) => setTopic(event.target.value)}
            />
          </MobileFieldLabel>

          <div className="grid grid-cols-2 gap-3">
            <MobileFieldLabel label={t("scheduleDialog.date")}>
              <MobilePickerField
                type="date"
                value={date}
                min={today()}
                display={dateLabel}
                ariaLabel={t("scheduleDialog.date")}
                onChange={setDate}
              />
            </MobileFieldLabel>
            <MobileFieldLabel label={t("schedule.time")}>
              <MobilePickerField
                type="time"
                value={time}
                display={time}
                ariaLabel={t("schedule.time")}
                onChange={setTime}
              />
            </MobileFieldLabel>
          </div>

          <div className="flex items-center gap-3">
            <MobileToggle
              items={[
                { id: "once", label: t("schedule.repeatOnce") },
                { id: "weekly", label: t("schedule.repeatWeekly") },
              ]}
              value={repeat ? "weekly" : "once"}
              onChange={(value) => setRepeat(value === "weekly")}
            />
            <span
              className={`flex h-13 min-w-0 flex-1 items-center rounded-full bg-subtle px-1.5 transition-opacity ${
                repeat ? "" : "opacity-50"
              }`}
            >
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink disabled:opacity-50"
                disabled={!repeat || weeks <= MIN_WEEKS}
                aria-label={t("scheduleDialog.fewerWeeks")}
                onClick={() => setWeeks((value) => Math.max(MIN_WEEKS, value - 1))}
              >
                <Icon name="remove" size={20} />
              </button>
              <span className="min-w-0 flex-1 truncate text-center text-body-sm font-semibold text-ink">
                {t("scheduleDialog.weeksValue", { count: weeks })}
              </span>
              <button
                type="button"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-ink disabled:opacity-50"
                disabled={!repeat || weeks >= MAX_WEEKS}
                aria-label={t("scheduleDialog.moreWeeks")}
                onClick={() => setWeeks((value) => Math.min(MAX_WEEKS, value + 1))}
              >
                <Icon name="add" size={20} />
              </button>
            </span>
          </div>

          <MobileFieldLabel label={t("scheduleDialog.duration")}>
            <MobileChoiceChips items={DURATIONS} value={duration} onChange={setDuration} />
          </MobileFieldLabel>

        </div>
      </AppDialog>
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      title={t("scheduleDialog.title")}
      description={t("scheduleDialog.description")}
      footer={
        <button
          type="button"
          className={dialogButton.primary}
          disabled={!canSubmit}
          onClick={submit}
        >
          {t("scheduleDialog.submit")}
        </button>
      }
    >
      <div className="lesson-form flex flex-col gap-4.5">
        <SelectPicker
          label={t("scheduleDialog.group")}
          searchable
          value={courseId}
          onChange={setCourseId}
          options={courses.map((course) => ({ value: course.id, label: course.title }))}
        />

        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("scheduleDialog.topic")}</span>
          <input
            autoFocus
            className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
            value={topic}
            placeholder={t("scheduleDialog.topicPlaceholder")}
            onChange={(event) => setTopic(event.target.value)}
          />
        </label>

        <div className="flex w-fit items-center gap-1 rounded-full bg-subtle p-1">
          {[false, true].map((mode) => (
            <button
              key={String(mode)}
              type="button"
              className={`flex h-8 items-center rounded-full px-4 text-button transition-colors ${
                repeat === mode ? "bg-brand text-ink-inverse" : "text-ink-secondary hover:text-ink"
              }`}
              onClick={() => setRepeat(mode)}
            >
              {mode ? t("scheduleDialog.repeating") : t("scheduleDialog.single")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 items-start gap-3">
          <DatePicker label={t("scheduleDialog.date")} value={date} onChange={setDate} />
          <TimePicker label={t("scheduleDialog.start")} value={time} onChange={setTime} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("scheduleDialog.duration")}</span>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`flex h-10 items-center justify-center rounded-full text-button transition-colors ${
                  duration === value
                    ? "bg-brand text-ink-inverse"
                    : "text-ink-secondary hover:bg-subtle"
                }`}
                onClick={() => setDuration(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
