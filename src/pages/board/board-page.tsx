import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { boardApi, BoardPanel, BoardStroke, MobileBoardPageNav, useBoard, useSendBoardToChat } from "@/modules/board";
import { useLesson } from "@/modules/lesson";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger, LoadingFallback } from "@/shared/ui/legacy";
import { WorkspaceShell, workspaceAction } from "@/widgets/workspace-shell";
import { LiveRoomState } from "@/widgets/live-room";

export function BoardPage() {
  const { t } = useTranslation("board");
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
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

  function share() {
    sendToChat.mutate(undefined, { onSuccess: () => toast.success(t("page.sentToChat")) });
  }

  if (isCompact) {
    const editable = Boolean(state?.canDraw);
    const day = new Date(`${data.date}T00:00`);
    const dateLabel = Number.isNaN(day.getTime())
      ? data.date
      : `${day.getDate()}-${(months[day.getMonth()] ?? "").toLowerCase()}`;
    return (
      <div
        data-theme="light"
        className={`flex h-full min-h-0 flex-col bg-subtle px-3 pt-5 font-body text-ink ${editable ? "pb-[26px]" : "pb-[49px]"}`}
      >
        <BoardPanel
          lessonId={data.id}
          courseId={data.courseId}
          sheetIndex={sheet}
          onSheetChange={setSheet}
          mobile={{
            title: editable ? undefined : data.title,
            subtitle: editable
              ? `${data.courseTitle} · ${t("mobile.liveLesson")}`
              : [data.courseTitle, `${dateLabel}, ${data.time}`, t("page.sheetCount", { count: sheets.length })].join(" · "),
            live: editable && data.status === "live",
            backLabel: t("page.back"),
            onBack: () => navigate(-1),
            action: editable ? undefined : (
              <Dropdown>
                <DropdownTrigger asChild>
                  <button
                    type="button"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
                    aria-label={t("mobile.menu")}
                  >
                    <Icon name="more" size={20} />
                  </button>
                </DropdownTrigger>
                <DropdownContent align="end">
                  <DropdownItem disabled={busy} onSelect={() => void downloadPdf()}>
                    {t("page.downloadPdf")}
                  </DropdownItem>
                  <DropdownItem disabled={sendToChat.isPending} onSelect={share}>
                    {t("page.sendToChat")}
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            ),
            footer: editable ? undefined : (
              <div className="flex flex-col items-center pt-3">
                <MobileBoardPageNav
                  className="h-[60px]"
                  page={sheet + 1}
                  total={Math.max(1, sheets.length)}
                  onPrev={() => setSheet(Math.max(0, sheet - 1))}
                  onNext={() => setSheet(Math.min(sheets.length - 1, sheet + 1))}
                  onPages={() => undefined}
                />
                <div className="-mt-px grid w-full grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex h-13 items-center justify-center rounded-full border border-line-strong bg-surface text-title font-semibold text-ink disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void downloadPdf()}
                  >
                    {t("page.downloadPdf")}
                  </button>
                  <button
                    type="button"
                    className="flex h-13 items-center justify-center rounded-full bg-brand text-title font-semibold text-on-action disabled:opacity-50"
                    disabled={sendToChat.isPending}
                    onClick={share}
                  >
                    {t("page.sendToChat")}
                  </button>
                </div>
              </div>
            ),
          }}
        />
      </div>
    );
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
          onClick={share}
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
