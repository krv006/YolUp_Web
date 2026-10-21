import { useMemo, useRef, useState } from "react";
import { Bold, Italic, Link2, List, Underline } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourses } from "@/modules/course";
import { useCreateAssignment, useUpdateAssignment } from "@/modules/homework";
import type { Assignment, AssignmentStatus, GradingScale } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";

export interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string | null;
  assignment?: Assignment | null;
  submittedCount?: number;
  lessons?: Array<{ id: string; title: string; date: string }>;
  onDelete?: (assignment: Assignment) => void;
}



export function AssignmentFormDialog({
  open,
  onOpenChange,
  courseId = null,
  assignment = null,
  submittedCount = 0,
  lessons = [],
  onDelete,
}: AssignmentFormDialogProps) {
  const { t } = useTranslation("homework");
  const courses = useCourses();
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const fileRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState(courseId ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [grading, setGrading] = useState<GradingScale>("five");
  const [maxScore, setMaxScore] = useState("100");
  const [file, setFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [gradingNote, setGradingNote] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [aiCheck, setAiCheck] = useState(true);
  const [announce, setAnnounce] = useState(true);
  const [allowLate, setAllowLate] = useState(true);

  const formKey = open ? `${assignment?.id ?? "new"}|${courseId ?? ""}` : "";
  const [syncedKey, setSyncedKey] = useState("");

  if (formKey && formKey !== syncedKey) {
    setSyncedKey(formKey);
    setCourse(assignment?.courseId ?? courseId ?? "");
    setTitle(assignment?.title ?? "");
    setBody(assignment?.description ?? "");
    setLessonId(assignment?.lessonId ?? "");
    setGradingNote("");
    setFile(null);
    setGrading(assignment?.grading ?? "five");
    setMaxScore(String(assignment?.maxScore ?? 100));
    setAnnounce(assignment?.announceInChat ?? true);
    setAllowLate(assignment?.allowLate ?? true);
    if (assignment?.dueAt) {
      const due = new Date(assignment.dueAt);
      setDate(
        `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(
          due.getDate()
        ).padStart(2, "0")}`
      );
      setTime(
        `${String(due.getHours()).padStart(2, "0")}:${String(due.getMinutes()).padStart(2, "0")}`
      );
    } else {
      setDate("");
      setTime("18:00");
    }
  }
  if (!formKey && syncedKey) setSyncedKey("");

  const lessonChoices = useMemo(
    () => [
      { value: "", label: t("form.lessonNone") },
      ...lessons.map((lesson) => ({
        value: lesson.id,
        label: `${lesson.title} · ${lesson.date}`,
      })),
    ],
    [lessons, t]
  );

  function wrapSelection(prefix: string, suffix: string) {
    const element = bodyRef.current;
    if (!element) return;
    const start = element.selectionStart ?? body.length;
    const end = element.selectionEnd ?? body.length;
    const next = `${body.slice(0, start)}${prefix}${body.slice(start, end)}${suffix}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }

  const options = (courses.data ?? []).map((item) => ({
    value: item.id,
    label: item.studentCount
      ? `${item.title} · ${t("form.studentCount", { count: item.studentCount })}`
      : item.title,
  }));

  async function save(status: AssignmentStatus = "active") {
    if (!course || !title.trim()) {
      toast.error(t("form.required"));
      return;
    }
    const form = {
      courseId: course,
      title: title.trim(),
      description: body.trim(),
      body: body.trim(),
      dueAt: date ? new Date(`${date}T${time}`).toISOString() : undefined,
      file,
      status,
      announceInChat: announce,
      allowLate,
      grading,
      maxScore: Number(maxScore) || 100,
      ...(assignment ? { lessonId: lessonId || null, extraInstructions: gradingNote } : {}),
    };
    try {
      if (assignment) await update.mutateAsync({ id: assignment.id, form });
      else await create.mutateAsync(form);
      onOpenChange(false);
    } catch {
      /* the mutation hooks report the error */
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      width="lg:w-[640px]"
      title={assignment ? t("form.editTitle") : t("form.title")}
      description={
        assignment && submittedCount
          ? t("form.editSubtitle", { count: submittedCount })
          : t("form.subtitle")
      }
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            disabled={create.isPending || update.isPending}
            onClick={() => (assignment ? onOpenChange(false) : save("draft"))}
          >
            {assignment ? t("form.cancel") : t("form.draft")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={create.isPending || update.isPending}
            onClick={() => save("active")}
          >
            {assignment
              ? assignment.status === "draft"
                ? t("form.publish")
                : t("form.save")
              : t("form.submit")}
          </button>
        </>
      }
    >
      {assignment ? (
        <div className="flex flex-col gap-4">
          <label className="field-group">
            <span>{t("form.nameLabel")}</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <div className="flex flex-col overflow-hidden rounded-xl border border-line">
            <div className="flex items-center gap-1 border-b border-line bg-subtle px-2 py-1.5">
              {(
                [
                  [Bold, "b", t("form.rich.bold")],
                  [Italic, "i", t("form.rich.italic")],
                  [Underline, "u", t("form.rich.underline")],
                ] as const
              ).map(([RichIcon, tag, label]) => (
                <button
                  key={tag}
                  type="button"
                  className="grid size-8 place-items-center rounded-lg text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
                  aria-label={label}
                  onClick={() => wrapSelection(`<${tag}>`, `</${tag}>`)}
                >
                  <RichIcon size={15} />
                </button>
              ))}
              <span className="mx-1 h-5 w-px bg-line" />
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
                aria-label={t("form.rich.list")}
                onClick={() => wrapSelection("• ", "")}
              >
                <List size={15} />
              </button>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg text-ink-secondary transition-colors hover:bg-surface hover:text-ink"
                aria-label={t("form.rich.link")}
                onClick={() => {
                  const url = window.prompt(t("form.rich.linkPrompt"));
                  if (url) wrapSelection(`<a href="${url}">`, "</a>");
                }}
              >
                <Link2 size={15} />
              </button>
            </div>
            <textarea
              ref={bodyRef}
              className="min-h-[120px] w-full resize-none bg-surface px-4 py-3 text-body text-ink outline-none"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t("form.bodyPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                event.target.value = "";
                if (next) setFile(next);
              }}
            />
            <button
              type="button"
              className="flex h-11 w-fit items-center gap-2 rounded-xl bg-action-subtle px-4 text-label-strong text-action transition-opacity hover:opacity-80"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="assign" size={17} /> {t("form.attachFile")}
            </button>

            {file || assignment.hasAttachment ? (
              <span className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-error-bg text-caption-strong text-error-text">
                  {(file?.name ?? assignment.attachmentName ?? "FILE")
                    .split(".")
                    .pop()
                    ?.slice(0, 4)
                    .toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-label-strong text-ink">
                    {file?.name ?? assignment.attachmentName ?? "—"}
                  </strong>
                  {file ? (
                    <small className="text-caption text-ink-tertiary">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </small>
                  ) : null}
                </span>
                {file ? (
                  <button
                    type="button"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-tertiary transition-colors hover:text-ink"
                    onClick={() => setFile(null)}
                    aria-label={t("form.removeFile")}
                  >
                    <Icon name="add" size={16} className="rotate-45" />
                  </button>
                ) : null}
              </span>
            ) : null}
          </div>

          <DatePicker label={t("form.dueDate")} value={date} onChange={setDate} optional />

          <SelectPicker
            label={t("form.lessonLabel")}
            value={lessonId}
            onChange={setLessonId}
            options={lessonChoices}
          />

          <label className="field-group">
            <span>{t("form.gradingNote")}</span>
            <input
              value={gradingNote}
              onChange={(event) => setGradingNote(event.target.value)}
              placeholder={t("form.gradingNotePlaceholder")}
            />
          </label>

          {onDelete ? (
            <button
              type="button"
              className="mx-auto flex h-11 items-center gap-2 rounded-full px-4 text-label-strong text-error-text transition-colors hover:bg-error-bg"
              onClick={() => {
                onOpenChange(false);
                onDelete(assignment);
              }}
            >
              <Icon name="trash" size={17} /> {t("form.deleteAssignment")}
            </button>
          ) : null}
        </div>
      ) : (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <SelectPicker
            label={t("form.group")}
            value={course}
            onChange={setCourse}
            options={options}
          />
          <label className="field-group">
            <span>{t("form.titleLabel")}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("form.titlePlaceholder")}
            />
          </label>
        </div>

        <label className="field-group">
          <span>{t("form.bodyLabel")}</span>
          <textarea
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("form.bodyPlaceholder")}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-3">
          <DatePicker label={t("form.dueDate")} value={date} onChange={setDate} optional />
          <TimePicker label={t("form.dueTime")} value={time} onChange={setTime} />
          <div className="flex flex-col gap-1.5">
            <span className="text-label-strong text-ink-secondary">{t("form.grading")}</span>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["five", t("form.gradingFive")],
                  ["hundred", t("form.gradingHundred")],
                  ["none", t("form.gradingNone")],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`h-10 rounded-full px-3 text-label-strong whitespace-nowrap transition-colors ${
                    grading === id
                      ? "bg-action-subtle text-action"
                      : "border border-line bg-surface text-ink-secondary hover:bg-subtle"
                  }`}
                  onClick={() => setGrading(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            {grading === "hundred" ? (
              <label className="field-group">
                <span>{t("form.maxScore")}</span>
                <input
                  inputMode="numeric"
                  value={maxScore}
                  onChange={(event) => setMaxScore(event.target.value.replace(/\D/g, ""))}
                  placeholder="100"
                />
              </label>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-label-strong text-ink-secondary">{t("form.attachments")}</span>
          <div className="flex flex-wrap items-center gap-3">
            {file ? (
              <span className="flex h-16 items-center gap-3 rounded-xl border border-line bg-canvas pr-3 pl-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-error-bg text-caption-strong text-error-text">
                  {file.name.split(".").pop()?.slice(0, 4).toUpperCase() ?? "FILE"}
                </span>
                <span className="flex min-w-0 max-w-[180px] flex-col">
                  <strong className="truncate text-caption-strong text-ink">{file.name}</strong>
                  <small className="text-caption text-ink-tertiary">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </small>
                </span>
                <button
                  type="button"
                  className="grid size-6 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-ink"
                  onClick={() => setFile(null)}
                  aria-label={t("form.removeFile")}
                >
                  <Icon name="add" size={14} className="rotate-45" />
                </button>
              </span>
            ) : null}
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                event.target.value = "";
                if (next) setFile(next);
              }}
            />
            <button
              type="button"
              className="flex h-16 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-label-strong text-ink-secondary transition-colors hover:bg-subtle"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="add" size={18} /> {t("form.addFile")}
            </button>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl border border-line">
          {(
            [
              ["ai", "check-circle", "bg-saffron-strong", aiCheck, setAiCheck, true],
              ["announce", "bell", "bg-action", announce, setAnnounce, true],
              ["late", "clock", "bg-ink-tertiary", allowLate, setAllowLate, true],
            ] as const
          ).map(([id, icon, tone, value, setValue, supported]) => (
            <span
              key={id}
              className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone} text-white`}
              >
                <Icon name={icon} size={17} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="text-label-strong text-ink">{t(`form.toggle.${id}`)}</strong>
                <small className="text-caption text-ink-tertiary">
                  {supported ? t(`form.toggle.${id}Hint`) : t("form.toggle.pending")}
                </small>
              </span>
              <Switch
                checked={value}
                onCheckedChange={(next) => {
                  if (!supported) {
                    toast.info(t("form.toggle.pending"));
                    return;
                  }
                  setValue(next);
                }}
                aria-label={t(`form.toggle.${id}`)}
              />
            </span>
          ))}
        </div>
      </div>
      )}
    </AppDialog>
  );
}
