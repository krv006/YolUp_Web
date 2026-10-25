import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { boardApi, BoardPanel, BoardStroke, useBoard, useSendBoardToChat } from "@/modules/board";
import { useLesson } from "@/modules/lesson";
import { LoadingFallback } from "@/shared/ui/legacy";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import { LiveRoomState } from "@/widgets/live-room";

export function BoardPage() {
  const { t } = useTranslation("board");
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = useLesson(lessonId ?? null);
  const board = useBoard(lessonId ?? "", { live: false, enabled: Boolean(lessonId) });
  const sendToChat = useSendBoardToChat(lessonId ?? "");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(0);

  if (lesson.isLoading || (!lesson.isError && !lesson.data))
    return <LoadingFallback label={t("page.loading")} />;

  if (lesson.isError)
    return (
      <LiveRoomState
        title={t("page.notFound")}
        description={lesson.error?.message}
        actionLabel={t("status.retry")}
        onAction={() => lesson.refetch()}
        secondaryLabel={t("page.back")}
        onSecondary={() => navigate(-1)}
      />
    );

  const data = lesson.data!;
  const state = board.data ?? null;
  const sheets = state?.sheets ?? [];

  async function downloadPdf() {
    setBusy(true);
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
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell
      eyebrow={`${data.courseTitle} · ${data.date}, ${data.time} · ${t("page.sheetCount", {
        count: sheets.length,
      })}${state?.canDraw ? "" : ` · ${t("status.viewOnly").toLowerCase()}`}`}
      title={t("page.boardTitle", { title: data.title })}
      action={
        <button
          type="button"
          className={workspaceAction}
          disabled={sendToChat.isPending}
          onClick={() =>
            sendToChat.mutate(undefined, {
              onSuccess: () => toast.success(t("page.sentToChat")),
            })
          }
        >
          {t("page.sendToChat")}
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex min-h-150 min-w-0 flex-col">
          <BoardPanel
            lessonId={data.id}
            courseId={data.courseId}
            sheetIndex={sheet}
            onSheetChange={setSheet}
            hideSheetBar
            statusNote={data.status === "finished" ? t("page.lessonFinished") : undefined}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {sheets.map((item) => {
            const current = item.index === sheet;
            return (
              <button
                key={item.index}
                type="button"
                className={`flex flex-col gap-2 rounded-lg bg-surface p-3 text-left transition-colors ${
                  current ? "ring-2 ring-brand" : "hover:bg-subtle"
                }`}
                onClick={() => setSheet(item.index)}
              >
                <small className="text-body-xs text-ink-tertiary">{item.index + 1}</small>
                <svg
                  viewBox={`0 0 ${state?.width ?? 1040} ${state?.height ?? 700}`}
                  className="block h-full w-full"
                  style={{ aspectRatio: `${state?.width ?? 1040} / ${state?.height ?? 700}` }}
                  aria-hidden="true"
                >
                  {item.strokes.map((stroke) => (
                    <BoardStroke
                      key={stroke.id}
                      stroke={stroke}
                      selected={false}
                      onSelect={() => undefined}
                    />
                  ))}
                </svg>
              </button>
            );
          })}

          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full border border-line bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle disabled:opacity-60"
            disabled={busy}
            onClick={downloadPdf}
          >
            {t("page.downloadPdf")}
          </button>
        </div>
      </div>
    </WorkspaceShell>
  );
}
