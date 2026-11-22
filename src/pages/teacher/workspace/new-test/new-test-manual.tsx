import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  QUESTION_TYPE_ORDER,
  cloneDraft,
  createBlankDrafts,
  createDraft,
  draftStatus,
  draftToFormValues,
  insertAfter,
  insertDraft,
  moveDraft,
  retypeDrafts,
  summarizeDrafts,
  useCreateQuiz,
  type DraftError,
  type QuestionDraft,
} from "@/modules/quiz";
import type { QuizDetail, QuizQuestionType } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { TestQuestionCard } from "../test-question-card";
import { CARD, FIELD, LABEL, PRIMARY_BUTTON, SECONDARY_BUTTON, SELECT } from "./styles";

const MAX_QUESTIONS = 100;

let counter = 0;
const newKey = () => `m${(counter += 1)}`;

export interface ManualStart {
  name: string;
  count: number;
  type: QuizQuestionType;
}

function clampCount(value: number): number {
  return Math.max(1, Math.min(MAX_QUESTIONS, Math.round(value) || 10));
}

/** «Qo'lda yozish» boshi: nom, savollar soni va umumiy tur. */
export function ManualStartCard({ onStart }: { onStart: (start: ManualStart) => void }) {
  const { t } = useTranslation("quiz");
  const [name, setName] = useState("");
  const [count, setCount] = useState("10");
  const [type, setType] = useState<QuizQuestionType>("single");

  return (
    <section className={CARD}>
      <h2 className="text-title text-ink">{t("newPage.manual.settings")}</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t("newPage.manual.name")}</span>
          <input
            className={FIELD}
            value={name}
            placeholder={t("newPage.manual.namePlaceholder")}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>{t("newPage.manual.count")}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-md bg-subtle text-ink transition-colors hover:bg-muted"
              aria-label="-"
              onClick={() => setCount(String(clampCount(Number(count) - 1)))}
            >
              <Icon name="remove" size={18} />
            </button>
            <input
              className={`${FIELD} text-center`}
              inputMode="numeric"
              value={count}
              aria-label={t("newPage.manual.count")}
              onChange={(event) => setCount(event.target.value.replace(/\D/g, "").slice(0, 3))}
              onBlur={() => setCount(String(clampCount(Number(count))))}
            />
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-md bg-subtle text-ink transition-colors hover:bg-muted"
              aria-label="+"
              onClick={() => setCount(String(clampCount(Number(count) + 1)))}
            >
              <Icon name="add" size={18} />
            </button>
          </div>
          <small className="text-body-xs text-ink-tertiary">{t("newPage.manual.countHint")}</small>
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className={LABEL}>{t("newPage.manual.type")}</span>
        <select className={SELECT} value={type} onChange={(event) => setType(event.target.value as QuizQuestionType)}>
          {QUESTION_TYPE_ORDER.map((item) => (
            <option key={item} value={item}>
              {t(`types.${item}`)}
              {item === "single" ? " (A, B, C, D)" : ""}
            </option>
          ))}
        </select>
        <small className="text-body-xs text-ink-tertiary">
          {t(`newPage.manual.typeHints.${type}`)} {t(`newPage.manual.typeExamples.${type}`)}
        </small>
        <small className="text-body-xs text-ink-tertiary">{t("newPage.manual.typeHint")}</small>
      </label>

      <button
        type="button"
        className={`${PRIMARY_BUTTON} self-start`}
        onClick={() => onStart({ name: name.trim(), count: clampCount(Number(count)), type })}
      >
        {t("newPage.manual.start")}
      </button>
    </section>
  );
}

type Banner =
  | { kind: "retype"; type: QuizQuestionType; changed: number }
  | { kind: "undo" }
  | { kind: "leave" }
  | { kind: "partial"; indexes: number[] }
  | { kind: "empty"; indexes: number[] }
  | { kind: "none" };

export interface ManualEditorProps {
  start: ManualStart;
  onBack: () => void;
  onCreated: (quiz: QuizDetail) => void;
}

/** Katta sahifa: N ta tayyor savol shabloni, umumiy tur, har savol alohida turda, rasm, ko'chirish va nusxa. */
export function ManualEditor({ start, onBack, onCreated }: ManualEditorProps) {
  const { t } = useTranslation("quiz");
  const create = useCreateQuiz();
  const [name, setName] = useState(start.name);
  const [globalType, setGlobalType] = useState<QuizQuestionType>(start.type);
  const [drafts, setDrafts] = useState<QuestionDraft[]>(() => createBlankDrafts(start.count, start.type, newKey));
  const [banner, setBanner] = useState<Banner>({ kind: "none" });
  const removed = useRef<{ draft: QuestionDraft; index: number } | null>(null);
  const [dirty, setDirty] = useState(false);

  const summary = useMemo(() => summarizeDrafts(drafts), [drafts]);
  const total = drafts.length;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function touch(next: (current: QuestionDraft[]) => QuestionDraft[]) {
    setDrafts(next);
    setDirty(true);
    setBanner((current) => (current.kind === "partial" || current.kind === "empty" ? { kind: "none" } : current));
  }

  function patch(key: string, apply: (draft: QuestionDraft) => QuestionDraft) {
    touch((current) => current.map((draft) => (draft.key === key ? apply(draft) : draft)));
  }

  function focusQuestion(key: string) {
    window.setTimeout(() => {
      const card = document.getElementById(`q-${key}`);
      card?.scrollIntoView({ block: "center", behavior: "smooth" });
      card?.querySelector("textarea")?.focus({ preventScroll: true });
    }, 30);
  }

  function addAt(index: number) {
    const draft = createDraft(globalType, newKey);
    touch((current) => insertDraft(current, index, draft));
    focusQuestion(draft.key);
  }

  function duplicate(key: string) {
    const source = drafts.find((draft) => draft.key === key);
    if (!source) return;
    const copy = cloneDraft(source, newKey);
    touch((current) => insertAfter(current, key, copy));
    focusQuestion(copy.key);
  }

  function remove(key: string) {
    const index = drafts.findIndex((draft) => draft.key === key);
    if (index < 0) return;
    removed.current = { draft: drafts[index], index };
    touch((current) => {
      const next = current.filter((draft) => draft.key !== key);
      return next.length ? next : [createDraft(globalType, newKey)];
    });
    setBanner({ kind: "undo" });
  }

  function undo() {
    const last = removed.current;
    if (!last) return;
    removed.current = null;
    touch((current) => insertDraft(current, last.index, last.draft));
    setBanner({ kind: "none" });
  }

  function changeGlobalType(type: QuizQuestionType) {
    setGlobalType(type);
    const result = retypeDrafts(drafts, type, newKey);
    touch(() => result.drafts);
    setBanner({ kind: "retype", type, changed: result.changed });
  }

  function retypeAll() {
    touch((current) => retypeDrafts(current, globalType, newKey, true).drafts);
    setBanner({ kind: "none" });
  }

  function jump(index: number) {
    const draft = drafts[index];
    if (draft) focusQuestion(draft.key);
  }

  function submit(dropEmpty = false) {
    const states = drafts.map(draftStatus);
    const partial = states.flatMap((item, index) => (item.state === "partial" ? [index] : []));
    const empty = states.flatMap((item, index) => (item.state === "empty" ? [index] : []));
    if (partial.length) {
      setBanner({ kind: "partial", indexes: partial });
      jump(partial[0]);
      return;
    }
    if (empty.length === drafts.length) {
      setBanner({ kind: "empty", indexes: [] });
      return;
    }
    if (empty.length && !dropEmpty) {
      setBanner({ kind: "empty", indexes: empty });
      jump(empty[0]);
      return;
    }
    const ready = drafts.filter((_, index) => states[index].state === "ready");
    const title = name.trim() || t("newPage.manual.defaultName");
    create.mutate(
      {
        courseId: "",
        status: "draft",
        lessonId: null,
        title,
        topic: title,
        description: "",
        dueAt: null,
        opensAt: null,
        groups: [],
        questions: ready.map((draft) => draftToFormValues(draft)),
      },
      {
        onSuccess: (quiz) => {
          setDirty(false);
          onCreated(quiz);
        },
      }
    );
  }

  function reasonOf(error: DraftError | null): string {
    return error ? t(`createDialog.validation.${error}`, { syntax: "{{…}}" }) : "";
  }

  const bannerNode = (() => {
    switch (banner.kind) {
      case "retype":
        return (
          <Notice>
            <span className="min-w-0 flex-1">
              {t("newPage.manual.retypeNote", { type: t(`types.${banner.type}`), count: banner.changed })}
            </span>
            {drafts.some((draft) => draft.type !== banner.type) ? (
              <button type="button" className={SECONDARY_BUTTON} onClick={retypeAll}>
                {t("newPage.manual.retypeAll")}
              </button>
            ) : null}
          </Notice>
        );
      case "undo":
        return (
          <Notice>
            <span className="min-w-0 flex-1">{t("newPage.manual.deleted")}</span>
            <button type="button" className={SECONDARY_BUTTON} onClick={undo}>
              {t("newPage.manual.undo")}
            </button>
          </Notice>
        );
      case "leave":
        return (
          <Notice tone="warning">
            <span className="min-w-0 flex-1">{t("newPage.manual.leaveConfirm")}</span>
            <button type="button" className={SECONDARY_BUTTON} onClick={onBack}>
              {t("newPage.manual.leave")}
            </button>
            <button type="button" className={PRIMARY_BUTTON} onClick={() => setBanner({ kind: "none" })}>
              {t("newPage.manual.stay")}
            </button>
          </Notice>
        );
      case "partial":
        return (
          <Notice tone="warning">
            <span className="min-w-0 flex-1">
              {t("newPage.manual.incompleteList", { count: banner.indexes.length })}{" "}
              <NumberLinks indexes={banner.indexes} onJump={jump} />
            </span>
          </Notice>
        );
      case "empty":
        return (
          <Notice tone="warning">
            <span className="min-w-0 flex-1">
              {banner.indexes.length ? (
                <>
                  {t("newPage.manual.emptyList", { count: banner.indexes.length })}{" "}
                  <NumberLinks indexes={banner.indexes} onJump={jump} />
                </>
              ) : (
                t("newPage.manual.noQuestions")
              )}
            </span>
            {banner.indexes.length ? (
              <button type="button" className={SECONDARY_BUTTON} onClick={() => submit(true)}>
                {t("newPage.manual.saveWithoutEmpty")}
              </button>
            ) : null}
          </Notice>
        );
      default:
        return null;
    }
  })();

  const insertButton = (index: number) => (
    <button
      type="button"
      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-body-xs text-ink-tertiary opacity-60 transition hover:bg-subtle hover:text-brand hover:opacity-100 focus-visible:opacity-100"
      onClick={() => addAt(index)}
    >
      <Icon name="add" size={14} /> {t("newPage.manual.insertHere")}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-2 flex flex-col gap-3 rounded-xl bg-surface/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={SECONDARY_BUTTON}
            onClick={() => (dirty ? setBanner({ kind: "leave" }) : onBack())}
          >
            <Icon name="arrow-back" size={18} /> {t("newPage.manual.back")}
          </button>
          <input
            className={`${FIELD} min-w-56 flex-1 font-medium`}
            value={name}
            placeholder={t("newPage.manual.namePlaceholder")}
            aria-label={t("newPage.manual.name")}
            onChange={(event) => {
              setName(event.target.value);
              setDirty(true);
            }}
          />
          <span className="shrink-0 text-body-sm text-ink-secondary">
            {t("newPage.manual.progress", { ready: summary.ready, total })}
          </span>
          <button type="button" className={PRIMARY_BUTTON} disabled={create.isPending} onClick={() => submit()}>
            {t("newPage.manual.save")}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2.5">
            <span className={`${LABEL} whitespace-nowrap`}>{t("newPage.manual.globalType")}</span>
            <select
              className={`${SELECT} h-10 w-auto min-w-56`}
              value={globalType}
              onChange={(event) => changeGlobalType(event.target.value as QuizQuestionType)}
            >
              {QUESTION_TYPE_ORDER.map((item) => (
                <option key={item} value={item}>
                  {t(`types.${item}`)}
                  {item === "single" ? " (A, B, C, D)" : ""}
                </option>
              ))}
            </select>
          </label>
          <small className="min-w-0 flex-1 text-body-xs text-ink-tertiary">{t("newPage.manual.globalTypeHint")}</small>
        </div>

        {bannerNode}
      </div>

      <div className="flex flex-col">
        {insertButton(0)}
        {drafts.map((draft, index) => {
          const status = draftStatus(draft);
          return (
            <div key={draft.key} className="flex flex-col">
              <div id={`q-${draft.key}`} className="scroll-mt-52">
                <TestQuestionCard
                  draft={draft}
                  index={index}
                  newKey={newKey}
                  onFocus={() => undefined}
                  onChange={(apply) => patch(draft.key, apply)}
                  onRemove={() => remove(draft.key)}
                  badge={<StateChip state={status.state} />}
                  footer={
                    <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
                      {status.state === "partial" ? (
                        <small className="min-w-0 flex-1 text-body-xs text-warning-fg">
                          {t("newPage.manual.missing", { reason: reasonOf(status.error) })}
                        </small>
                      ) : (
                        <span className="flex-1" />
                      )}
                      <MiniButton
                        label={t("newPage.manual.moveUp")}
                        icon="expand-less"
                        disabled={index === 0}
                        onClick={() => touch((current) => moveDraft(current, draft.key, -1))}
                      />
                      <MiniButton
                        label={t("newPage.manual.moveDown")}
                        icon="expand-more"
                        disabled={index === drafts.length - 1}
                        onClick={() => touch((current) => moveDraft(current, draft.key, 1))}
                      />
                      <MiniButton
                        label={t("newPage.manual.duplicate")}
                        icon="content-copy"
                        onClick={() => duplicate(draft.key)}
                      />
                    </div>
                  }
                />
              </div>
              {insertButton(index + 1)}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pb-8">
        <button type="button" className={PRIMARY_BUTTON} onClick={() => addAt(drafts.length)}>
          <Icon name="add" size={18} /> {t("newPage.manual.addQuestion")}
        </button>
      </div>
    </div>
  );
}

function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warning" }) {
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-3 rounded-md px-4 py-2.5 text-body-sm ${
        tone === "warning" ? "bg-warning-bg text-warning-fg" : "bg-subtle text-ink-secondary"
      }`}
    >
      {children}
    </div>
  );
}

function NumberLinks({ indexes, onJump }: { indexes: number[]; onJump: (index: number) => void }) {
  return (
    <>
      {indexes.map((index, position) => (
        <span key={index}>
          <button type="button" className="font-semibold underline" onClick={() => onJump(index)}>
            {index + 1}
          </button>
          {position < indexes.length - 1 ? ", " : ""}
        </span>
      ))}
    </>
  );
}

function StateChip({ state }: { state: "empty" | "partial" | "ready" }) {
  const { t } = useTranslation("quiz");
  const tone =
    state === "ready"
      ? "bg-success-bg text-success-text"
      : state === "partial"
        ? "bg-warning-bg text-warning-fg"
        : "bg-subtle text-ink-tertiary";
  return <span className={`rounded-full px-2 py-0.5 text-caption-strong ${tone}`}>{t(`newPage.manual.state.${state}`)}</span>;
}

function MiniButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-label text-ink-secondary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
