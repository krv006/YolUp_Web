import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { findArticle, findCategory, useHelpFaq, useHelpVideos, useSendArticleFeedback, type HelpVideo } from "@/modules/support";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { mobileRoundButton } from "@/shared/ui/mobile-page";
import { useHelpActions } from "./help-actions";
import { MobileHelpScreen } from "./help-screen";
import { ChipTabs, EmptyBlock, HelpCard, HelpRow, RowsSkeleton } from "./help-ui";
import {
  openVideo,
  useArticleText,
  useCategoryList,
  useHelpArticles,
  useHelpDate,
  useHelpPaths,
  useReplyMinutes,
  videoDuration,
  type ArticleView,
} from "./use-help";

const REASONS = ["outdated", "unclear", "different", "other"] as const;

function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  const navigate = useNavigate();
  return (
    <nav className="flex flex-wrap items-center gap-2 text-body-xs" aria-label="breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index ? <span className="text-ink-tertiary">/</span> : null}
          {item.to ? (
            <button type="button" className="text-brand hover:underline" onClick={() => navigate(item.to as string)}>
              {item.label}
            </button>
          ) : (
            <span className="text-ink-secondary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function VideoRow({ video }: { video: HelpVideo }) {
  const { t } = useTranslation("help");
  const duration = videoDuration(video.durationSeconds);
  return (
    <HelpRow
      icon="play-arrow"
      tone="bg-accent-violet-bg text-accent-violet-fg"
      title={video.title}
      subtitle={duration ? t("search.videoMeta", { duration }) : t("search.videoMetaNoDuration")}
      onClick={() => openVideo(video)}
    />
  );
}

function ArticleList({ articles, showCategory = false }: { articles: ArticleView[]; showCategory?: boolean }) {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  return (
    <>
      {articles.map((article) => (
        <HelpRow
          key={article.id}
          icon={article.icon}
          tone={findCategory(article.category)?.tone ?? "bg-brand-subtle text-brand"}
          title={article.title}
          subtitle={
            showCategory
              ? `${t(`categories.${article.category}.title`)} · ${t("search.readMinutes", { minutes: article.minutes })}`
              : t("category.readTime", { minutes: article.minutes })
          }
          onClick={() => navigate(paths.article(article.id))}
        />
      ))}
    </>
  );
}

function ListPage({ title, breadcrumb, children }: { title: string; breadcrumb: string; children: React.ReactNode }) {
  const { t } = useTranslation("help");
  const paths = useHelpPaths();
  if (useIsCompact()) return <MobileHelpScreen title={title}>{children}</MobileHelpScreen>;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Breadcrumb items={[{ label: t("title"), to: paths.home }, { label: breadcrumb }]} />
      {children}
    </div>
  );
}

export function HelpCategoryPage() {
  const { t } = useTranslation("help");
  const { categoryId = "" } = useParams();
  const paths = useHelpPaths();
  const dayMonth = useHelpDate();
  const categories = useCategoryList();
  const category = categories.find((item) => item.id === categoryId);
  const [tag, setTag] = useState("all");
  if (!category) return <Navigate to={paths.home} replace />;
  const latest = category.articles.map((article) => article.updatedAt).sort().at(-1) ?? "";
  const visible = tag === "all" ? category.articles : category.articles.filter((article) => article.tag === tag);
  const tags = (category.tags ?? []).filter((item) => category.articles.some((article) => article.tag === item));
  const title = t(`categories.${category.id}.title`);

  return (
    <ListPage title={title} breadcrumb={title}>
      <HelpCard>
        <div className="flex items-center gap-3 px-4 py-4">
          <span className={`grid size-10 shrink-0 place-items-center rounded-md ${category.tone}`}>
            <Icon name={category.icon} size={20} />
          </span>
          <span className="flex min-w-0 flex-col">
            <strong className="text-title-sm font-semibold text-ink">
              {category.videos.length
                ? t("category.summary", {
                    articles: t("home.articleCount", { count: category.articles.length }),
                    videos: t("category.videos", { count: category.videos.length }),
                  })
                : t("home.articleCount", { count: category.articles.length })}
            </strong>
            {latest ? <small className="text-body-xs text-ink-secondary">{t("category.updated", { date: dayMonth(latest) })}</small> : null}
          </span>
        </div>
      </HelpCard>
      {tags.length ? (
        <ChipTabs
          items={[{ id: "all", label: t("category.all") }, ...tags.map((item) => ({ id: item, label: t(`category.tags.${item}`) }))]}
          value={tag}
          onChange={setTag}
        />
      ) : null}
      <HelpCard className="py-1">
        <ArticleList articles={visible} />
        {tag === "all" ? category.videos.map((video) => <VideoRow key={video.id} video={video} />) : null}
      </HelpCard>
    </ListPage>
  );
}

export function HelpArticlesPage() {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const { all } = useHelpArticles();
  const faq = useHelpFaq();
  const title = t("category.allArticles");
  return (
    <ListPage title={title} breadcrumb={title}>
      <HelpCard className="py-1">
        {(faq.data ?? []).map((item) => (
          <HelpRow
            key={`faq-${item.id}`}
            icon="help"
            tone="bg-brand-subtle text-brand"
            title={item.question}
            subtitle={t("search.faqMeta")}
            onClick={() => navigate(paths.faq(item.id))}
          />
        ))}
        <ArticleList articles={all} showCategory />
      </HelpCard>
    </ListPage>
  );
}

export function HelpVideosPage() {
  const { t } = useTranslation("help");
  const videos = useHelpVideos();
  const title = t("category.allVideos");
  return (
    <ListPage title={title} breadcrumb={title}>
      {videos.isLoading ? (
        <RowsSkeleton rows={3} />
      ) : videos.data?.length ? (
        <HelpCard className="py-1">
          {videos.data.map((video) => (
            <VideoRow key={video.id} video={video} />
          ))}
        </HelpCard>
      ) : (
        <EmptyBlock icon="play-circle" title={t("category.empty")} />
      )}
    </ListPage>
  );
}

function FeedbackDialog({ open, onOpenChange, onSend }: { open: boolean; onOpenChange: (open: boolean) => void; onSend: (reason: string, comment: string) => void }) {
  const { t } = useTranslation("help");
  const isCompact = useIsCompact();
  const [reason, setReason] = useState<string>("different");
  const [comment, setComment] = useState("");
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      width="lg:max-w-120"
      title={t("article.feedback.title")}
      description={t("article.feedback.description")}
      footer={
        isCompact ? (
          <button type="button" className={`${dialogButton.primary} w-full`} onClick={() => onSend(reason, comment.trim())}>
            {t("article.feedback.send")}
          </button>
        ) : (
          <>
            <button type="button" className="h-11 px-4 text-button text-brand" onClick={() => onOpenChange(false)}>
              {t("article.feedback.cancel")}
            </button>
            <button type="button" className={dialogButton.primary} onClick={() => onSend(reason, comment.trim())}>
              {t("article.feedback.send")}
            </button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4 pb-1" role="radiogroup">
        {REASONS.map((item) => (
          <label key={item} className="flex cursor-pointer items-center gap-4 py-1.5 text-body text-ink">
            <input
              type="radio"
              name="feedback-reason"
              className="size-5 accent-brand"
              checked={reason === item}
              onChange={() => setReason(item)}
            />
            {t(`article.feedback.${item}`)}
          </label>
        ))}
        <label className="flex flex-col gap-2">
          <span className="text-body-sm font-medium text-ink">{t("article.feedback.comment")}</span>
          <textarea
            className="min-h-28 resize-none rounded-lg bg-subtle px-4 py-3 text-body text-ink outline-none placeholder:text-ink-tertiary focus:ring-2 focus:ring-focus"
            value={comment}
            maxLength={500}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("article.feedback.commentPlaceholder")}
          />
        </label>
      </div>
    </AppDialog>
  );
}

function useFeedback(articleId: string) {
  const { t, i18n } = useTranslation("help");
  const send = useSendArticleFeedback();
  const [done, setDone] = useState(false);
  const [asking, setAsking] = useState(false);
  function submit(helpful: boolean, reason?: string, comment?: string) {
    send.mutate({ article: articleId, helpful, reason, comment, language: i18n.language });
    setAsking(false);
    setDone(true);
    toast.success(t("article.sent"));
  }
  return { done, asking, setAsking, submit };
}

export function HelpArticlePage() {
  const { t } = useTranslation("help");
  const { articleId = "" } = useParams();
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const isCompact = useIsCompact();
  const minutes = useReplyMinutes();
  const dayMonth = useHelpDate();
  const text = useArticleText();
  const { all } = useHelpArticles();
  const { openNewTicket } = useHelpActions();
  const raw = findArticle(articleId);
  const article = useMemo(() => (raw ? text(raw) : null), [raw, text]);
  const feedback = useFeedback(articleId);

  if (!article || !all.some((item) => item.id === article.id)) return <Navigate to={paths.home} replace />;

  const category = findCategory(article.category);
  const categoryTitle = t(`categories.${article.category}.title`);
  const related = all.filter((item) => item.category === article.category && item.id !== article.id).slice(0, 4);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article?.title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url);
    toast.success(t("article.copied"));
  }

  const body = (
    <>
      <p className="text-body text-ink">{article.intro}</p>
      <ol className="flex flex-col gap-3.5">
        {article.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-subtle text-body-sm font-semibold text-brand">
              {index + 1}
            </span>
            <span className="pt-0.5 text-body text-ink">{step}</span>
          </li>
        ))}
      </ol>
      {article.tip ? (
        <p className="flex items-start gap-2.5 rounded-lg bg-brand-subtle px-4 py-3 text-body-sm text-brand">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />
          {article.tip}
        </p>
      ) : null}
    </>
  );

  const feedbackBlock = feedback.done ? (
    <p className="flex items-center gap-3 text-title-sm font-semibold text-ink">
      <span className="grid size-9 place-items-center rounded-md bg-success-bg text-success-fg">
        <Icon name="check-circle" size={20} />
      </span>
      {t("article.thanks")}
    </p>
  ) : (
    <div className={`flex gap-3 ${isCompact ? "flex-col" : "items-center justify-between"}`}>
      <strong className="text-title-sm font-semibold text-ink">{t("article.helpful")}</strong>
      <div className="flex gap-3">
        <button
          type="button"
          className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border border-line-strong px-5 text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
          onClick={() => feedback.submit(true)}
        >
          {t("article.yes")}
        </button>
        <button
          type="button"
          className="flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border border-line-strong px-5 text-body-sm font-semibold text-ink transition-colors hover:bg-subtle"
          onClick={() => feedback.setAsking(true)}
        >
          {t("article.no")}
        </button>
      </div>
    </div>
  );

  const dialog = (
    <FeedbackDialog
      open={feedback.asking}
      onOpenChange={feedback.setAsking}
      onSend={(reason, comment) => feedback.submit(false, reason, comment)}
    />
  );

  const relatedRows = related.map((item) => (
    <HelpRow
      key={item.id}
      icon={item.icon}
      tone={category?.tone ?? "bg-brand-subtle text-brand"}
      title={item.title}
      subtitle={isCompact ? t("category.readTime", { minutes: item.minutes }) : t("search.readMinutes", { minutes: item.minutes })}
      onClick={() => navigate(paths.article(item.id))}
    />
  ));

  if (isCompact)
    return (
      <MobileHelpScreen
        title={t("article.title")}
        action={
          <button type="button" className={mobileRoundButton} aria-label={t("article.share")} onClick={() => void share()}>
            <Icon name="share" size={20} />
          </button>
        }
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-caption-strong tracking-wide text-brand uppercase">{categoryTitle}</p>
          <h2 className="font-heading text-h2 text-ink">{article.title}</h2>
          <p className="flex items-center gap-1.5 text-body-xs text-ink-secondary">
            <Icon name="clock" size={14} />
            {t("article.meta", { minutes: article.minutes, date: dayMonth(article.updatedAt) })}
          </p>
        </div>
        <HelpCard className="gap-4 px-4 py-5">{body}</HelpCard>
        <HelpCard className="px-4 py-4">{feedbackBlock}</HelpCard>
        <HelpCard>
          <HelpRow
            icon="forum"
            tone="bg-success-bg text-success-fg"
            title={t("article.needHelpMobile")}
            subtitle={t("article.needHelpHint")}
            onClick={() => openNewTicket({ category: article.category })}
          />
        </HelpCard>
        {related.length ? (
          <section className="flex flex-col gap-3">
            <h2 className="text-title font-normal text-ink">{t("article.similar")}</h2>
            <HelpCard className="py-1">{relatedRows}</HelpCard>
          </section>
        ) : null}
        {dialog}
      </MobileHelpScreen>
    );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Breadcrumb
        items={[
          { label: t("title"), to: paths.home },
          { label: categoryTitle, to: paths.category(article.category) },
          { label: article.title },
        ]}
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <article className="flex min-w-0 flex-col gap-5 rounded-2xl bg-surface px-7 py-7">
          <div className="flex flex-col gap-2">
            <p className="text-caption-strong tracking-wide text-brand uppercase">{categoryTitle}</p>
            <h2 className="font-heading text-h1 text-ink">{article.title}</h2>
            <p className="flex items-center gap-1.5 text-body-xs text-ink-secondary">
              <Icon name="clock" size={14} />
              {t("article.meta", { minutes: article.minutes, date: dayMonth(article.updatedAt) })}
            </p>
          </div>
          {body}
          <div className="border-t border-line pt-5">{feedbackBlock}</div>
        </article>
        <aside className="flex min-w-0 flex-col gap-4">
          {related.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-title font-normal text-ink">{t("article.inSection")}</h2>
              <HelpCard className="py-1">{relatedRows}</HelpCard>
            </section>
          ) : null}
          <HelpCard className="gap-3 px-4 py-4">
            <strong className="text-title-sm font-semibold text-ink">{t("article.needHelp")}</strong>
            <p className="text-body-sm text-ink-secondary">{t("article.needHelpText", { minutes })}</p>
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand text-button text-on-action transition-colors hover:bg-brand-strong"
              onClick={() => openNewTicket({ category: article.category })}
            >
              <Icon name="forum" size={18} />
              {t("home.send")}
            </button>
          </HelpCard>
        </aside>
      </div>
      {dialog}
    </div>
  );
}

export function HelpFaqPage() {
  const { t } = useTranslation("help");
  const { faqId = "" } = useParams();
  const paths = useHelpPaths();
  const faq = useHelpFaq();
  const { openNewTicket } = useHelpActions();
  const item = faq.data?.find((entry) => entry.id === faqId);
  if (faq.isLoading) return <RowsSkeleton rows={2} />;
  if (!item) return <Navigate to={paths.home} replace />;
  const content = (
    <>
      <HelpCard className="gap-3 px-5 py-5">
        <h2 className="font-heading text-h3 text-ink">{item.question}</h2>
        <p className="text-body whitespace-pre-line text-ink">{item.answer}</p>
      </HelpCard>
      <HelpCard>
        <HelpRow
          icon="forum"
          tone="bg-success-bg text-success-fg"
          title={t("article.needHelpMobile")}
          subtitle={t("article.needHelpHint")}
          onClick={() => openNewTicket()}
        />
      </HelpCard>
    </>
  );
  return (
    <ListPage title={t("article.title")} breadcrumb={item.question}>
      {content}
    </ListPage>
  );
}
