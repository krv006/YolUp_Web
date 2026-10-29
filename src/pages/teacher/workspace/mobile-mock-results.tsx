import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatClock, secondsUntil } from "@/modules/exam";
import type { ExamStudentResult, ExamStudentResultDetail, ExamWritingAiItem } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import {
  MobileActionBar,
  MobileListCard,
  MobileListRow,
  MobileListSkeleton,
  MobileTitleHeader,
  mobileButton,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";

function band(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

function Tile({ value, label, tone = "text-ink" }: { value: ReactNode; label: ReactNode; tone?: string }) {
  return (
    <div className="flex h-[63px] min-w-0 flex-col justify-center rounded-lg bg-surface px-3">
      <strong className={`truncate text-[20px] leading-6 font-semibold ${tone}`}>{value}</strong>
      <small className="truncate text-body-xs text-ink-secondary">{label}</small>
    </div>
  );
}

function Header({ title, icon, label, onBack, action }: { title?: ReactNode; icon: "close" | "chevron-left"; label: string; onBack: () => void; action?: ReactNode }) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3">
      <button type="button" className={mobileRoundButton} aria-label={label} onClick={onBack}>
        <Icon name={icon} size={22} />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center text-title-lg font-semibold">{title}</h1>
      {action ?? <span className="size-11 shrink-0" aria-hidden="true" />}
    </header>
  );
}

export interface MobileMockLiveProps {
  title: string;
  sectionTitle: string | null;
  sectionIndex: number;
  sectionCount: number;
  endsAt: string | null;
  rows: ExamStudentResult[];
  onBack: () => void;
}

export function MobileMockLive({ title, sectionTitle, sectionIndex, sectionCount, endsAt, rows, onBack }: MobileMockLiveProps) {
  const { t } = useTranslation("exam");
  const [left, setLeft] = useState(() => secondsUntil(endsAt));

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(secondsUntil(endsAt)), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const joined = rows.filter((row) => row.participated).length;
  const finished = rows.filter((row) => row.finishedAt).length;
  const warnings = rows.reduce((sum, row) => sum + (row.integrity?.away ?? 0) + (row.integrity?.paste ?? 0), 0);
  const end = endsAt ? new Date(endsAt) : null;
  const endLabel =
    end && !Number.isNaN(end.getTime())
      ? `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
      : "—";

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-8 font-body text-ink [&>*]:shrink-0">
      <Header title={title} icon="close" label={t("mock.mobile.back")} onBack={onBack} />

      <section className="mt-4 flex flex-col rounded-xl bg-brand px-4 pt-4 pb-[15px] text-on-action">
        <span className="flex h-6 items-center gap-2">
          <span className="flex h-6 items-center gap-1.5 rounded-full bg-surface px-2 text-caption-strong text-error-text">
            <i className="size-2 rounded-full bg-danger not-italic" />
            {t("mock.liveBadge")}
          </span>
          <small className="truncate text-body-sm font-semibold">
            {sectionTitle ? t("mock.mobile.liveSection", { title: sectionTitle, current: sectionIndex, total: sectionCount }) : null}
          </small>
        </span>
        <strong className="mt-2.5 font-heading text-[40px] leading-[48px] font-semibold tabular-nums">{formatClock(left)}</strong>
        <small className="mt-2.5 text-body-sm">{t("mock.mobile.liveEnds", { time: endLabel })}</small>
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Tile value={`${joined}/${rows.length}`} label={t("mock.mobile.joined")} />
        <Tile value={finished} label={t("mock.mobile.submitted")} tone="text-success" />
        <Tile value={warnings} label={t("mock.mobile.warnings")} tone="text-error-text" />
      </div>

      <span className="mt-[17px] text-caption-strong text-ink-secondary uppercase">{t("mock.mobile.students")}</span>

      <div className="mt-3 flex flex-col gap-[31px] rounded-xl bg-surface px-4 pt-[15px] pb-4">
        {rows.map((row) => {
          const done = Boolean(row.finishedAt);
          const away = row.integrity?.away ?? 0;
          const percent = done
            ? 100
            : row.participated && row.answered != null && row.questionsTotal
              ? Math.round((row.answered / row.questionsTotal) * 100)
              : 0;
          return (
            <div key={row.studentId} className="flex items-center gap-3">
              <Avatar name={row.studentName} src={row.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-9" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex min-w-0 items-center gap-2">
                  <strong className="truncate text-title-sm text-ink">{row.studentName}</strong>
                  {away ? (
                    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-danger-bg px-2 text-caption-strong text-error-text">
                      <Icon name="warning-fill" size={12} className="text-accent-saffron-fg" />
                      {t("mock.awayCount", { count: away })}
                    </span>
                  ) : null}
                </span>
                <small className={`mt-[3px] truncate text-caption font-normal ${row.participated ? "text-ink-secondary" : "text-error-text"}`}>
                  {done
                    ? t("mock.finished")
                    : row.participated
                      ? [sectionTitle, row.answered != null && row.questionsTotal ? t("mock.answeredCount", { answered: row.answered, total: row.questionsTotal }) : t("mock.inProgress")]
                          .filter(Boolean)
                          .join(" · ")
                      : t("mock.mobile.notJoined")}
                </small>
                <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-subtle">
                  <i
                    className={`block h-full rounded-full not-italic ${done ? "bg-success" : "bg-brand"}`}
                    style={{ width: `${percent}%` }}
                  />
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-caption font-normal text-ink-secondary">{t("mock.mobile.integrityNote")}</p>
    </main>
  );
}

export interface MobileMockResultsProps {
  eyebrow: string;
  title: string;
  rows: ExamStudentResult[];
  sections: Array<{ key: string; title: string; value: number | null; manual: boolean }>;
  loading: boolean;
  sharing: boolean;
  onBack: () => void;
  onShare: () => void;
  onSection: (key: string) => void;
  onStudent: (row: ExamStudentResult) => void;
}

export function MobileMockResults(props: MobileMockResultsProps) {
  const { t } = useTranslation("exam");
  const participated = props.rows.filter((row) => row.participated);
  const totals = participated.map((row) => row.total?.score ?? null).filter((value): value is number => value !== null);
  const average = totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : null;
  const best = totals.length ? Math.max(...totals) : null;

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-8 font-body text-ink [&>*]:shrink-0">
      <header className="flex h-11 items-center justify-between">
        <button type="button" className={mobileRoundButton} aria-label={t("mock.mobile.back")} onClick={props.onBack}>
          <Icon name="chevron-left" size={22} />
        </button>
        <button
          type="button"
          className={mobileRoundButton}
          aria-label={t("results.share")}
          disabled={props.sharing}
          onClick={props.onShare}
        >
          <Icon name="send" size={22} />
        </button>
      </header>

      <div className="mt-4">
        <MobileTitleHeader eyebrow={props.eyebrow} title={props.title} />
      </div>

      <div className="mt-5.5 grid grid-cols-3 gap-2">
        <Tile value={`${participated.length}/${props.rows.length}`} label={t("results.submitted")} />
        <Tile value={band(average)} label={t("mock.mobile.averageLabel")} tone="text-brand-strong" />
        <Tile value={band(best)} label={t("results.best")} tone="text-success" />
      </div>

      {props.loading ? (
        <MobileListSkeleton card rows={3} className="mt-5" />
      ) : (
        <>
          {props.sections.length ? (
            <section className="mt-5 flex flex-col rounded-xl bg-surface px-4 pt-4 pb-4">
              <strong className="text-title text-ink">{t("mock.mobile.bySection")}</strong>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {props.sections.map((section) => {
                  const body = (
                    <>
                      <span className="flex items-center justify-between gap-3 text-body-sm">
                        <span className="text-ink">{section.title}</span>
                        <strong className="text-brand-strong">{band(section.value)}</strong>
                      </span>
                      <span className="h-2 w-full overflow-hidden rounded-full bg-subtle">
                        <i
                          className="block h-full rounded-full bg-brand not-italic"
                          style={{ width: `${Math.min(100, ((section.value ?? 0) / 9) * 100)}%` }}
                        />
                      </span>
                    </>
                  );
                  return section.manual ? (
                    <button
                      key={section.key}
                      type="button"
                      className="flex flex-col gap-2 text-left"
                      onClick={() => props.onSection(section.key)}
                    >
                      {body}
                    </button>
                  ) : (
                    <div key={section.key} className="flex flex-col gap-2">
                      {body}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <MobileListCard className="mt-5">
            {props.rows.map((row) => {
              const score = row.total?.score ?? null;
              return (
                <MobileListRow
                  key={row.studentId}
                  chevron={false}
                  leading={<Avatar name={row.studentName} src={row.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-11" />}
                  title={row.studentName}
                  subtitle={row.participated ? null : t("results.notJoined")}
                  trailing={
                    row.participated ? (
                      <span
                        className={`flex h-7 shrink-0 items-center rounded-full px-2.5 text-caption-strong ${
                          score !== null && score >= 7 ? "bg-success-bg text-success-fg" : "bg-brand-subtle text-ink"
                        }`}
                      >
                        {band(score)}
                      </span>
                    ) : null
                  }
                  onClick={row.participated ? () => props.onStudent(row) : undefined}
                />
              );
            })}
          </MobileListCard>
        </>
      )}
    </main>
  );
}

export type WritingFilter = "all" | "ungraded" | "ai";

export interface WritingEntry {
  row: ExamStudentResult;
  detail: ExamStudentResultDetail | undefined;
  sectionKey: string;
}

export interface MobileWritingListProps {
  eyebrow: string;
  entries: WritingEntry[];
  loading: boolean;
  onBack: () => void;
  onOpen: (entry: WritingEntry) => void;
}

function writingState(entry: WritingEntry) {
  const teacher = entry.row.sections.find((section) => section.key === entry.sectionKey)?.score ?? null;
  const ai = entry.detail?.writingAi ?? null;
  const item: ExamWritingAiItem | null = ai?.status === "done" ? (ai.items[ai.items.length - 1] ?? null) : null;
  const text =
    entry.detail?.manualAnswers.filter((answer) => answer.section === entry.sectionKey).map((answer) => answer.answer).join("\n\n") ??
    "";
  const words = item?.wordCount ?? (text.trim() ? text.trim().split(/\s+/).length : 0);
  return {
    teacher,
    ai: ai?.status === "done" ? ai.suggestedBand : null,
    tooShort: Boolean(item?.tooShort),
    minWords: item?.minWords ?? null,
    words,
    text,
    task: item?.task ?? null,
  };
}

function excerpt(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  const stop = clean.search(/[.,!?;]/);
  const cut = stop > 20 && stop <= 90 ? stop : Math.min(clean.length, 90);
  return cut < clean.length ? `${clean.slice(0, cut).trimEnd()}...` : clean;
}

export function MobileWritingList({ eyebrow, entries, loading, onBack, onOpen }: MobileWritingListProps) {
  const { t } = useTranslation("exam");
  const [filter, setFilter] = useState<WritingFilter>("all");
  const states = entries.map((entry) => ({ entry, state: writingState(entry) }));
  const counts = {
    all: states.length,
    ungraded: states.filter(({ state }) => state.teacher === null).length,
    ai: states.filter(({ state }) => state.ai !== null).length,
  };
  const visible = states.filter(({ state }) =>
    filter === "ungraded" ? state.teacher === null : filter === "ai" ? state.ai !== null : true
  );

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5 pb-8 font-body text-ink [&>*]:shrink-0">
      <Header title={t("mock.mobile.essaysTitle")} icon="close" label={t("mock.mobile.back")} onBack={onBack} />
      <p className="mt-4 text-body-sm text-ink-secondary">{eyebrow}</p>
      <div className="mt-3 flex gap-2">
        {(["all", "ungraded", "ai"] as const).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            className={`flex h-[22px] items-center rounded-full px-2.5 text-caption-strong transition-colors ${
              filter === id ? "bg-brand text-on-action" : "bg-surface text-ink"
            }`}
            onClick={() => setFilter(id)}
          >
            {t(`mock.mobile.essayFilters.${id}`, { count: counts[id] })}
          </button>
        ))}
      </div>

      {loading ? <MobileListSkeleton card rows={3} className="mt-3" /> : null}

      <div className="mt-3 flex flex-col gap-3">
        {visible.map(({ entry, state }) => (
          <button
            key={entry.row.studentId}
            type="button"
            className="flex flex-col rounded-xl bg-surface px-4 pt-[13px] pb-[14px] text-left"
            onClick={() => onOpen(entry)}
          >
            <span className="flex h-6 items-center gap-3">
              <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">{entry.row.studentName}</strong>
              {state.teacher !== null || state.ai !== null ? (
                <span className="flex h-6 shrink-0 items-center rounded-full bg-brand-subtle px-2 text-caption-strong text-brand-strong">
                  {band(state.teacher ?? state.ai)}
                </span>
              ) : null}
            </span>
            <p className="mt-[7px] line-clamp-2 text-body-sm text-ink-secondary">
              {state.text ? `${state.task ? `Task ${state.task}: ` : ""}“${excerpt(state.text)}”` : t("mock.mobile.noEssay")}
            </p>
            <span className="mt-2 flex items-center justify-between gap-3 text-caption">
              <span className={state.tooShort ? "text-error-text" : "font-normal text-ink-secondary"}>
                {state.tooShort && state.minWords
                  ? t("mock.mobile.wordsShort", { count: state.words, min: state.minWords })
                  : t("results.wordCount", { count: state.words })}
              </span>
              <span
                className={
                  state.teacher !== null
                    ? "text-success-fg"
                    : state.tooShort
                      ? "text-error-text"
                      : state.ai !== null
                        ? "text-success-fg"
                        : "text-brand"
                }
              >
                {state.teacher !== null
                  ? t("mock.mobile.byTeacher", { value: band(state.teacher) })
                  : state.tooShort
                    ? t("mock.mobile.tooShort")
                    : state.ai !== null
                      ? t("mock.mobile.byAi", { value: band(state.ai) })
                      : t("mock.mobile.ungraded")}
              </span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

export interface MobileWritingAiProps {
  title: string;
  detail: ExamStudentResultDetail | undefined;
  requesting: boolean;
  onBack: () => void;
  onRequest: () => void;
  onApply: (band: number) => void;
}

export function MobileWritingAi({ title, detail, requesting, onBack, onRequest, onApply }: MobileWritingAiProps) {
  const { t } = useTranslation("exam");
  const ai = detail?.writingAi ?? null;
  const items = ai?.status === "done" ? ai.items : [];

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
        <Header title={title} icon="close" label={t("mock.mobile.back")} onBack={onBack} />

        {!ai || ai.status !== "done" ? (
          <p className="mt-5 rounded-xl bg-surface px-5 py-8 text-center text-body-sm text-ink-secondary">
            {!ai ? t("writingAi.ask") : ai.status === "queued" ? t("writingAi.queued") : t("writingAi.failed", { error: ai.error })}
          </p>
        ) : null}

        {items.map((item, index) => (
          <div key={`${item.task}-${index}`} className="mt-4 flex flex-col gap-3">
            <section className="flex flex-col rounded-xl bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-18 shrink-0 flex-col items-center justify-center rounded-lg bg-brand text-on-action">
                  <strong className="font-heading text-[22px] leading-7 font-semibold">{band(item.overallBand)}</strong>
                  <small className="text-caption font-normal">{t("mock.mobile.band")}</small>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="flex items-center gap-1.5 text-body-sm text-brand">
                    <Icon name="sparkles-fill" size={16} />
                    {t("mock.mobile.aiCriteria")}
                  </strong>
                  <small className="text-caption font-normal text-ink-secondary">
                    {t("mock.mobile.wordsTask", { count: item.wordCount, task: item.task })}
                  </small>
                  <small className="text-caption font-normal text-ink-secondary">{t("writingAi.teacherConfirms")}</small>
                </span>
              </div>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {item.criteria.map((criterion) => (
                  <span key={criterion.key} className="flex flex-col gap-1">
                    <span className="flex items-center justify-between gap-3 text-body-sm">
                      <span className="text-ink">{criterion.title}</span>
                      <strong className="text-ink">{band(criterion.band)}</strong>
                    </span>
                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <i className="block h-full rounded-full bg-brand not-italic" style={{ width: `${Math.min(100, (criterion.band / 9) * 100)}%` }} />
                    </span>
                  </span>
                ))}
              </div>
            </section>

            {item.errors.length ? (
              <section className="flex flex-col gap-2 rounded-xl bg-surface px-4 pt-3.5 pb-3 [&>p+p]:mt-0.5">
                <strong className="flex items-center gap-2 text-body-sm text-ink">
                  <Icon name="warning-fill" size={18} className="text-danger" />
                  {t("writingAi.errors")}
                </strong>
                {item.errors.map((error, errorIndex) => (
                  <p key={errorIndex} className="text-body-sm text-ink">
                    • “{error.quote}”{error.correction ? ` → “${error.correction}”` : ""}
                    {error.issue ? ` (${error.issue})` : ""}
                  </p>
                ))}
              </section>
            ) : null}

            {item.strengths.length ? (
              <section className="flex flex-col gap-2 rounded-xl bg-surface px-4 pt-3.5 pb-3 [&>p+p]:mt-0.5">
                <strong className="flex items-center gap-2 text-body-sm text-ink">
                  <Icon name="check-circle" size={18} className="text-success" />
                  {t("writingAi.strengths")}
                </strong>
                {item.strengths.map((text) => (
                  <p key={text} className="text-body-sm text-ink">
                    • {text}
                  </p>
                ))}
              </section>
            ) : null}

            {item.upgradedParagraph ? (
              <section className="flex flex-col gap-2 rounded-xl bg-surface px-4 pt-3.5 pb-3 [&>p+p]:mt-0.5">
                <strong className="flex items-center gap-2 text-body-sm text-ink">
                  <Icon name="sparkles-fill" size={18} className="text-brand" />
                  {t("mock.mobile.upgraded")}
                </strong>
                <p className="text-body-sm text-ink">• “{item.upgradedParagraph}”</p>
              </section>
            ) : null}
          </div>
        ))}
      </div>

      <MobileActionBar>
        <button
          type="button"
          className={`${mobileButton.secondary} flex-[0.8] px-3`}
          disabled={requesting || ai?.status === "queued"}
          onClick={onRequest}
        >
          {t("mock.mobile.askAgain")}
        </button>
        <button
          type="button"
          className={`${mobileButton.primary} flex-[1.2] px-3 whitespace-nowrap`}
          disabled={ai?.suggestedBand == null}
          onClick={() => ai?.suggestedBand != null && onApply(ai.suggestedBand)}
        >
          {t("writingAi.apply")}
        </button>
      </MobileActionBar>
    </div>
  );
}
