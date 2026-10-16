import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Cloud, CloudOff, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { HomeworkBoardEditor, type StrokeDto } from "@/modules/board";
import {
  useAssignment,
  useHomeworkBoard,
  useSaveHomeworkBoard,
  useSolveHomeworkBoard,
  useSubmitHomeworkBoard,
} from "@/modules/homework";
import { sanitizeHtml } from "@/shared/lib";
import { Button, Dialog, DialogContent, LoadingFallback, RouteState } from "@/shared/ui/legacy";

const AUTOSAVE_MS = 1500;

type SaveState = "saved" | "saving" | "error";

/** O'quvchi vazifani fayl yuklamasdan, to'liq funksiyali doskada yechadi; "Topshirish" doskani PDF qilib yuboradi. */
export function StudentHomeworkBoardPage() {
  const { t } = useTranslation("homework");
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const assignment = useAssignment(assignmentId ?? null);
  const board = useHomeworkBoard(assignmentId ?? null);
  const save = useSaveHomeworkBoard(assignmentId ?? "");
  const solve = useSolveHomeworkBoard(assignmentId ?? "");
  const submit = useSubmitHomeworkBoard();
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pending = useRef<StrokeDto[][] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function flush(): Promise<boolean> {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const sheets = pending.current;
    if (!sheets) return true;
    pending.current = null;
    setSaveState("saving");
    try {
      await save.mutateAsync(sheets);
      setSaveState(pending.current ? "saving" : "saved");
      return true;
    } catch {
      pending.current = pending.current ?? sheets; // qayta uriniladi
      setSaveState("error");
      return false;
    }
  }

  function changed(sheets: StrokeDto[][]) {
    pending.current = sheets;
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
  }

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      void flush(); // sahifadan chiqqanda oxirgi o'zgarishlar yo'qolmasin
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send() {
    if (!(await flush()) || !assignmentId) return;
    submit.mutate(assignmentId, {
      onSuccess: () => {
        setConfirmOpen(false);
        navigate("/student/chats");
      },
      onError: () => setConfirmOpen(false),
    });
  }

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

  const task = assignment.data;
  const html = task.body ? sanitizeHtml(task.body) : "";

  return (
    <div className="portal-page homework-board-page">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{t("board.eyebrow")}</span>
          <h1>{task.title}</h1>
          <p>{task.courseTitle}</p>
        </div>
        <div className="heading-actions">
          <span className={`homework-board-save is-${saveState}`}>
            {saveState === "saved" ? <Cloud size={15} /> : saveState === "error" ? <CloudOff size={15} /> : <Cloud size={15} />}
            {t(`board.save.${saveState}`)}
          </span>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> {t("board.back")}
          </Button>
          <Button onClick={() => setConfirmOpen(true)} loading={submit.isPending}>
            <Send size={16} /> {t("board.submit")}
          </Button>
        </div>
      </div>

      {task.description || html ? (
        <section className="portal-card homework-board-task">
          <h2>{t("board.task")}</h2>
          {task.description ? <p>{task.description}</p> : null}
          {html ? <div className="homework-board-task-body" dangerouslySetInnerHTML={{ __html: html }} /> : null}
        </section>
      ) : null}

      <section className="portal-card board-page-canvas">
        <HomeworkBoardEditor
          initialSheets={board.data.sheets}
          width={board.data.width}
          height={board.data.height}
          mathEnabled={board.data.mathEnabled}
          chemistryEnabled={board.data.chemistryEnabled}
          onChange={changed}
          onSolve={(expression) => solve.mutateAsync(expression)}
        />
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        {confirmOpen ? (
          <DialogContent title={t("board.confirmTitle")} description={t("board.confirmDescription")}>
            <div className="dialog-actions">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                {t("board.cancel")}
              </Button>
              <Button loading={submit.isPending || save.isPending} onClick={() => void send()}>
                <CheckCircle2 size={16} /> {t("board.confirm")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
