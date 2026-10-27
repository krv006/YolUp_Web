import { useTranslation } from "react-i18next";
import { quizDisplayTitle } from "@/modules/quiz";
import type { QuizSummary } from "@/shared/types";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import {
  MobileEmptyCard,
  MobileListSkeleton,
  MobilePageHeader,
  MobileSearchField,
  MobileSegment,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";

export interface MobileTestsProps {
  drafts: QuizSummary[];
  published: QuizSummary[];
  loading: boolean;
  chips: Array<{ id: string; label: string }>;
  filter: string;
  query: string;
  publishPending: boolean;
  onFilterChange: (filter: string) => void;
  onQueryChange: (query: string) => void;
  onBack: () => void;
  onCreate: () => void;
  onEdit: (quiz: QuizSummary) => void;
  onPublish: (quiz: QuizSummary) => void;
  onResults: (quiz: QuizSummary) => void;
  onAssign: (quiz: QuizSummary) => void;
  onAttempts: (quiz: QuizSummary) => void;
  onDownload: (quiz: QuizSummary) => void;
  onDelete: (quiz: QuizSummary) => void;
}

const OUTLINE =
  "flex h-11 min-w-0 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-3 text-button text-ink transition-colors hover:bg-subtle";
const SOFT =
  "flex h-11 min-w-0 items-center justify-center gap-2 rounded-full bg-brand-subtle px-3 text-button text-brand-strong transition-colors hover:bg-tint disabled:opacity-50";

export function MobileTests(props: MobileTestsProps) {
  const { t } = useTranslation("quiz");
  const { drafts, published, loading, chips, filter, query, onFilterChange, onQueryChange, onBack, onCreate } = props;
  const empty = !loading && !drafts.length && !published.length;

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-8 font-body text-ink">
      <MobilePageHeader
        title={t("tests.title")}
        backLabel={t("tests.mobile.back")}
        onBack={onBack}
        action={
          <button type="button" className={mobileRoundButton} aria-label={t("tests.create")} onClick={onCreate}>
            <Icon name="add" size={24} />
          </button>
        }
      />

      <MobileSearchField
        className="mt-4.5"
        value={query}
        onChange={onQueryChange}
        placeholder={t("tests.mobile.searchPlaceholder")}
        clearLabel={t("tests.mobile.clearSearch")}
      />

      <div className="mt-5">
        <MobileSegment scroll items={chips} value={filter} onChange={onFilterChange} />
      </div>

      {loading ? <MobileListSkeleton className="mt-3.5" /> : null}

      {!loading ? (
        <div className="mt-5 flex flex-col gap-3">
          {[
            { id: "drafts", rows: drafts },
            { id: "published", rows: published },
          ].map((section) =>
            section.rows.length ? (
              <section key={section.id} className="contents">
                <span className="text-caption-strong text-ink-secondary uppercase">
                  {t(`tests.mobile.${section.id}`, { count: section.rows.length })}
                </span>
                {section.rows.map((quiz) => (
                  <TestCard key={quiz.id} quiz={quiz} {...props} />
                ))}
              </section>
            ) : null
          )}

          {empty ? (
            query || filter !== "all" ? (
              <MobileEmptyCard icon="search" title={t("tests.mobile.emptySearch")} />
            ) : (
              <MobileEmptyCard
                icon="quiz"
                title={t("tests.emptyTitle")}
                description={t("tests.emptyHint")}
                action={{ label: t("tests.create"), icon: "add", onClick: onCreate }}
              />
            )
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

function TestCard({ quiz, ...props }: MobileTestsProps & { quiz: QuizSummary }) {
  const { t } = useTranslation("quiz");
  const draft = quiz.status === "draft";

  return (
    <article className="flex flex-col rounded-xl bg-surface p-4">
      <div className="flex items-center gap-3">
        <Dropdown>
          <DropdownTrigger asChild>
            <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-violet-bg text-accent-violet-fg">
                <Icon name="quiz" size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="truncate text-title text-ink">{quizDisplayTitle(quiz)}</strong>
                <small className="truncate text-body-sm text-ink-secondary">
                  {[quiz.subjectLabel, t("tests.questionCount", { count: quiz.questionCount })]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
            </button>
          </DropdownTrigger>
          <DropdownContent align="start">
            <DropdownItem onSelect={() => props.onEdit(quiz)}>{t("tests.edit")}</DropdownItem>
            {draft ? null : (
              <>
                <DropdownItem onSelect={() => props.onResults(quiz)}>{t("tests.results")}</DropdownItem>
                <DropdownItem onSelect={() => props.onAttempts(quiz)}>{t("tests.attempts")}</DropdownItem>
              </>
            )}
            <DropdownItem onSelect={() => props.onDownload(quiz)}>{t("tests.mobile.download")}</DropdownItem>
            <DropdownItem destructive onSelect={() => props.onDelete(quiz)}>
              {t("tests.mobile.delete")}
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        {draft ? (
          <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-accent-violet-bg px-2 text-caption-strong text-accent-violet-fg">
            <Icon name="edit" size={14} />
            {t("tests.draft")}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {draft ? (
          <>
            <button type="button" className={OUTLINE} onClick={() => props.onEdit(quiz)}>
              <Icon name="edit" size={18} />
              {t("tests.edit")}
            </button>
            <button
              type="button"
              className={SOFT}
              disabled={props.publishPending}
              onClick={() => props.onPublish(quiz)}
            >
              <Icon name="send" size={18} />
              {t("tests.publish")}
            </button>
          </>
        ) : (
          <>
            <button type="button" className={OUTLINE} onClick={() => props.onResults(quiz)}>
              <Icon name="bar-chart" size={18} />
              {t("tests.results")}
            </button>
            <button type="button" className={SOFT} onClick={() => props.onAssign(quiz)}>
              <Icon name="send" size={18} />
              {t("tests.assign")}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
