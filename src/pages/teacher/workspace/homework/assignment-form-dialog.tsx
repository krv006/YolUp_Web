import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
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
  const [courseId, setCourseId] = useState(initial?.courseId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [date, setDate] = useState(() => initial?.dueAt?.slice(0, 10) ?? today());
  const [time, setTime] = useState(() => initial?.dueAt?.slice(11, 16) ?? "18:00");
  const [grading, setGrading] = useState<GradingScale>(initial?.grading ?? "five");
  const [aiCheck, setAiCheck] = useState(true);
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
      grading,
      extraInstructions: aiCheck ? "" : undefined,
    });
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
