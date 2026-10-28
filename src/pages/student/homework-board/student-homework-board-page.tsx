import { useState } from "react";
import { ArrowLeft, CheckCircle2, Cloud, CloudOff, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { BoardPanel } from "@/modules/board";
import {
  useAssignment,
  useHomeworkBoard,
  useHomeworkBoardSource,
  useSubmitHomeworkBoard,
  type HomeworkBoardSaveState,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import { sanitizeHtml } from "@/shared/lib";
import type { Assignment } from "@/shared/types";
import { Button, Dialog, DialogContent, LoadingFallback, RouteState } from "@/shared/ui/legacy";

type BoardData = NonNullable<ReturnType<typeof useHomeworkBoard>["data"]>;

/** O'quvchi vazifani fayl yuklamasdan dars doskasining o'zida yechadi; "Topshirish" doskani PDF qilib yuboradi. */
export function StudentHomeworkBoardPage() {
  const { t } = useTranslation("homework");
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const assignment = useAssignment(assignmentId ?? null);
  const board = useHomeworkBoard(assignmentId ?? null);

  if (assignment.isLoading || board.isLoading) return <LoadingFallback label={t("board.loading")} />;
  if (assignment.isError || board.isError || !assignment.data || !board.data)
    return (
      <RouteState
        eyebrow={t("board.eyebrow")}
        title={t("board.loadError")}
        description={(assignment.error ?? board.error)?.message}
        actionLabel={t("board.back")}
        onAction={() => navigate(-1)}
      />
    );

  return <HomeworkBoardScreen assignment={assignment.data} board={board.data} onBack={() => navigate(-1)} onSubmitted={() => navigate(ROUTES.student.homeworkItem(assignment.data.id), { replace: true })} />;
}

function HomeworkBoardScreen({
  assignment,
  board,
  onBack,
  onSubmitted,
}: {
  assignment: Assignment;
  board: BoardData;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const { t } = useTranslation("homework");
  const { source, saveState, flush } = useHomeworkBoardSource(assignment.id, board);
  const submit = useSubmitHomeworkBoard();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const html = assignment.body ? sanitizeHtml(assignment.body) : "";

  async function send() {
    if (!(await flush())) return;
    submit.mutate(assignment.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        onSubmitted();
      },
      onError: () => setConfirmOpen(false),
    });
  }

  return (
    <div className="portal-page homework-board-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{t("board.eyebrow")}</span>
          <h1>{assignment.title}</h1>
          <p>{assignment.courseTitle}</p>
        </div>
        <div className="heading-actions">
          <SaveBadge state={saveState} />
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft size={16} /> {t("board.back")}
          </Button>
          <Button onClick={() => setConfirmOpen(true)} loading={submit.isPending}>
            <Send size={16} /> {t("board.submit")}
          </Button>
        </div>
      </div>

      {assignment.description || html ? (
        <section className="portal-card homework-board-task">
          <h2>{t("board.task")}</h2>
          {assignment.description ? <p>{assignment.description}</p> : null}
          {html ? <div className="homework-board-task-body" dangerouslySetInnerHTML={{ __html: html }} /> : null}
        </section>
      ) : null}

      <section className="portal-card board-page-canvas">
        <BoardPanel lessonId="" courseId={null} source={source} />
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        {confirmOpen ? (
          <DialogContent title={t("board.confirmTitle")} description={t("board.confirmDescription")}>
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                {t("board.cancel")}
              </Button>
              <Button loading={submit.isPending} onClick={() => void send()}>
                <CheckCircle2 size={16} /> {t("board.confirm")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function SaveBadge({ state }: { state: HomeworkBoardSaveState }) {
  const { t } = useTranslation("homework");
  return (
    <span className={`homework-board-save is-${state}`}>
      {state === "error" ? <CloudOff size={15} /> : <Cloud size={15} />}
      {t(`board.save.${state}`)}
    </span>
  );
}
