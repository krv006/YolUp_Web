import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Coffee, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { QuestionAnswerInput, QuestionPrompt, emptyAnswer, type QuizAttemptAnswerInput } from "@/modules/quiz";
import type { ExamCurrent, ExamCurrentItem, QuizAnswerValue, QuizQuestion } from "@/shared/types";
import { Button, Dialog, DialogContent } from "@/shared/ui/legacy";
import { useFinishExam, useSaveExamAnswers } from "../model/exam.queries";
import { useExamResults } from "../model/exam.queries";
import { ExamGroupPanel, type ExamAudioState } from "./exam-question-group";
import { ExamResultCard } from "./exam-result-card";
import { ExamTimer } from "./exam-timer";

const AUTOSAVE_MS = 10_000;

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
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>(item?.savedAnswers ?? {});
  const [audioStates, setAudioStates] = useState<Record<string, ExamAudioState>>({});
  const [finishOpen, setFinishOpen] = useState(false);
  const dirtyRef = useRef(false);
  const answersRef = useRef(answers);

  const questions = useMemo(() => item?.questions ?? [], [item]);
  const sectionKey = item?.key ?? "";

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

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
    <div className="exam-runner">
      <ExamRunnerHeader
        title={title}
        item={item}
        answered={answeredCount}
        total={questions.length}
        onFinish={() => setFinishOpen(true)}
        onExpire={sectionExpired}
      />

      <div className="exam-runner-body">
        {grouped.map((block) => (
          <section key={block.group?.id ?? "plain"} className="exam-runner-block">
            {block.group ? (
              <ExamGroupPanel
                group={block.group}
                audioState={audioStates[block.group.id] ?? "idle"}
                onAudioState={(state) =>
                  setAudioStates((current) => ({ ...current, [block.group?.id ?? ""]: state }))
                }
              />
            ) : null}
            <div className="exam-runner-questions">
              {block.questions.map((question) => (
                <article key={question.id} className="quiz-attempt-question">
                  <div className="quiz-attempt-question-head">
                    <span>{t("runner.questionNumber", { number: question.order + 1 })}</span>
                    <b>{t("runner.points", { count: question.points })}</b>
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
  onExpire,
}: {
  title: string;
  item: ExamCurrentItem;
  answered: number | null;
  total: number | null;
  onFinish: () => void;
  onExpire: () => void;
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
      </div>
      <div className="exam-runner-head-actions">
        <ExamTimer key={item.endsAt} deadline={item.endsAt} label={t("runner.timeLeft")} onExpire={onExpire} />
        <Button variant="secondary" onClick={onFinish}>
          <LogOut size={16} /> {t("runner.finish")}
        </Button>
      </div>
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
  return <ExamResultCard result={own} />;
}
