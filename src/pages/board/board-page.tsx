import { useState } from "react";
import { ArrowLeft, Download, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { boardApi, BoardPanel, useSendBoardToChat } from "@/modules/board";
import { useLesson } from "@/modules/lesson";
import { LoadingFallback } from "@/shared/ui/legacy";
import { LiveRoomState } from "@/widgets/live-room";

export function BoardPage() {
  const { t } = useTranslation("board");
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = useLesson(lessonId ?? null);
  const sendToChat = useSendBoardToChat(lessonId ?? "");
  const [busy, setBusy] = useState<"pdf" | null>(null);

  if (lesson.isLoading || (!lesson.isError && !lesson.data))
    return <LoadingFallback label={t("page.loading")} />;

  if (lesson.isError)
    return (
      <LiveRoomState
        title={t("page.notFound")}
        description={lesson.error?.message}
        actionLabel={t("status.retry")}
        onAction={() => lesson.refetch()}
        onBack={() => navigate(-1)}
      />
    );

  const data = lesson.data!;

  async function downloadPdf() {
    setBusy("pdf");
    try {
      const blob = await boardApi.downloadPdf(data.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.title}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("page.pdfFailed"));
    } finally {
      setBusy(null);
    }
  }

  const action =
    "flex h-11 items-center gap-2 rounded-full px-5 text-label-strong transition-colors disabled:opacity-60";

  return (
    <div
      data-theme="dark"
      className="dark flex h-dvh min-h-0 flex-col overflow-hidden bg-canvas text-ink"
    >
      <header className="flex shrink-0 items-center gap-3 px-5 pt-4 pb-3">
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
          aria-label={t("page.back")}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="flex min-w-0 items-center gap-2 font-heading text-title text-ink">
            <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
            <span className="truncate">{data.title}</span>
          </strong>
          <small className="truncate text-caption text-ink-tertiary">
            {data.courseTitle} · {data.date} · {data.time}
          </small>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        <BoardPanel
          lessonId={data.id}
          courseId={data.courseId}
          statusNote={data.status === "finished" ? t("page.lessonFinished") : undefined}
          footerActions={
            <>
              <button
                type="button"
                className={`${action} border border-line bg-surface text-ink hover:bg-muted`}
                disabled={busy !== null || sendToChat.isPending}
                onClick={() =>
                  sendToChat.mutate(undefined, {
                    onSuccess: () => toast.success(t("page.sentToChat")),
                  })
                }
              >
                <Send size={16} /> {t("page.sendToChat")}
              </button>
              <button
                type="button"
                className={`${action} bg-action text-on-action hover:bg-action-hover`}
                disabled={busy !== null}
                onClick={downloadPdf}
              >
                <Download size={16} /> {t("page.downloadPdf")}
              </button>
            </>
          }
        />
      </div>
    </div>
  );
}
