import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type ReactNode } from "react";
import { CheckCircle2, Coffee, Flag, LogOut, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import { QuestionAnswerInput, QuestionPrompt, emptyAnswer, type QuizAttemptAnswerInput } from "@/modules/quiz";
import type { ExamCurrent, ExamCurrentItem, QuizAnswerValue, QuizQuestion } from "@/shared/types";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { useFinishExam, useNextExamSection, useRecordExamFocus, useSaveExamAnswers } from "../model/exam.queries";
import { toast } from "sonner";
import { useExamResults } from "../model/exam.queries";
import { ExamListeningPlayer } from "./exam-listening-player";
import { ExamQuestionNav } from "./exam-question-nav";
import { ExamGroupPanel } from "./exam-question-group";
import { ExamResultCard } from "./exam-result-card";
import { ExamReview } from "./exam-review";
import { ExamTimer } from "./exam-timer";

const AUTOSAVE_MS = 10_000;

const flagsKey = (examId: string, sectionKey: string) => `exam-flags:${examId}:${sectionKey}`;

function loadFlags(examId: string, sectionKey: string): Set<string> {
  try {
    const raw = globalThis.localStorage.getItem(flagsKey(examId, sectionKey));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export interface ExamRunnerProps {
  examId: string;
  title: string;
  current: ExamCurrent;
  onRefresh: () => void;
  onExit: () => void;
}

export function ExamRunner({ examId, title, current, onRefresh, onExit }: ExamRunnerProps) {
  const { t } = useTranslation("exam");
  const item = current.item;
  const save = useSaveExamAnswers(examId);
  const finish = useFinishExam(examId);
  const recordFocus = useRecordExamFocus(examId);
  const nextSection = useNextExamSection(examId);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>(item?.savedAnswers ?? {});
  const [finishOpen, setFinishOpen] = useState(false);
  const [nextOpen, setNextOpen] = useState(false);
  const dirtyRef = useRef(false);
  const answersRef = useRef(answers);
  const runnerRef = useRef<HTMLDivElement>(null);
  const [flagged, setFlagged] = useState<Set<string>>(() => loadFlags(examId, item?.key ?? ""));

  const questions = useMemo(() => item?.questions ?? [], [item]);
  const sectionKey = item?.key ?? "";

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Yopishqoq sarlavha balandligi: matn paneli shuning ostida yopishib turadi
  useEffect(() => {
    const root = runnerRef.current;
    const head = root?.querySelector<HTMLElement>(".exam-runner-head");
    if (!root || !head) return undefined;
    const apply = () => root.style.setProperty("--exam-head", `${head.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(head);
    return () => observer.disconnect();
  }, [sectionKey, item?.kind]);

  // Halollik: imtihon davomida boshqa oynaga o'tish qayd etiladi (o'qituvchi natijada ko'radi)
  const awayRef = useRef(false);
  const running = item?.kind === "section";
  useEffect(() => {
    if (!running) return undefined;
    function away() {
      if (awayRef.current) return;
      awayRef.current = true;
      recordFocus.mutate("blur");
    }
    function back() {
      awayRef.current = false;
    }
    function visibility() {
      if (document.hidden) away();
      else back();
    }
    window.addEventListener("blur", away);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", away);
      window.removeEventListener("focus", back);
      document.removeEventListener("visibilitychange", visibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, examId]);

  // Insho maydoniga tashqaridan nusxa qo'yish mumkin emas (AI yozgan matn kiritilmasligi uchun); urinish qayd etiladi
  function guardPaste(event: ClipboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest(".quiz-answer-essay")) {
      event.preventDefault();
      recordFocus.mutate("paste");
      toast.error(t("runner.pasteBlocked"));
    }
  }

  function toggleFlag(questionId: string) {
    setFlagged((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      try {
        globalThis.localStorage.setItem(flagsKey(examId, sectionKey), JSON.stringify([...next]));
      } catch {
        /* xotira o'chirilgan bo'lsa ham belgilash sahifada ishlayveradi */
      }
      return next;
    });
  }

  function jumpTo(questionId: string) {
    document.getElementById(`exam-q-${questionId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function payload(): QuizAttemptAnswerInput[] {
    return questions
      .filter((question) => answersRef.current[question.id])
      .map((question) => ({ questionId: question.id, answer: answersRef.current[question.id] }));
  }

  function flush() {
    if (!dirtyRef.current || !questions.length) return;
    dirtyRef.current = false;
    save.mutate(payload());
  }

  useEffect(() => {
    if (!questions.length) return undefined;
    const timer = globalThis.setInterval(flush, AUTOSAVE_MS);
    return () => {
      globalThis.clearInterval(timer);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey, questions.length]);

  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question.id]).length,
    [answers, questions]
  );

  function answerChanged(question: QuizQuestion, value: QuizAnswerValue) {
    dirtyRef.current = true;
    setAnswers((current) => ({ ...current, [question.id]: value }));
  }

  async function goNext() {
    // avval javoblar saqlanadi, keyin server bo'limni yopadi
    if (dirtyRef.current && questions.length) {
      dirtyRef.current = false;
      try {
        await save.mutateAsync(payload());
      } catch {
        dirtyRef.current = true;
        return;
      }
    }
    try {
      await nextSection.mutateAsync();
      setNextOpen(false);
      onRefresh();
    } catch {
      /* xato xabari mutatsiyada ko'rsatiladi */
    }
  }

  function sectionExpired() {
    flush();
    onRefresh();
  }

  if (!item) {
    return (
      <div className="exam-runner-state">
        <CheckCircle2 size={28} />
        <p>{current.state === "upcoming" ? t("runner.notStarted") : t("runner.finished")}</p>
        {current.state === "upcoming" ? null : <ExamOwnResult examId={examId} />}
        <Button variant="secondary" onClick={onExit}>
          {t("runner.exit")}
        </Button>
      </div>
    );
  }

  if (item.kind === "break") {
    return (
      <div className="exam-runner">
        <ExamRunnerHeader
          title={title}
          item={item}
          answered={null}
          total={null}
          onFinish={() => setFinishOpen(true)}
          onNext={current.next ? () => setNextOpen(true) : undefined}
          onExpire={sectionExpired}
        />
        <div className="exam-runner-break">
          <Coffee size={30} />
          <h2>{item.title || t("runner.breakTitle")}</h2>
          <p>{t("runner.breakHint")}</p>
          {current.next ? <small>{t("runner.nextItem", { title: current.next.title })}</small> : null}
        </div>
      </div>
    );
  }

  const grouped = groupQuestions(item);

  return (
    <div className="exam-runner" ref={runnerRef} onPasteCapture={guardPaste}>
      <ExamRunnerHeader
        title={title}
        item={item}
        answered={answeredCount}
        total={questions.length}
        onFinish={() => setFinishOpen(true)}
        onNext={current.next ? () => setNextOpen(true) : undefined}
        onExpire={sectionExpired}
        player={<ExamListeningPlayer key={item.key} examId={examId} groups={item.groups} />}
        nav={<ExamQuestionNav questions={questions} answers={answers} flagged={flagged} onJump={jumpTo} />}
      />

      <div className="exam-runner-body">
        {grouped.map((block) => (
          <section key={block.group?.id ?? "plain"} className={`exam-runner-block ${block.group?.passage ? "has-passage" : ""}`}>
            {block.group ? (
              <ExamGroupPanel group={block.group} />
            ) : null}
            <div className="exam-runner-questions">
              {block.questions.map((question) => (
                <article
                  key={question.id}
                  id={`exam-q-${question.id}`}
                  className={`quiz-attempt-question ${flagged.has(question.id) ? "is-flagged" : ""}`}
                >
                  <div className="quiz-attempt-question-head">
                    <span>{t("runner.questionNumber", { number: question.order + 1 })}</span>
                    <span className="exam-q-tools">
                      <button
                        type="button"
                        className={`exam-flag ${flagged.has(question.id) ? "is-on" : ""}`}
                        aria-pressed={flagged.has(question.id)}
                        onClick={() => toggleFlag(question.id)}
                      >
                        <Flag size={13} /> {flagged.has(question.id) ? t("runner.unflag") : t("runner.flag")}
                      </button>
                      <b>{t("runner.points", { count: question.points })}</b>
                    </span>
                  </div>
                  <QuestionPrompt question={question} />
                  <QuestionAnswerInput
                    question={question}
                    number={question.order + 1}
                    value={answers[question.id] ?? emptyAnswer(question)}
                    onChange={(value) => answerChanged(question, value)}
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={nextOpen} onOpenChange={setNextOpen}>
        {nextOpen && current.next ? (
          <DialogContent
            title={t("runner.nextTitle")}
            description={t("runner.nextDescription", { title: current.next.title })}
          >
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setNextOpen(false)}>
                {t("runner.cancel")}
              </Button>
              <Button loading={nextSection.isPending || save.isPending} onClick={() => void goNext()}>
                {t("runner.nextConfirm")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        {finishOpen ? (
          <DialogContent title={t("runner.finishTitle")} description={t("runner.finishDescription")}>
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setFinishOpen(false)}>
                {t("runner.cancel")}
              </Button>
              <Button
                loading={finish.isPending}
                onClick={() => {
                  flush();
                  finish.mutateAsync().then(() => {
                    setFinishOpen(false);
                    onRefresh();
                  });
                }}
              >
                {t("runner.finishConfirm")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function ExamRunnerHeader({
  title,
  item,
  answered,
  total,
  onFinish,
  onNext,
  onExpire,
  player = null,
  nav = null,
}: {
  title: string;
  item: ExamCurrentItem;
  answered: number | null;
  total: number | null;
  onFinish: () => void;
  onNext?: () => void;
  onExpire: () => void;
  player?: ReactNode;
  nav?: ReactNode;
}) {
  const { t } = useTranslation("exam");
  return (
    <header className="exam-runner-head">
      <div>
        <span className="exam-runner-eyebrow">{title}</span>
        <h1>{item.title}</h1>
        {answered !== null && total !== null ? (
          <p>{t("runner.answered", { answered, total })}</p>
        ) : null}
        {item.kind === "section" ? <small className="exam-runner-notice">{t("runner.integrityNotice")}</small> : null}
      </div>
      <div className="exam-runner-head-actions">
        <ExamTimer key={item.endsAt} deadline={item.endsAt} label={t("runner.timeLeft")} onExpire={onExpire} />
        {onNext ? (
          <Button variant="secondary" onClick={onNext}>
            <SkipForward size={16} /> {t("runner.next")}
          </Button>
        ) : null}
        <Button variant="secondary" onClick={onFinish}>
          <LogOut size={16} /> {t("runner.finish")}
        </Button>
      </div>
      {player}
      {nav}
    </header>
  );
}

function groupQuestions(item: ExamCurrentItem) {
  const blocks: Array<{ group: ExamCurrentItem["groups"][number] | null; questions: QuizQuestion[] }> = [];
  const byGroup = new Map<string, QuizQuestion[]>();
  const plain: QuizQuestion[] = [];

  for (const question of item.questions) {
    const groupId = question.groupId;
    if (!groupId) {
      plain.push(question);
      continue;
    }
    const list = byGroup.get(groupId) ?? [];
    list.push(question);
    byGroup.set(groupId, list);
  }

  for (const group of item.groups) {
    const questions = byGroup.get(group.id);
    if (questions?.length) blocks.push({ group, questions });
  }
  if (plain.length) blocks.push({ group: null, questions: plain });
  return blocks;
}

function ExamOwnResult({ examId }: { examId: string }) {
  const { t } = useTranslation("exam");
  const results = useExamResults(examId);

  if (results.isLoading) return <p className="exam-result-loading">{t("result.loading")}</p>;
  if (results.data?.hidden) return <p className="exam-result-loading">{t("result.hidden")}</p>;

  const own = results.data?.results?.[0];
  if (!own) return null;
  return (
    <>
      <ExamResultCard result={own} />
      {own.participated && results.data?.state === "finished" ? (
        <details className="exam-review-toggle">
          <summary>{t("review.show")}</summary>
          <ExamReview examId={examId} studentId={own.studentId} />
        </details>
      ) : null}
    </>
  );
}
