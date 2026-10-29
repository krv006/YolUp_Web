import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import {
  MOBILE_INPUT_SURFACE,
  MobileChoiceChips,
  MobileFieldLabel,
  MobilePickerField,
} from "@/shared/ui/mobile-fields";
import { Switch } from "@/shared/ui/switch";
import type { AssignmentFormInput } from "@/modules/homework";
import type { GradingScale } from "@/shared/types";

export interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: ReadonlyArray<{ id: string; title: string; studentCount: number }>;
  pending?: boolean;
  initial?: {
    courseId: string;
    title: string;
    body: string;
    dueAt: string | null;
    grading: GradingScale;
    announceInChat: boolean;
    aiCheck?: boolean;
  } | null;
  onSubmit: (values: AssignmentFormInput) => void;
}

const GRADINGS: GradingScale[] = ["five", "hundred", "none"];

const FORMAT_BUTTONS = [
  { id: "bold", icon: "format-bold" },
  { id: "italic", icon: "format-italic" },
  { id: "underline", icon: "format-underlined" },
  { id: "list", icon: "format-list-bulleted" },
  { id: "link", icon: "link" },
  { id: "formula", icon: "functions" },
];

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  courses,
  pending = false,
  initial = null,
  onSubmit,
}: AssignmentFormDialogProps) {
  const { t } = useTranslation("homework");
  const common = useTranslation("common").t;
  const weekdays = common("formPickers.weekdays", { returnObjects: true }) as string[];
  const months = common("formPickers.months", { returnObjects: true }) as string[];
  const isCompact = useIsCompact();
  const [courseId, setCourseId] = useState(initial?.courseId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [date, setDate] = useState(() => initial?.dueAt?.slice(0, 10) ?? today());
  const [time, setTime] = useState(() => initial?.dueAt?.slice(11, 16) ?? "18:00");
  const [grading, setGrading] = useState<GradingScale>(initial?.grading ?? "five");
  const [aiCheck, setAiCheck] = useState(initial?.aiCheck ?? true);
  const [announce, setAnnounce] = useState(initial?.announceInChat ?? true);
  const [touched, setTouched] = useState(false);

  const course = courses.find((item) => item.id === courseId) ?? null;
  const missing = [!courseId, !title.trim()].filter(Boolean).length;
  const invalid = touched && missing > 0;

  function save(status: "draft" | "active") {
    if (missing) {
      setTouched(true);
      return;
    }
    onSubmit({
      courseId,
      title: title.trim(),
      description: "",
      body,
      dueAt: `${date}T${time || "23:59"}`,
      status,
      announceInChat: announce,
      allowLate: true,
      aiCheck,
      grading,
    });
  }

  if (isCompact) {
    const titleMissing = invalid && !title.trim();
    const dueDate = new Date(`${date}T00:00`);
    const dateLabel = Number.isNaN(dueDate.getTime())
      ? date
      : t("mobileForm.dateValue", {
          weekday: weekdays[(dueDate.getDay() + 6) % 7] ?? "",
          day: dueDate.getDate(),
          month: (months[dueDate.getMonth()] ?? "").slice(0, 3).toLowerCase(),
        });

    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-canvas bg-auth-gradient font-body text-ink outline-none">
            <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
              <header className="flex h-11 items-center gap-3">
                <DialogPrimitive.Close
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink"
                  aria-label={t("mobileForm.close")}
                >
                  <Icon name="close" size={22} />
                </DialogPrimitive.Close>
                <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold">
                  {initial ? t("mobileForm.editTitle") : t("mobileForm.title")}
                </DialogPrimitive.Title>
                <span className="size-11 shrink-0" aria-hidden="true" />
              </header>
              <DialogPrimitive.Description className="sr-only">{t("form.description")}</DialogPrimitive.Description>

              {invalid ? (
                <p className="mt-0.5 flex items-center gap-3 rounded-lg bg-danger-bg px-4 py-3 text-body-sm text-error-text">
                  <Icon name="warning-fill" size={18} className="shrink-0 text-danger" />
                  {t("form.errorBanner")}
                </p>
              ) : null}

              <MobileFieldLabel label={<RequiredLabel>{t("form.group")}</RequiredLabel>}>
                <MobilePickerField
                  type="select"
                  surface
                  value={courseId}
                  invalid={invalid && !courseId}
                  display={
                    course ? (
                      `${course.title} · ${t("form.students", { count: course.studentCount })}`
                    ) : (
                      <span className="text-ink-secondary">{t("mobileForm.groupPlaceholder")}</span>
                    )
                  }
                  ariaLabel={t("form.group")}
                  options={[
                    { value: "", label: t("mobileForm.groupPlaceholder") },
                    ...courses.map((item) => ({
                      value: item.id,
                      label: `${item.title} · ${t("form.students", { count: item.studentCount })}`,
                    })),
                  ]}
                  onChange={(value) => {
                    setCourseId(value);
                    setTouched(false);
                  }}
                />
              </MobileFieldLabel>

              <MobileFieldLabel label={<RequiredLabel>{t("form.titleLabel")}</RequiredLabel>}>
                <span className="relative flex flex-col">
                  <input
                    className={`${MOBILE_INPUT_SURFACE} ${titleMissing ? "border-error-text! pr-12" : ""}`}
                    value={title}
                    placeholder={titleMissing ? "" : t("form.titlePlaceholder")}
                    aria-invalid={titleMissing}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  {titleMissing ? (
                    <Icon
                      name="warning-fill"
                      size={20}
                      className="pointer-events-none absolute top-4 right-4 text-danger"
                    />
                  ) : null}
                </span>
                {titleMissing ? (
                  <small className="text-caption text-error-text">{t("form.titleRequired")}</small>
                ) : null}
              </MobileFieldLabel>

              <MobileFieldLabel label={<RequiredLabel>{t("form.bodyLabel")}</RequiredLabel>}>
                <span className="flex flex-col overflow-hidden rounded-lg bg-surface">
                  <span className="flex h-[47px] items-center border-b border-line px-1.5">
                    {FORMAT_BUTTONS.map((button) => (
                      <span key={button.id} className="grid size-9 place-items-center text-ink-secondary">
                        <Icon name={button.icon} size={18} />
                      </span>
                    ))}
                  </span>
                  <textarea
                    rows={3}
                    className="h-24 w-full resize-none bg-transparent px-4 py-3 text-body text-ink outline-none placeholder:text-ink-secondary"
                    value={body}
                    placeholder={t("form.bodyPlaceholder")}
                    onChange={(event) => setBody(event.target.value)}
                  />
                </span>
              </MobileFieldLabel>

              <div className="grid grid-cols-2 gap-3">
                <MobileFieldLabel label={<RequiredLabel>{t("form.due")}</RequiredLabel>}>
                  <MobilePickerField
                    type="date"
                    surface
                    value={date}
                    min={today()}
                    display={dateLabel}
                    ariaLabel={t("form.due")}
                    onChange={setDate}
                  />
                </MobileFieldLabel>
                <MobileFieldLabel label={t("form.time")}>
                  <MobilePickerField
                    type="time"
                    surface
                    value={time}
                    display={time}
                    ariaLabel={t("form.time")}
                    onChange={setTime}
                  />
                </MobileFieldLabel>
              </div>

              <MobileFieldLabel label={t("form.grading")}>
                <MobileChoiceChips
                  items={GRADINGS}
                  value={grading}
                  onChange={setGrading}
                  render={(item) => t(`form.gradings.${item}`)}
                />
              </MobileFieldLabel>

              <div className="mt-0.5 flex flex-col gap-4 rounded-lg bg-surface p-4">
                <MobileToggleRow
                  icon="sparkles-fill"
                  tone="bg-accent-saffron-bg text-accent-saffron-fg"
                  title={t("form.aiCheck")}
                  hint={t("form.aiCheckHint")}
                  checked={aiCheck}
                  onChange={setAiCheck}
                />
                <MobileToggleRow
                  icon="chat"
                  tone="bg-brand-subtle text-brand"
                  title={t("form.announce")}
                  hint={t("form.announceHint")}
                  checked={announce}
                  onChange={setAnnounce}
                />
              </div>
            </div>

            <div className="flex shrink-0 gap-3 rounded-t-2xl bg-surface px-4 pt-3 pb-8.5 shadow-nav-top">
              <button
                type="button"
                className="flex h-13 shrink-0 items-center justify-center rounded-full border border-line-strong px-5 text-title font-medium text-ink disabled:opacity-40"
                disabled={pending}
                onClick={() => save("draft")}
              >
                {t("form.draft")}
              </button>
              <button
                type="button"
                className="flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-title font-medium text-on-action disabled:opacity-40"
                disabled={pending}
                onClick={() => save("active")}
              >
                <Icon name="send" size={20} /> {t("form.submit")}
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-180"
      icon={
        <span className="grid size-11 place-items-center rounded-md bg-brand-subtle text-brand">
          <Icon name="assignment" size={22} />
        </span>
      }
      title={t("form.title")}
      description={invalid ? t("form.missing", { count: missing }) : t("form.description")}
      footer={
        <>
          <small className="min-w-0 flex-1 truncate text-body-xs text-ink-tertiary">
            {course ? `${course.title} · ${t("form.students", { count: course.studentCount })}` : ""}
          </small>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            disabled={pending}
            onClick={() => save("draft")}
          >
            {t("form.draft")}
          </button>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center justify-center rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40"
            disabled={pending}
            onClick={() => save("active")}
          >
            {t("form.submit")}
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lesson-form flex min-w-0 flex-col gap-4">
          {invalid ? (
            <p className="flex items-center gap-2.5 rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
              <Icon name="error" size={18} className="shrink-0" />
              {t("form.errorBanner")}
            </p>
          ) : null}

          <SelectPicker
            label={t("form.group")}
            searchable
            value={courseId}
            onChange={(value) => {
              setCourseId(value);
              setTouched(false);
            }}
            options={courses.map((item) => ({
              value: item.id,
              label: `${item.title} · ${t("form.students", { count: item.studentCount })}`,
            }))}
          />

          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("form.titleLabel")}</span>
            <input
              className={`h-12.5 w-full rounded-md border bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:bg-surface ${
                invalid && !title.trim()
                  ? "border-danger bg-surface"
                  : "border-transparent focus:border-focus"
              }`}
              value={title}
              placeholder={t("form.titlePlaceholder")}
              onChange={(event) => setTitle(event.target.value)}
            />
            {invalid && !title.trim() ? (
              <small className="text-body-xs text-danger">{t("form.titleRequired")}</small>
            ) : null}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("form.bodyLabel")}</span>
            <span className="flex flex-col overflow-hidden rounded-md bg-subtle">
              <span className="flex items-center gap-1 px-2 py-1.5">
                {FORMAT_BUTTONS.map((button) => (
                  <span
                    key={button.id}
                    className="grid size-8 place-items-center rounded-sm text-icon-tertiary"
                  >
                    <Icon name={button.icon} size={16} />
                  </span>
                ))}
              </span>
              <textarea
                className="min-h-25 w-full resize-none bg-transparent px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary"
                value={body}
                placeholder={t("form.bodyPlaceholder")}
                onChange={(event) => setBody(event.target.value)}
              />
            </span>
          </label>
        </div>

        <div className="lesson-form flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-2 items-start gap-3">
            <DatePicker label={t("form.due")} value={date} onChange={setDate} />
            <TimePicker label={t("form.time")} value={time} onChange={setTime} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-body-xs text-ink-secondary">{t("form.grading")}</span>
            <div className="flex items-center gap-1 rounded-full bg-subtle p-1">
              {GRADINGS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-full text-button transition-colors ${
                    grading === item
                      ? "bg-brand text-ink-inverse"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                  onClick={() => setGrading(item)}
                >
                  {t(`form.gradings.${item}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md bg-subtle p-4">
            <ToggleRow
              icon="auto-awesome"
              tone="bg-accent-saffron-bg text-accent-saffron-fg"
              title={t("form.aiCheck")}
              hint={t("form.aiCheckHint")}
              checked={aiCheck}
              onChange={setAiCheck}
            />
            <ToggleRow
              icon="chat"
              tone="bg-brand-subtle text-brand"
              title={t("form.announce")}
              hint={t("form.announceHint")}
              checked={announce}
              onChange={setAnnounce}
            />
          </div>
        </div>
      </div>
    </AppDialog>
  );
}

function ToggleRow({
  icon,
  tone,
  title,
  hint,
  checked,
  onChange,
}: {
  icon: string;
  tone: string;
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tone}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title-sm text-ink">{title}</strong>
        <small className="truncate text-body-xs text-ink-tertiary">{hint}</small>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </span>
  );
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children} <span className="text-error-text">*</span>
    </>
  );
}

function MobileToggleRow({
  icon,
  tone,
  title,
  hint,
  checked,
  onChange,
}: {
  icon: string;
  tone: string;
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <span className="flex items-center gap-3">
      <span className={`grid size-10 shrink-0 place-items-center rounded-md ${tone}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-title leading-6 text-ink">{title}</strong>
        <small className="truncate text-body-sm text-ink-secondary">{hint}</small>
      </span>
      <Switch size="lg" checked={checked} onCheckedChange={onChange} aria-label={title} />
    </span>
  );
}
