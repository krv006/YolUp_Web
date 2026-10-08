import { useState } from "react";
import { UserRoundX } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ExamDetail, ExamStudentResult } from "@/shared/types";
import { Avatar, Button } from "@/shared/ui/legacy";
import { useExamResults, useSaveManualScores } from "../model/exam.queries";
import { ExamWritingReview } from "./exam-writing-review";

export interface ExamResultsViewProps {
  exam: ExamDetail;
}

export function ExamResultsView({ exam }: ExamResultsViewProps) {
  const { t } = useTranslation("exam");
  const results = useExamResults(exam.id);

  if (results.isLoading) return <p className="exam-result-loading">{t("result.loading")}</p>;
  if (results.isError) return <p className="exam-result-loading">{t("result.loadError")}</p>;

  const list = results.data?.results ?? [];
  if (!list.length) return <p className="exam-result-loading">{t("result.noStudents")}</p>;

  return (
    <div className="exam-results">
      {list.map((result) => (
        <ExamResultRow key={result.studentId} exam={exam} result={result} />
      ))}
    </div>
  );
}

function ExamResultRow({ exam, result }: { exam: ExamDetail; result: ExamStudentResult }) {
  const { t } = useTranslation("exam");
  const save = useSaveManualScores(exam.id);
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      result.sections
        .filter((section) => section.manual)
        .map((section) => [section.key, section.score === null ? "" : String(section.score)])
    )
  );

  const manualSections = result.sections.filter((section) => section.manual);
  const [reviewOpen, setReviewOpen] = useState(false);
  const total = result.total;

  function submitScores() {
    const payload: Record<string, number> = {};
    for (const [key, value] of Object.entries(scores)) {
      if (!value.trim()) continue;
      const score = Number(value);
      if (Number.isFinite(score)) payload[key] = score;
    }
    save.mutateAsync({ studentId: result.studentId, scores: payload }).then(() => setOpen(false));
  }

  return (
    <article className={`exam-result-row ${result.participated ? "" : "is-absent"}`}>
      <Avatar name={result.studentName} size="sm" />
      <div className="exam-result-row-main">
        <strong>{result.studentName || result.username}</strong>
        <small>
          {result.participated ? (
            <>
              {result.sections
                .map((section) =>
                  section.score !== null
                    ? `${section.title}: ${section.score}`
                    : section.percent !== null
                      ? `${section.title}: ${Math.round(section.percent)}%`
                      : `${section.title}: ${t("result.pendingShort")}`
                )
                .join(" · ")}
            </>
          ) : (
            <span className="exam-result-absent">
              <UserRoundX size={14} /> {t("result.absent")}
            </span>
          )}
        </small>
      </div>

      <div className="exam-result-row-total">
        {total && total.score !== null ? (
          <>
            <strong>
              {total.score}
              {total.max ? <small>/{total.max}</small> : null}
            </strong>
            {total.range ? (
              <small>{t("result.range", { from: total.range[0], to: total.range[1] })}</small>
            ) : null}
            {total.level ? <small>{total.level}</small> : null}
            {result.approximate ? <small>{t("result.approximate")}</small> : null}
          </>
        ) : result.participated ? (
          <small>{t("result.waitingTeacher")}</small>
        ) : null}
      </div>

      {manualSections.length && result.participated ? (
        <div className="exam-result-row-manual">
          {open ? (
            <>
              {manualSections.map((section) => (
                <label key={section.key} className="exam-template-minutes">
                  <span>{section.title}</span>
                  <input
                    type="number"
                    step={exam.engine === "ielts" ? 0.5 : 1}
                    min={0}
                    max={exam.engine === "ielts" ? 9 : 100}
                    value={scores[section.key] ?? ""}
                    onChange={(event) =>
                      setScores((current) => ({ ...current, [section.key]: event.target.value }))
                    }
                  />
                </label>
              ))}
              <Button size="sm" loading={save.isPending} onClick={submitScores}>
                {t("result.saveScores")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                {t("result.cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
                {t("result.manualScores")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setReviewOpen((current) => !current)}>
                {reviewOpen ? t("writing.hide") : t("writing.show")}
              </Button>
            </>
          )}
        </div>
      ) : null}
      {reviewOpen ? (
        <div className="exam-result-row-review">
          <ExamWritingReview examId={exam.id} studentId={result.studentId} />
        </div>
      ) : null}
    </article>
  );
}
