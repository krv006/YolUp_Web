import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  QuestionAnswerInput,
  QuestionPrompt,
  QuizExportDialog,
  QuizImportDialog,
  createDraft,
  draftToFormValues,
  draftToStudentQuestion,
  questionToDraft,
  quizDisplayTitle,
  useExportQuiz,
  usePublishQuiz,
  useQuiz,
  useQuizAttempts,
  useUpdateQuiz,
  type QuestionDraft,
} from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import type { QuizAnswerValue, QuizQuestionType } from "@/shared/types";
import { TestQuestionCard } from "./test-question-card";
import { QuestionTypeDialog } from "./question-type-dialog";
import { UnsavedChangesDialog } from "./unsaved-changes-dialog";

let counter = 0;
const newKey = () => `k${(counter += 1)}`;

export function TestEditorPage() {
  const { t } = useTranslation("quiz");
  const { quizId = null } = useParams();
  const navigate = useNavigate();
  const quiz = useQuiz(quizId);
  const attempts = useQuizAttempts(quizId, Boolean(quizId));
  const update = useUpdateQuiz();
  const publish = usePublishQuiz();
  const exportQuiz = useExportQuiz();

  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [dirty, setDirty] = useState(0);
  const [typeOpen, setTypeOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, QuizAnswerValue>>({});
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const detail = quiz.data ?? null;

  if (detail && loadedId !== detail.id) {
    setLoadedId(detail.id);
    setDrafts(detail.questions.map((question) => questionToDraft(question, newKey)));
    setActiveKey(null);
    setDirty(0);
  }

  const locked = (attempts.data ?? []).length > 0;
  const active = drafts.find((draft) => draft.key === activeKey) ?? drafts[0] ?? null;
  const activeIndex = active ? drafts.findIndex((draft) => draft.key === active.key) : -1;

  function patch(key: string, apply: (draft: QuestionDraft) => QuestionDraft) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? apply(draft) : draft)));
    setDirty((value) => value + 1);
  }

  function addQuestion(type: QuizQuestionType) {
    const draft = createDraft(type, newKey);
    setDrafts((current) => [...current, draft]);
    setActiveKey(draft.key);
    setDirty((value) => value + 1);
    setTypeOpen(false);
  }

  function save(asDraft: boolean) {
    if (!quizId) return;
    update.mutate(
      {
        id: quizId,
        values: {
          title: detail?.title ?? "",
          topic: detail?.topic ?? "",
          dueAt: detail?.dueAt ?? null,
          opensAt: detail?.opensAt ?? null,
          groups: [],
          ...(locked ? {} : { questions: drafts.map((draft) => draftToFormValues(draft, null)) }),
          ...(asDraft ? { status: "draft" as const } : {}),
        },
      },
      { onSuccess: () => setDirty(0) }
    );
  }

  function leave() {
    if (dirty > 0) {
      setLeaveOpen(true);
      return;
    }
    navigate(ROUTES.teacher.tests);
  }

  return (
    <div className="flex h-full min-h-0 bg-canvas">
      <aside className="flex h-full w-65 shrink-0 flex-col border-r border-line-subtle bg-surface">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <button
            type="button"
            className="grid size-8 shrink-0 place-items-center rounded-full text-icon transition-colors hover:bg-subtle"
            aria-label={t("editor.back")}
            onClick={leave}
          >
            <Icon name="arrow-back" size={20} />
          </button>
          <strong className="min-w-0 flex-1 truncate text-title text-ink">
            {t("editor.questions", { count: drafts.length })}
          </strong>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          {drafts.map((draft, index) => {
            const current = draft.key === active?.key;
            return (
              <button
                key={draft.key}
                type="button"
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                  current ? "bg-brand-subtle" : "hover:bg-subtle"
                }`}
                onClick={() => setActiveKey(draft.key)}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-md text-caption-strong ${
                    current ? "bg-brand text-ink-inverse" : "bg-subtle text-ink-secondary"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <small className="truncate text-caption text-ink-tertiary">
                    {t(`types.${draft.type}`)}
                  </small>
                  <small className="truncate text-body-xs text-ink">
                    {draft.text || t("editor.noText")}
                  </small>
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-button text-brand transition-colors hover:bg-subtle"
            disabled={locked}
            onClick={() => setTypeOpen(true)}
          >
            <Icon name="add" size={18} /> {t("editor.addQuestion")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6">
        <header className="flex shrink-0 flex-wrap items-center gap-3 pb-5">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <strong className="truncate font-heading text-h1 text-ink">
              {detail ? quizDisplayTitle(detail) : ""}
            </strong>
            <small className="truncate text-body-xs text-ink-tertiary">
              {detail?.subjectLabel ?? ""}
            </small>
          </span>

          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
            aria-label={t("exportDialog.title")}
            onClick={() => setExportOpen(true)}
          >
            <Icon name="download" size={18} />
          </button>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle"
            onClick={() => setImportOpen(true)}
          >
            {t("editor.import")}
          </button>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-50"
            disabled={update.isPending}
            onClick={() => save(true)}
          >
            {t("editor.saveDraft")}
          </button>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-50"
            disabled={publish.isPending || !quizId}
            onClick={() => {
              save(false);
              if (quizId) publish.mutate(quizId);
            }}
          >
            {t("editor.publish")}
          </button>
        </header>

        {locked ? (
          <p className="mb-5 flex shrink-0 items-start gap-2.5 rounded-md bg-warning-bg px-4 py-3.5 text-body-sm text-warning-fg">
            <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-warning" />
            {t("editor.lockedNotice")}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 pb-6">
          {drafts.map((draft, index) => (
            <TestQuestionCard
              key={draft.key}
              draft={draft}
              index={index}
              locked={locked}
              newKey={newKey}
              onFocus={() => setActiveKey(draft.key)}
              onChange={(apply) => patch(draft.key, apply)}
              onRemove={() => {
                setDrafts((current) => current.filter((item) => item.key !== draft.key));
                setDirty((value) => value + 1);
              }}
            />
          ))}
        </div>
      </div>

      <aside className="hidden h-full w-90 shrink-0 flex-col gap-3 bg-surface px-5 py-6 xl:flex">
        <span className="text-overline text-ink-tertiary uppercase">{t("editor.previewTitle")}</span>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-line p-5">
          {active ? (
            <>
              <small className="text-body-xs text-ink-tertiary">
                {t("editor.previewCounter", {
                  current: activeIndex + 1,
                  total: drafts.length,
                })}
              </small>
              <QuestionPrompt question={draftToStudentQuestion(active, activeIndex)} />
              <QuestionAnswerInput
                question={draftToStudentQuestion(active, activeIndex)}
                number={activeIndex + 1}
                value={preview[active.key]}
                onChange={(value) =>
                  setPreview((current) => ({ ...current, [active.key]: value }))
                }
              />
            </>
          ) : (
            <p className="text-body-sm text-ink-tertiary">{t("editor.previewEmpty")}</p>
          )}
        </div>
      </aside>

      <QuestionTypeDialog
        open={typeOpen}
        onOpenChange={setTypeOpen}
        onPick={addQuestion}
      />

      <QuizExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title={detail ? quizDisplayTitle(detail) : ""}
        pending={exportQuiz.isPending ? "pending" : null}
        onExport={(type, mode) => {
          if (!quizId || !detail) return;
          exportQuiz
            .mutateAsync({ id: quizId, type, mode, name: quizDisplayTitle(detail) })
            .then(() => setExportOpen(false));
        }}
      />

      <QuizImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        request={{ topic: detail?.topic ?? "", courseId: detail?.courseId ?? null }}
      />

      <UnsavedChangesDialog
        open={leaveOpen}
        count={dirty}
        onOpenChange={setLeaveOpen}
        onLeave={() => navigate(ROUTES.teacher.tests)}
      />
    </div>
  );
}
