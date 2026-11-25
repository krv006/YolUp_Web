import { useMemo, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CalendarDays, FileUp, GraduationCap, Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  googleFormUrlInvalid,
  QuestionsEditor,
  useAssignment,
  useQuestionDrafts,
  VoiceNoteField,
  type AssignmentVoiceInput,
  type HomeworkQuestionInput,
} from "@/modules/homework";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { DatePicker, SelectPicker } from "@/shared/ui/legacy/form-pickers";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";
import type { Assignment, Lesson } from "@/shared/types";


interface AssignmentDraft { title: string; description: string; dueAt: string; skillKey: string; gradingNote: string; lessonId: string }

export interface AddAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    values: Omit<AssignmentDraft, "gradingNote"> & {
      body: string;
      extraInstructions: string;
      file: File | null;
      voice?: AssignmentVoiceInput | null;
      questions?: HomeworkQuestionInput[];
      googleFormUrl: string;
      aiCheck: boolean;
    }
  ) => void;
  lessons?: readonly Lesson[];
  isLanguageSubject?: boolean;
  initialValues?: Assignment | null;
}


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



const EMPTY_ASSIGNMENT: AssignmentDraft = {
  title: "",
  description: "",
  dueAt: "",
  skillKey: "",
  gradingNote: "",
  lessonId: "",
};

const ASSIGNMENT_FORM_ID = "group-assignment-form";

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
  const [googleFormUrl, setGoogleFormUrl] = useState(initialValues?.googleFormUrl ?? "");
  const [aiCheck, setAiCheck] = useState(initialValues?.aiCheck ?? true);
  const [voice, setVoice] = useState<AssignmentVoiceInput | null | undefined>(undefined);
  const googleFormInvalid = googleFormUrlInvalid(googleFormUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const detail = useAssignment(open && initialValues ? initialValues.id : null);
  const questions = useQuestionDrafts([], {
    editing: Boolean(initialValues),
    locked:
      Boolean(initialValues) &&
      ((detail.data?.submissions.length ?? 0) > 0 || (initialValues?.submissionsCount ?? 0) > 0),
  });
  const questionsKey = open ? (initialValues ? (detail.data ? `edit:${detail.data.id}` : "") : "new") : "";
  const [syncedQuestions, setSyncedQuestions] = useState("");
  if (questionsKey && questionsKey !== syncedQuestions) {
    setSyncedQuestions(questionsKey);
    questions.reset(initialValues ? (detail.data?.questions ?? []) : []);
  }
  if (!questionsKey && syncedQuestions) setSyncedQuestions("");

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
    if (!form.title.trim() || !form.description.trim() || googleFormInvalid) return;
    if (!questions.validate()) {
      toast.error(t("homework:questions.fixIssues"));
      return;
    }
    const { gradingNote, ...rest } = form;
    onCreate({
      ...rest,
      questions: questions.payload(),
      skillKey: isLanguageSubject ? rest.skillKey : "",
      body: rest.description,
      extraInstructions: gradingNote,
      file,
      voice,
      googleFormUrl: googleFormUrl.trim(),
      aiCheck,
    });
    setForm(EMPTY_ASSIGNMENT);
    setFile(null);
    setVoice(undefined);
    setGoogleFormUrl("");
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
            id={ASSIGNMENT_FORM_ID}
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
            <div className="grid gap-1.5">
              <span className="field-block-label">{t("dialogs.assignment.descriptionLabel")}</span>
              <div className="rich-assignment-field">
                <textarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder={t("dialogs.assignment.descriptionPlaceholder")}
                  aria-label={t("dialogs.assignment.descriptionLabel")}
                  rows={5}
                />
              </div>
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
            <VoiceNoteField existing={detail.data?.voice ?? initialValues?.voice ?? null} value={voice} onChange={setVoice} />
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
            <label>
              <span>{t("homework:form.googleForm")}</span>
              <input
                type="url"
                inputMode="url"
                value={googleFormUrl}
                aria-invalid={googleFormInvalid}
                onChange={(event) => setGoogleFormUrl(event.target.value)}
                placeholder="https://forms.gle/…"
              />
              <small className={`text-body-xs ${googleFormInvalid ? "text-danger" : "text-ink-tertiary"}`}>
                {googleFormInvalid ? t("homework:form.googleFormInvalid") : t("homework:form.googleFormHint")}
              </small>
            </label>
            <div className="flex items-center gap-3 rounded-xl bg-subtle px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-saffron-bg text-accent-saffron-fg">
                <Icon name="auto-awesome" size={18} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="text-label-strong text-ink">{t("homework:form.aiCheck")}</strong>
                <small className="text-body-xs text-ink-secondary">{t("homework:form.aiCheckHint")}</small>
              </span>
              <Switch
                size="lg"
                checked={aiCheck}
                onCheckedChange={setAiCheck}
                aria-label={t("homework:form.aiCheck")}
              />
            </div>
          </motion.form>
          <div className="mt-4">
            <QuestionsEditor
              value={questions.drafts}
              onChange={questions.setDrafts}
              locked={questions.locked}
              showIssues={questions.showIssues}
            />
          </div>
          <div className="dialog-actions is-sticky">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("dialogs.assignment.cancel")}
            </Button>
            <Button
              type="submit"
              form={ASSIGNMENT_FORM_ID}
              disabled={!form.title.trim() || !form.description.trim() || googleFormInvalid}
            >
              {initialValues ? t("dialogs.assignment.saveChanges") : t("dialogs.assignment.submit")}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
