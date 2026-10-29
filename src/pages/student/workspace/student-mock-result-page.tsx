import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentUser, useUpdateSettingsMutation } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import {
  useExam,
  useExamMistakesPractice,
  useExamResultPdf,
  useExamResults,
  useExamStudentResult,
} from "@/modules/exam";
import { PracticeSession } from "@/modules/tutor";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { downloadBlob } from "@/shared/lib";
import type { ExamSectionResult, ExamWritingAiItem, PracticeSet } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { MobileActionBar, MobileEmptyCard, MobilePageHeader } from "@/shared/ui/mobile-page";
import { WorkspaceShell, workspaceGhostAction } from "@/widgets/workspace-shell";
import { shortDate } from "../lib/format";

function band(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : Number.isInteger(value) ? value.toFixed(1) : String(value);
}

function sectionValue(section: ExamSectionResult): string {
  if (section.score !== null) return band(section.score);
  if (section.percent !== null) return `${Math.round(section.percent)}%`;
  return "—";
}

function sectionShare(section: ExamSectionResult): number {
  if (section.score !== null && section.scaleMax) return (section.score / section.scaleMax) * 100;
  return section.percent ?? 0;
}

function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join("");
}

export function StudentMockResultPage() {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { examId = "" } = useParams();
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const me = useCurrentUser();
  const exam = useExam(examId || null);
  const result = useExamStudentResult(examId || null, me?.id ?? null);
  const group = useExamResults(examId || null);
  const conversations = useConversations("student");
  const pdf = useExamResultPdf();
  const mistakes = useExamMistakesPractice(examId);
  const settings = useUpdateSettingsMutation();
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null);
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState("");

  const data = result.data;
  const ready = Boolean(data?.participated && (data.total || data.sections.length));
  const others = (group.data?.results ?? []).map((row) => row.total?.score ?? null).filter((value): value is number => value !== null);
  const groupAvg = others.length > 1 ? Math.round((others.reduce((sum, value) => sum + value, 0) / others.length) * 2) / 2 : null;
  const essay = data?.manualAnswers.find((answer) => answer.answer.trim().split(/\s+/).length > 30) ?? null;
  const essayWords = essay ? essay.answer.trim().split(/\s+/).length : 0;
  const ai: ExamWritingAiItem | null = data?.writingAi?.status === "done" ? (data.writingAi.items.at(-1) ?? null) : null;
  const date = data?.finishedAt ?? exam.data?.startsAt ?? null;
  const room = conversations.data?.find((item) => item.courseId === exam.data?.courseId);

  const askTeacher = () => navigate(room ? ROUTES.student.chat(room.id) : ROUTES.student.chats);
  const practice = () =>
    mistakes.mutate(undefined, {
      onSuccess: (set) => setPracticeSet(set),
    });
  const downloadPdf = () => {
    if (!me) return;
    pdf.mutate(
      { examId, studentId: me.id },
      { onSuccess: (blob) => downloadBlob(blob, `${exam.data?.title || "natija"}.pdf`) }
    );
  };
  const groupAverage = group.data?.groupAverage ?? null;
  const target = me?.targetBand ?? null;

  function openTarget() {
    setTargetDraft(target === null ? "" : String(target));
    setTargetOpen(true);
  }

  function saveTarget() {
    const value = targetDraft.trim() ? Number(targetDraft.replace(",", ".")) : null;
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1600)) {
      toast.error(t("workspace.mockResult.targetInvalid"));
      return;
    }
    settings.mutate(
      { target_band: value },
      {
        onSuccess: () => setTargetOpen(false),
        onError: (error) => toast.error(error.message),
      }
    );
  }

  const stats = [
    { id: "overall", value: data?.total?.label || band(data?.total?.score), tone: "text-ink" },
    {
      id: "group",
      value: groupAverage !== null ? `${Math.round(groupAverage)}%` : band(groupAvg),
      tone: "text-brand",
    },
    { id: "target", value: band(target), tone: "text-success-fg", onClick: openTarget },
  ];

  const main = data ? (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) =>
          stat.onClick ? (
            <button
              key={stat.id}
              type="button"
              className="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 text-left transition-colors hover:bg-subtle lg:px-[18px]"
              onClick={stat.onClick}
            >
              <small className="flex items-center gap-1 truncate text-caption text-ink-secondary lg:text-body-xs">
                {t(`workspace.mockResult.stats.${stat.id}`)}
                <Icon name="edit" size={14} className="shrink-0 text-icon-secondary" />
              </small>
              <strong className={`truncate font-heading text-[26px]/9 font-semibold lg:text-[32px]/10 ${stat.tone}`}>{stat.value}</strong>
            </button>
          ) : (
            <div key={stat.id} className="flex min-w-0 flex-col gap-1 rounded-2xl bg-surface p-4 lg:px-[18px]">
              <small className="truncate text-caption text-ink-secondary lg:text-body-xs">{t(`workspace.mockResult.stats.${stat.id}`)}</small>
              <strong className={`truncate font-heading text-[26px]/9 font-semibold lg:text-[32px]/10 ${stat.tone}`}>{stat.value}</strong>
            </div>
          )
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4 lg:px-[18px]">
        <strong className="text-title-lg font-semibold text-ink">{t("workspace.mockResult.sections")}</strong>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
          {data.sections.map((section) => (
            <span key={section.key} className="flex min-w-0 flex-col gap-1">
              <small className="truncate text-body-xs text-ink-secondary">{section.title}</small>
              <strong className="font-heading text-[22px]/7 font-semibold text-ink">{sectionValue(section)}</strong>
              <span className="h-[5px] overflow-hidden rounded-full bg-subtle">
                <span className="block h-full rounded-full bg-brand" style={{ width: `${sectionShare(section)}%` }} />
              </span>
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col rounded-2xl bg-surface px-4 pt-4 pb-2 lg:px-[18px]">
        <strong className="pb-2 text-title-lg font-semibold text-ink">{t("workspace.mockResult.details")}</strong>
        {data.sections.map((section) => (
          <span key={section.key} className="flex min-h-[67px] items-center gap-3 border-t border-line py-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title font-medium text-ink">{section.title}</strong>
              <small className="truncate text-caption text-ink-secondary">
                {section.manual
                  ? data.pending.includes(section.key)
                    ? t("workspace.mockResult.pending")
                    : t("workspace.mockResult.manual")
                  : section.earned !== null && section.max !== null
                    ? t("workspace.mockResult.correct", { earned: section.earned, max: section.max })
                    : ""}
              </small>
            </span>
            <span className="flex h-[30px] shrink-0 items-center rounded-full bg-brand-subtle px-2.5 text-title font-semibold text-brand">
              {sectionValue(section)}
            </span>
          </span>
        ))}
      </section>
    </div>
  ) : null;

  const side = data ? (
    <div className="flex min-w-0 flex-col gap-5">
      {essay ? (
        <section className="flex flex-col gap-2 rounded-2xl bg-surface p-4 lg:px-[18px]">
          <span className="flex items-center gap-3">
            <strong className="min-w-0 flex-1 truncate text-title font-semibold text-ink">
              {t("workspace.mockResult.essay", { title: essay.question || essay.section })}
            </strong>
            <span className="flex h-6 shrink-0 items-center rounded-full bg-subtle px-2 text-caption-strong text-ink">
              {t("workspace.mockResult.words", { count: ai?.wordCount ?? essayWords })}
            </span>
          </span>
          <p className="line-clamp-3 text-body-xs text-ink">“{essay.answer.trim()}”</p>
        </section>
      ) : null}

      {data.writingAi ? (
        <section className="flex flex-col gap-3.5 rounded-2xl bg-surface/60 p-4 lg:px-[18px]">
          {ai ? (
            <>
              <span className="flex items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand font-heading text-[20px] font-semibold text-ink-inverse">
                  {band(ai.overallBand)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-body-sm font-semibold text-brand">{t("workspace.mockResult.aiTitle")}</strong>
                  <small className="truncate text-caption text-ink-secondary">
                    {ai.criteria.map((criterion) => `${initials(criterion.title) || criterion.key} ${band(criterion.band)}`).join(" · ")}
                  </small>
                </span>
              </span>
              <p className="text-body-xs text-ink">
                {[
                  ai.errors.length
                    ? t("workspace.mockResult.mistakes", {
                        value: ai.errors
                          .slice(0, 2)
                          .map((error) => (error.correction ? `“${error.quote}” → “${error.correction}”` : error.issue))
                          .join(", "),
                      })
                    : "",
                  ai.strengths.length ? t("workspace.mockResult.strengths", { value: ai.strengths.slice(0, 2).join(", ") }) : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            </>
          ) : (
            <p className="text-body-sm text-ink-secondary">{t("workspace.mockResult.aiQueued")}</p>
          )}
        </section>
      ) : null}

      {isCompact ? null : (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            className="flex h-[42px] items-center justify-center rounded-full border border-line-strong bg-surface text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
            onClick={askTeacher}
          >
            {t("workspace.mockResult.askTeacher")}
          </button>
          <button
            type="button"
            className="flex h-[42px] items-center justify-center rounded-full bg-brand text-body-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-strong disabled:opacity-60"
            disabled={mistakes.isPending}
            onClick={practice}
          >
            {t("workspace.mockResult.practice")}
          </button>
        </div>
      )}
    </div>
  ) : null;

  const dialogs = (
    <>
      <AppDialog
        open={Boolean(practiceSet)}
        onOpenChange={(open) => !open && setPracticeSet(null)}
        variant="panel"
        width="lg:w-[560px]"
        title={t("workspace.mockResult.practiceTitle")}
        description={exam.data?.title ?? ""}
      >
        {practiceSet ? (
          <PracticeSession
            key={practiceSet.questions.map((question) => question.text).join("|")}
            set={practiceSet}
            restarting={mistakes.isPending}
            onRestart={practice}
          />
        ) : null}
      </AppDialog>
      <AppDialog
        open={targetOpen}
        onOpenChange={setTargetOpen}
        variant={isCompact ? "adaptive" : "confirm"}
        width="lg:w-120"
        title={t("workspace.mockResult.targetTitle")}
        description={t("workspace.mockResult.targetHint")}
        footer={
          <>
            <button type="button" className={dialogButton.secondary} onClick={() => setTargetOpen(false)}>
              {t("workspace.mockResult.targetCancel")}
            </button>
            <button type="button" className={dialogButton.primary} disabled={settings.isPending} onClick={saveTarget}>
              {t("workspace.mockResult.targetSave")}
            </button>
          </>
        }
      >
        <input
          className="h-13 w-full rounded-md border border-transparent bg-subtle px-4 text-body text-ink outline-none placeholder:text-ink-tertiary focus:border-focus focus:bg-surface"
          inputMode="decimal"
          autoFocus
          value={targetDraft}
          placeholder={t("workspace.mockResult.targetPlaceholder")}
          aria-label={t("workspace.mockResult.targetTitle")}
          onChange={(event) => setTargetDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && saveTarget()}
        />
      </AppDialog>
    </>
  );

  const pending = result.isLoading || exam.isLoading;
  const content = pending ? (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <i key={index} className="h-[93px] rounded-2xl bg-surface" />
        ))}
      </div>
      <i className="h-32 rounded-2xl bg-surface" />
      <i className="h-64 rounded-2xl bg-surface" />
    </div>
  ) : !ready ? (
    <MobileEmptyCard
      icon="emoji-events"
      title={t("workspace.mockResult.notReady")}
      description={t("workspace.mockResult.notReadyHint")}
    />
  ) : null;

  if (isCompact)
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
          <MobilePageHeader
            title={exam.data?.title ?? ""}
            backLabel={t("workspace.back")}
            onBack={() => navigate(ROUTES.student.mockExams)}
            action={
              ready ? (
                <button
                  type="button"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink disabled:opacity-60"
                  aria-label={t("workspace.mockResult.pdf")}
                  disabled={pdf.isPending}
                  onClick={downloadPdf}
                >
                  <Icon name="download" size={22} />
                </button>
              ) : undefined
            }
          />
          {content ?? (
            <>
              {main}
              {side}
            </>
          )}
        </div>
        {ready ? (
          <MobileActionBar>
            <button
              type="button"
              className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full border border-line-strong bg-surface px-3 text-body-sm font-semibold text-ink"
              onClick={askTeacher}
            >
              {t("workspace.mockResult.askTeacher")}
            </button>
            <button
              type="button"
              className="flex h-13 min-w-0 flex-1 items-center justify-center rounded-full bg-brand px-3 text-body-sm font-semibold text-on-action disabled:opacity-60"
              disabled={mistakes.isPending}
              onClick={practice}
            >
              {t("workspace.mockResult.practice")}
            </button>
          </MobileActionBar>
        ) : null}
        {dialogs}
      </div>
    );

  return (
    <WorkspaceShell
      eyebrow={t("workspace.mockResult.eyebrow", { date: date ? shortDate(date, months) : "—" })}
      title={exam.data?.title ?? ""}
      action={
        ready ? (
          <button
            type="button"
            className={`${workspaceGhostAction} border-transparent text-brand`}
            disabled={pdf.isPending}
            onClick={downloadPdf}
          >
            {t("workspace.mockResult.pdf")}
          </button>
        ) : null
      }
    >
      {content ?? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          {main}
          {side}
        </div>
      )}
      {dialogs}
    </WorkspaceShell>
  );
}
