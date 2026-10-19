import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCourses } from "@/modules/course";
import { useCreateAssignment, useUpdateAssignment } from "@/modules/homework";
import type { Assignment } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { DatePicker, SelectPicker, TimePicker } from "@/shared/ui/legacy/form-pickers";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";

export interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string | null;
  assignment?: Assignment | null;
}

type Grading = "five" | "hundred" | "none";

export function AssignmentFormDialog({
  open,
  onOpenChange,
  courseId = null,
  assignment = null,
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
  const [grading, setGrading] = useState<Grading>("five");
  const [file, setFile] = useState<File | null>(null);
  const [aiCheck, setAiCheck] = useState(true);
  const [announce, setAnnounce] = useState(true);
  const [allowLate, setAllowLate] = useState(false);

  const formKey = open ? `${assignment?.id ?? "new"}|${courseId ?? ""}` : "";
  const [syncedKey, setSyncedKey] = useState("");

  if (formKey && formKey !== syncedKey) {
    setSyncedKey(formKey);
    setCourse(assignment?.courseId ?? courseId ?? "");
    setTitle(assignment?.title ?? "");
    setBody(assignment?.description ?? "");
    setFile(null);
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

  const options = (courses.data ?? []).map((item) => ({
    value: item.id,
    label: item.studentCount
      ? `${item.title} · ${t("form.studentCount", { count: item.studentCount })}`
      : item.title,
  }));

  async function save() {
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
      description={t("form.subtitle")}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => toast.info(t("form.draftUnavailable"))}
          >
            {t("form.draft")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={create.isPending || update.isPending}
            onClick={save}
          >
            {t("form.submit")}
          </button>
        </>
      }
    >
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
            <div className="flex items-center gap-2">
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
                  className={`h-10 rounded-full px-3 text-label-strong transition-colors ${
                    grading === id
                      ? "bg-action-subtle text-action"
                      : "border border-line bg-surface text-ink-secondary hover:bg-subtle"
                  }`}
                  onClick={() => {
                    setGrading(id);
                    if (id !== "five") toast.info(t("form.gradingUnavailable"));
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
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
              ["announce", "bell", "bg-action", announce, setAnnounce, false],
              ["late", "clock", "bg-ink-tertiary", allowLate, setAllowLate, false],
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
    </AppDialog>
  );
}
