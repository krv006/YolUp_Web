import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCourses } from "@/modules/course";
import {
  emptyQuestion,
  googleFormUrlInvalid,
  homeworkApi,
  VoiceNoteField,
  type AssignmentVoiceInput,
  QuestionsEditor,
  useAssignment,
  useCreateAssignment,
  useQuestionDrafts,
  useUpdateAssignment,
  type AssignmentFormInput,
} from "@/modules/homework";
import { isRichHtmlEmpty, RichEditor, richTitle, type QuestionKind } from "@/modules/rich-editor";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import type { Assignment, HomeworkQuestion } from "@/shared/types";
import { WorkspaceShell, workspaceGhostAction } from "@/widgets/workspace-shell";
import { splitDue } from "./due-date";
import { bodyToEditorHtml } from "./editor-html";
import { clearDraft, hasDraftContent, loadDraft, saveDraft, type StoredDraft } from "./draft-storage";
import { BANK_VALUE, HomeworkSettingsPanel, type HomeworkSettings } from "./homework-settings-panel";
import { HomeworkTestPicker, type PickedQuiz } from "./homework-test-picker";

type Tab = "write" | "pick";

function dateString(daysAhead = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function asQuestions(drafts: StoredDraft["questions"]): HomeworkQuestion[] {
  return drafts.map((draft) => ({
    id: draft.key,
    type: draft.type,
    text: draft.text,
    options: draft.options,
    correct: draft.correct,
    points: draft.points,
  }));
}

/**
 * Yangi vazifa / vazifani tahrirlash (faqat kompyuter ko'rinishi): katta oq yozish sahifasi, o'ngda sozlamalar,
 * "Testlardan tanlash" alohida bo'lim. Yozilgani o'zi qoralamaga saqlanadi (faqat yangi vazifada).
 */
export function NewHomeworkPage() {
  const { assignmentId } = useParams();
  const isCompact = useIsCompact();
  const assignment = useAssignment(assignmentId);

  if (isCompact) {
    return <Navigate to={assignmentId ? ROUTES.teacher.homeworkItem(assignmentId) : `${ROUTES.teacher.homework}?new=1`} replace />;
  }
  if (assignmentId) {
    if (assignment.isError) return <Navigate to={ROUTES.teacher.homework} replace />;
    if (!assignment.data) return <WorkspaceShell eyebrow="" title="" children={null} />;
    return <HomeworkWorkspace key={assignment.data.id} item={assignment.data} />;
  }
  return <HomeworkWorkspace item={null} />;
}

function HomeworkWorkspace({ item }: { item: Assignment | null }) {
  const { t } = useTranslation("homework");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const courses = useCourses();
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const editing = Boolean(item);
  const today = dateString();

  const [restored] = useState<StoredDraft | null>(() => (editing ? null : loadDraft()));
  const [tab, setTab] = useState<Tab>("write");
  const [html, setHtml] = useState(() => (item ? bodyToEditorHtml(item.body || item.description) : (restored?.html ?? "")));
  const [settings, setSettings] = useState<HomeworkSettings>(() => ({
    group: item ? (item.courseId ? item.courseId : BANK_VALUE) : (restored?.group ?? (params.get("bank") === "1" ? BANK_VALUE : "")),
    date: splitDue(item?.dueAt)?.date ?? restored?.date ?? dateString(1),
    time: splitDue(item?.dueAt)?.time ?? restored?.time ?? "18:00",
    grading: item?.grading ?? restored?.grading ?? "hundred",
    aiCheck: item?.aiCheck ?? restored?.aiCheck ?? true,
    announce: item?.announceInChat ?? restored?.announce ?? true,
    googleFormUrl: item?.googleFormUrl ?? restored?.googleFormUrl ?? "",
  }));
  const locked = Boolean(item && (item.submissions.length > 0 || (item.submissionsCount ?? 0) > 0));
  const questions = useQuestionDrafts(item?.questions ?? (restored ? asQuestions(restored.questions) : []), {
    editing,
    locked,
  });
  const [added, setAdded] = useState<Array<{ quizId: string; title: string; keys: string[] }>>([]);
  const [asked, setAsked] = useState(false);
  const [dateBad, setDateBad] = useState(false);
  const [voice, setVoice] = useState<AssignmentVoiceInput | null | undefined>(undefined);
  const [saveState, setSaveState] = useState<{ ok: boolean; time: string } | null>(null);
  const questionsRef = useRef<HTMLDivElement>(null);

  const inBank = settings.group === BANK_VALUE;
  const groups = useMemo(
    () =>
      item
        ? [{ id: item.courseId, title: item.courseTitle, studentCount: item.stats?.studentsCount ?? 0 }]
        : (courses.data ?? []).map((course) => ({ id: course.id, title: course.title, studentCount: course.studentCount ?? 0 })),
    [item, courses.data]
  );

  const invalid = {
    group: asked && !settings.group,
    date: dateBad && !inBank,
  };
  const empty = isRichHtmlEmpty(html) && !questions.drafts.length && !settings.googleFormUrl.trim() && !voice && !(item?.voice && voice !== null);

  // Qoralama: faqat yangi vazifada, yozgandan 0,6 soniya keyin o'zi saqlanadi.
  const { drafts } = questions;
  useEffect(() => {
    if (editing) return;
    const timer = window.setTimeout(() => {
      const draft: StoredDraft = { html, ...settings, questions: drafts };
      if (!hasDraftContent(draft)) {
        clearDraft();
        return;
      }
      const ok = saveDraft(draft);
      setSaveState({ ok, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [editing, html, settings, drafts]);

  useEffect(() => {
    if (restored && hasDraftContent(restored)) toast.info(t("newPage.restored"));
  }, [restored, t]);

  function addQuestion(kind: QuestionKind) {
    questions.setDrafts([...questions.drafts, emptyQuestion(kind)]);
    window.setTimeout(() => questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function addPicked(picked: PickedQuiz) {
    questions.setDrafts([...questions.drafts, ...picked.drafts]);
    setAdded((current) => [...current.filter((entry) => entry.quizId !== picked.quizId), { quizId: picked.quizId, title: picked.title, keys: picked.drafts.map((draft) => draft.key) }]);
    toast.success(t("picker.addedToast", { count: picked.drafts.length }));
    setTab("write");
    window.setTimeout(() => questionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function removePicked(quizId: string) {
    const entry = added.find((value) => value.quizId === quizId);
    if (!entry) return;
    questions.setDrafts(questions.drafts.filter((draft) => !entry.keys.includes(draft.key)));
    setAdded((current) => current.filter((value) => value.quizId !== quizId));
  }

  function save() {
    setAsked(true);
    const groupMissing = !settings.group;
    const dateInvalid = !inBank && new Date(`${settings.date}T${settings.time || "23:59"}`).getTime() <= Date.now();
    setDateBad(dateInvalid);
    if (groupMissing || dateInvalid || empty) {
      toast.error(empty ? t("newPage.errors.empty") : t("newPage.errors.banner"));
      return;
    }
    if (googleFormUrlInvalid(settings.googleFormUrl)) {
      toast.error(t("form.googleFormInvalid"));
      return;
    }
    if (!questions.validate()) {
      toast.error(t("questions.fixIssues"));
      return;
    }
    const form: AssignmentFormInput = {
      questions: questions.payload(),
      courseId: inBank ? "" : settings.group,
      title: richTitle(html, questions.drafts[0]?.text.slice(0, 80) ?? "", ) || t("newPage.untitled"),
      description: "",
      body: html,
      ...(inBank ? {} : { dueAt: `${settings.date}T${settings.time || "23:59"}`, status: "active" as const, announceInChat: settings.announce }),
      allowLate: true,
      aiCheck: settings.aiCheck,
      voice,
      grading: settings.grading,
      googleFormUrl: settings.googleFormUrl.trim(),
    };
    const request = item ? update.mutateAsync({ id: item.id, form }) : create.mutateAsync(form);
    void request.then(() => {
      clearDraft();
      navigate(item ? ROUTES.teacher.homeworkItem(item.id) : ROUTES.teacher.homework);
    });
  }

  const pending = create.isPending || update.isPending;
  const backTo = item ? ROUTES.teacher.homeworkItem(item.id) : ROUTES.teacher.homework;

  return (
    <WorkspaceShell
      eyebrow={t("newPage.eyebrow")}
      title={editing ? t("newPage.editTitle") : t("newPage.title")}
      action={
        <>
          <button type="button" className={workspaceGhostAction} onClick={() => navigate(backTo)}>
            <Icon name="arrow-back" size={18} />
            {t("newPage.back")}
          </button>
          <button
            type="button"
            className="flex h-11 shrink-0 items-center justify-center rounded-full bg-brand px-6 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-40"
            disabled={pending}
            onClick={save}
          >
            {inBank ? t("bank.save") : t("newPage.save")}
          </button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 border-b border-line">
          <div role="tablist" className="flex gap-1">
            {(["write", "pick"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-button transition-colors ${
                  tab === value ? "border-brand text-ink" : "border-transparent text-ink-secondary hover:text-ink"
                }`}
                onClick={() => setTab(value)}
              >
                <Icon name={value === "write" ? "assignment" : "menu-book"} size={18} />
                {t(`newPage.tabs.${value}`)}
                {value === "pick" && questions.drafts.length ? (
                  <span className="rounded-full bg-brand px-2 text-caption leading-5 text-ink-inverse">{questions.drafts.length}</span>
                ) : null}
              </button>
            ))}
          </div>
          <small className="ml-auto pb-1 text-body-xs text-ink-tertiary">
            {editing
              ? ""
              : saveState
                ? saveState.ok
                  ? t("newPage.savedAt", { time: saveState.time })
                  : t("newPage.saveFailed")
                : t("newPage.autosave")}
          </small>
        </div>

        {asked && empty ? (
          <p className="flex items-center gap-2.5 rounded-md bg-danger-bg px-4 py-3 text-body-sm text-danger">
            <Icon name="error" size={18} className="shrink-0" />
            {t("newPage.errors.empty")}
          </p>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div hidden={tab !== "write"} className="flex flex-col gap-5">
              <RichEditor
                initialHtml={html}
                onChange={setHtml}
                uploadImage={(file) => homeworkApi.uploadImage(file)}
                onAddQuestion={addQuestion}
              />
              <VoiceNoteField existing={item?.voice ?? null} value={voice} onChange={setVoice} disabled={pending} />
              <div ref={questionsRef}>
                <QuestionsEditor value={questions.drafts} onChange={questions.setDrafts} locked={questions.locked} showIssues={questions.showIssues} />
              </div>
            </div>
            {tab === "pick" ? <HomeworkTestPicker added={added} onAdd={addPicked} onRemove={removePicked} /> : null}
          </div>
          <HomeworkSettingsPanel
            value={settings}
            onChange={(patch) => {
              if ("date" in patch || "time" in patch) setDateBad(false);
              setSettings((current) => ({ ...current, ...patch }));
            }}
            groups={groups}
            groupLocked={editing}
            invalid={invalid}
            today={today}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}
