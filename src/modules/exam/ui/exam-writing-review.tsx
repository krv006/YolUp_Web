import { useState } from "react";
import { Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/legacy";
import type { ExamStudentResultDetail } from "@/shared/types";
import { useApproveAiBand, useExamStudentResult, useStartAiReview } from "../model/exam.queries";

export interface ExamWritingReviewProps {
  examId: string;
  studentId: string;
}

export function ExamWritingReview({ examId, studentId }: ExamWritingReviewProps) {
  const { t } = useTranslation("exam");
  const detail = useExamStudentResult(examId, studentId);
  const start = useStartAiReview(examId);
  const approve = useApproveAiBand(examId);
  const [band, setBand] = useState("");

  if (detail.isLoading) return <p className="exam-result-loading">{t("result.loading")}</p>;
  if (!detail.data) return null;

  const result: ExamStudentResultDetail = detail.data;
  const ai = result.ai;

  return (
    <div className="exam-writing-review">
      {result.manualAnswers.length ? (
        <div className="exam-writing-answers">
          <span className="exam-writing-head">{t("ai.essays")}</span>
          {result.manualAnswers.map((answer, index) => (
            <article key={`${answer.section}-${index}`}>
              <small>{answer.question}</small>
              <p>{answer.answer}</p>
            </article>
          ))}
        </div>
      ) : null}

      {!ai ? (
        <div className="exam-writing-empty">
          <p>{t("ai.notStarted")}</p>
          <Button size="sm" loading={start.isPending} onClick={() => start.mutate(studentId)}>
            <Sparkles size={15} /> {t("ai.start")}
          </Button>
        </div>
      ) : null}

      {ai?.status === "running" ? (
        <p className="exam-writing-status">
          <Loader2 size={15} className="exam-spin" /> {t("ai.running")}
        </p>
      ) : null}

      {ai?.status === "failed" ? (
        <div className="exam-writing-failed">
          <p>
            <TriangleAlert size={15} /> {ai.error || t("ai.failed")}
          </p>
          <Button size="sm" variant="secondary" loading={start.isPending} onClick={() => start.mutate(studentId)}>
            {t("ai.retry")}
          </Button>
        </div>
      ) : null}

      {ai && (ai.status === "proposed" || ai.status === "approved") ? (
        <div className="exam-writing-result">
          <div className="exam-writing-band">
            <strong>{ai.approvedBand ?? ai.proposedBand ?? ai.writingBand ?? "—"}</strong>
            <span>{ai.status === "approved" ? t("ai.approvedBand") : t("ai.proposedBand")}</span>
          </div>

          {ai.tasks.map((task) => (
            <div key={task.taskNumber} className="exam-writing-task">
              <div className="exam-writing-task-head">
                <strong>{t("ai.task", { number: task.taskNumber })}</strong>
                <span>{task.band ?? "—"}</span>
                {task.words !== null ? (
                  <small>{t("ai.words", { words: task.words, min: task.minWords ?? 0 })}</small>
                ) : null}
              </div>
              <div className="exam-writing-criteria">
                {task.criteria.map((criterion) => (
                  <span key={criterion.key}>
                    {t(`ai.criteria.${criterion.key}`)}: <b>{criterion.score ?? "—"}</b>
                  </span>
                ))}
              </div>
              {task.strengths.length ? (
                <p className="exam-writing-strengths">{task.strengths.join(" · ")}</p>
              ) : null}
              {task.weaknesses.length ? (
                <p className="exam-writing-weaknesses">{task.weaknesses.join(" · ")}</p>
              ) : null}
              {task.corrections.length ? (
                <ul className="exam-writing-corrections">
                  {task.corrections.map((correction, index) => (
                    <li key={index}>
                      <s>{correction.original}</s> → <b>{correction.corrected}</b>
                      {correction.explanation ? <small>{correction.explanation}</small> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              {task.feedback ? <p className="exam-writing-feedback">{task.feedback}</p> : null}
            </div>
          ))}

          {ai.overallComment ? <p className="exam-writing-feedback">{ai.overallComment}</p> : null}
          {ai.recommendations.length ? (
            <ul className="exam-writing-recommendations">
              {ai.recommendations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : null}

          {ai.status === "proposed" ? (
            <div className="exam-writing-actions">
              <input
                type="number"
                step={0.5}
                min={0}
                max={9}
                value={band}
                placeholder={String(ai.proposedBand ?? "")}
                onChange={(event) => setBand(event.target.value)}
                aria-label={t("ai.bandLabel")}
              />
              <Button
                size="sm"
                loading={approve.isPending}
                onClick={() =>
                  approve.mutate({
                    studentId,
                    band: band.trim() ? Number(band) : undefined,
                  })
                }
              >
                {band.trim() ? t("ai.approveWithBand") : t("ai.approve")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
