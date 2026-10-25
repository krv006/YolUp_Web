import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";

export interface NewTestDraft {
  courseId: string;
  title: string;
  subject: string;
  dueAt: string | null;
}

export interface NewTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: ReadonlyArray<{ id: string; label: string; subject: string }>;
  subjects: ReadonlyArray<{ value: string; label: string }>;
  pending?: boolean;
  onContinue: (draft: NewTestDraft) => void;
  onImport: () => void;
}

const IMPORT_SOURCES = [
  { id: "docx", icon: "description" },
  { id: "xlsx", icon: "grid-view" },
  { id: "google", icon: "send" },
];

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function NewTestDialog({
  open,
  onOpenChange,
  courses,
  subjects,
  pending = false,
  onContinue,
  onImport,
}: NewTestDialogProps) {
  const { t } = useTranslation("quiz");
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState(today);

  const course = courses.find((item) => item.id === courseId) ?? null;
  const finalSubject = subject || course?.subject || "";

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      width="lg:w-160"
      icon={
        <span className="grid size-11 place-items-center rounded-md bg-brand-subtle text-brand">
          <Icon name="quiz" size={22} />
        </span>
      }
      title={t("newTest.title")}
      description={t("newTest.step1")}
      footer={
        <>
          <span className="min-w-0 flex-1" />
          <button
            type="button"
            className="flex h-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={() => onOpenChange(false)}
          >
            {t("newTest.cancel")}
          </button>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center justify-center rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40"
            disabled={pending || !courseId || !title.trim()}
            onClick={() =>
              onContinue({
                courseId,
                title: title.trim(),
                subject: finalSubject,
                dueAt: due ? `${due}T23:59` : null,
              })
            }
          >
            {t("newTest.continue")}
          </button>
        </>
      }
    >
      <div className="lesson-form flex flex-col gap-4.5">
        <SelectPicker
          label={t("newTest.group")}
          searchable
          value={courseId}
          onChange={setCourseId}
          options={courses.map((item) => ({ value: item.id, label: item.label }))}
        />

        <label className="flex flex-col gap-2">
          <span className="text-body-xs text-ink-secondary">{t("newTest.name")}</span>
          <input
            autoFocus
            className="h-12.5 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
            value={title}
            placeholder={t("newTest.namePlaceholder")}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 items-start gap-3">
          <SelectPicker
            label={t("newTest.subject")}
            value={finalSubject}
            onChange={setSubject}
            options={[...subjects]}
          />
          <DatePicker label={t("newTest.due")} value={due} onChange={setDue} />
        </div>

        <span className="text-body-xs text-ink-tertiary">{t("newTest.importHint")}</span>

        <div className="grid grid-cols-3 gap-3">
          {IMPORT_SOURCES.map((source) => (
            <button
              key={source.id}
              type="button"
              className="flex h-19 flex-col items-center justify-center gap-2 rounded-md bg-subtle text-ink transition-colors hover:bg-muted"
              onClick={onImport}
            >
              <Icon name={source.icon} size={20} className="text-brand" />
              <small className="text-title-sm">{t(`newTest.sources.${source.id}`)}</small>
            </button>
          ))}
        </div>
      </div>
    </AppDialog>
  );
}
