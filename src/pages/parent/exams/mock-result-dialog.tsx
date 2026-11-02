import { useTranslation } from "react-i18next";
import { useExamResultPdf } from "@/modules/exam";
import { downloadBlob, parentResults } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import type { ExamStudentResult, ExamSummary } from "@/shared/types";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { band as formatBand, sectionIcon } from "./mock-styles";

const RADIUS = 46;

function sectionPercent(section: ExamStudentResult["sections"][number]): number {
  if (section.percent !== null) return section.percent;
  return section.score !== null ? Math.round((section.score / (section.scaleMax || 9)) * 100) : 0;
}
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MockResultDialog({
  exam,
  result,
  delta,
  groupAverage,
  childId,
  childName,
  childAvatar,
  onClose,
}: {
  exam: ExamSummary | null;
  result: ExamStudentResult | null;
  delta: number | null;
  groupAverage: number | null;
  childId: string;
  childName: string;
  childAvatar: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("parent");
  const compact = useIsCompact();
  const pdf = useExamResultPdf();
  const first = childName.split(" ")[0] || childName;
  const band = result?.total?.score ?? null;

  async function downloadPdf() {
    if (!exam) return;
    try {
      downloadBlob(`${exam.title}.pdf`, await pdf.mutateAsync({ examId: exam.id, studentId: childId }));
    } catch {
      return;
    }
  }

  return (
    <AppDialog
      open={Boolean(exam)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      variant={compact ? "sheet" : "confirm"}
      width="lg:w-180"
      icon={<Avatar name={childName} src={childAvatar ?? undefined} size="md" className="[&_.avatar]:size-12" />}
      title={exam ? t("mock.result.title", { name: first, exam: exam.title }) : ""}
      description={
        exam
          ? [formatLocalized(exam.startsAt, t("mock.result.datePattern")), t("mock.minutes", { count: exam.totalMinutes }), exam.courseTitle]
              .filter(Boolean)
              .join(" · ")
          : ""
      }
      titleClassName="font-heading text-[20px]/7 font-semibold"
      footerClassName="justify-end px-6 pt-5 pb-6"
      footer={
        <>
          <button
            type="button"
            className="flex h-13 flex-1 items-center justify-center rounded-full border border-line-strong bg-surface px-5 text-title-sm font-semibold text-ink transition-colors hover:bg-subtle lg:h-11 lg:flex-none lg:text-button"
            onClick={onClose}
          >
            {t("mock.result.close")}
          </button>
          {band !== null ? (
            <button
              type="button"
              className="flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-5 text-title-sm font-semibold text-on-action transition-colors hover:bg-brand-strong disabled:opacity-50 lg:h-11 lg:flex-none lg:text-button"
              disabled={pdf.isPending}
              onClick={() => void downloadPdf()}
            >
              <Icon name="download" size={18} />
              {t("mock.result.pdf")}
            </button>
          ) : null}
        </>
      }
    >
      {result ? <MockResultBody result={result} delta={delta} groupAverage={groupAverage} /> : null}
    </AppDialog>
  );
}

export function MockResultBody({
  result,
  delta,
  groupAverage,
}: {
  result: ExamStudentResult;
  delta: number | null;
  groupAverage: number | null;
}) {
  const { t } = useTranslation("parent");
  const band = result.total?.score ?? null;
  const level = parentResults.cefrLevel(band);
  const sections = result.sections;
  const pending = sections.some((section) => result.pending.includes(section.key) || (section.manual && section.score === null));
  const facts = [
    delta ? t("mock.result.delta", { value: `${delta > 0 ? "+" : ""}${delta}` }) : "",
    groupAverage !== null ? t("mock.result.groupAverage", { value: groupAverage }) : "",
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4 px-1 pb-1">
      {band !== null ? (
        <section className="relative flex items-center gap-6 overflow-hidden rounded-3xl bg-brand px-6 py-5 text-on-action">
          <span className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-on-brand-subtle" />
          <span className="relative grid size-[112px] shrink-0 place-items-center">
            <svg viewBox="0 0 112 112" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="56" cy="56" r={RADIUS} fill="none" strokeWidth="9" className="stroke-on-brand-subtle" />
              <circle
                cx="56"
                cy="56"
                r={RADIUS}
                fill="none"
                strokeWidth="9"
                strokeLinecap="round"
                className="stroke-on-action"
                strokeDasharray={`${(band / (result.total?.max || 9)) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              />
            </svg>
            <strong className="font-heading text-[30px]/9 font-semibold">{formatBand(band)}</strong>
          </span>
          <span className="relative flex flex-col gap-1">
            <small className="text-caption-strong tracking-wide uppercase opacity-80">{t("mock.result.overall")}</small>
            <strong className="font-heading text-[18px]/6 lg:text-[22px]/8 font-semibold">
              {level ? t("mock.result.level", { level }) : (result.total?.label ?? "")}
            </strong>
            {facts.length ? <small className="text-body-sm opacity-90">{facts.join(" · ")}</small> : null}
          </span>
        </section>
      ) : (
        <section className="flex items-center gap-5 rounded-3xl bg-subtle px-6 py-5">
          <span className="grid size-[88px] shrink-0 place-items-center rounded-full border-[8px] border-surface">
            <span className="h-1 w-7 rounded-full bg-line-strong" />
          </span>
          <span className="flex flex-col items-start gap-2">
            <strong className="font-heading text-[18px]/6 font-semibold text-ink">{t("mock.result.notReady")}</strong>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
              <Icon name="pending" size={14} />
              {t("mock.result.waitingTeacher")}
            </span>
          </span>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {sections.map((section) => {
          const waiting = result.pending.includes(section.key) || (section.manual && section.score === null);
          return (
            <span
              key={section.key}
              className={`flex flex-col gap-2 rounded-2xl p-3.5 ${waiting ? "bg-accent-teal-bg" : "border border-line bg-surface"}`}
            >
              <span className="flex items-center justify-between">
                <span className={`grid size-8 place-items-center rounded-lg ${waiting ? "bg-surface text-accent-teal-fg" : "bg-brand-subtle text-brand"}`}>
                  <Icon name={sectionIcon(section.key, section.title)} size={18} />
                </span>
                {!waiting && section.score !== null ? (
                  <strong className="font-heading text-[20px]/7 font-semibold text-ink">{formatBand(section.score)}</strong>
                ) : null}
              </span>
              <small className={`text-body-sm ${waiting ? "text-accent-teal-fg" : "text-ink-secondary"}`}>{section.title}</small>
              {waiting ? (
                <strong className="text-title-sm text-accent-teal-fg">{t("mock.result.sectionWaiting")}</strong>
              ) : (
                <>
                  {section.earned !== null && section.max ? (
                    <small className="text-caption text-ink-tertiary">
                      {section.earned} / {section.max}
                    </small>
                  ) : null}
                  <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
                    <span
                      className={`block h-full rounded-full ${sectionPercent(section) >= 60 ? "bg-brand" : "bg-saffron"}`}
                      style={{ width: `${sectionPercent(section)}%` }}
                    />
                  </span>
                </>
              )}
            </span>
          );
        })}
      </div>

      {pending ? (
        <p className="flex items-center gap-3 rounded-2xl bg-info-bg px-4 py-3 text-body-sm text-info-text">
          <Icon name="info" size={20} className="shrink-0" />
          {t("mock.result.pendingNote")}
        </p>
      ) : null}
    </div>
  );
}
