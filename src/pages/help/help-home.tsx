import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import {
  findCategory,
  ticketLabel,
  ticketTopic,
  ticketUnread,
  useHelpConfig,
  useHelpVideos,
  useSupportTickets,
  type HelpConfig,
  type HelpVideo,
  type SupportTicket,
} from "@/modules/support";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { useOnline } from "@/shared/hooks/use-online";
import { storage } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { useHelpActions } from "./help-actions";
import { MobileHelpScreen } from "./help-screen";
import { HeroSearch } from "./help-search";
import { HelpCard, HelpRow, HelpSection, HomeSkeleton, LoadError, OfflineBanner, StatusChip } from "./help-ui";
import {
  openVideo,
  useCategoryList,
  useHelpArticles,
  useHelpPaths,
  useHelpRole,
  useReplyMinutes,
  videoDuration,
  activeTicket,
  type ArticleView,
} from "./use-help";

function StatusLine({ config }: { config: HelpConfig | undefined }) {
  const { t } = useTranslation("help");
  const minutes = useReplyMinutes();
  if (!config || config.online === null) return null;
  return (
    <p className="mt-4 flex items-center gap-2 text-caption text-white/90 lg:mt-5 lg:text-body-xs">
      <i className={`size-2 shrink-0 rounded-full not-italic ${config.online ? "bg-success" : "bg-white/50"}`} aria-hidden="true" />
      <span>
        {config.online ? t("home.online", { minutes }) : t("home.offline")}
        {config.hours ? ` · ${config.hours}` : ""}
      </span>
    </p>
  );
}

function ArticleRows({ articles }: { articles: ArticleView[] }) {
  const navigate = useNavigate();
  const paths = useHelpPaths();
  return (
    <HelpCard className="py-1">
      {articles.map((article) => {
        const category = findCategory(article.category);
        return (
          <HelpRow
            key={article.id}
            icon={article.icon}
            tone={category?.tone ?? "bg-brand-subtle text-brand"}
            title={article.title}
            subtitle={article.hint}
            onClick={() => navigate(paths.article(article.id))}
          />
        );
      })}
    </HelpCard>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const unread = ticketUnread(ticket);
  const topic = ticketTopic(ticket.category);
  const label = ticketLabel(ticket);
  return (
    <HelpCard>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-subtle"
        onClick={() => navigate(paths.ticket(ticket.id))}
      >
        <span className={`grid size-10 shrink-0 place-items-center rounded-md ${topic?.tone ?? "bg-danger-bg text-error-text"}`}>
          <Icon name={topic?.icon ?? "forum"} size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <strong className="truncate text-title font-semibold text-ink">{ticket.subject}</strong>
            {unread ? <i className="size-2 shrink-0 rounded-full bg-brand not-italic" aria-hidden="true" /> : null}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-caption text-ink-secondary">
            <StatusChip status={ticket.status} />
            {[label, unread ? t("home.newReply") : ""].filter(Boolean).join(" · ")}
          </span>
        </span>
        <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
      </button>
    </HelpCard>
  );
}

function VideoCard({ video }: { video: HelpVideo }) {
  const duration = videoDuration(video.durationSeconds);
  return (
    <button
      type="button"
      className="flex w-full min-w-0 flex-col gap-2 rounded-xl bg-surface p-2 text-left transition-colors hover:bg-subtle"
      onClick={() => openVideo(video)}
    >
      <span className="relative grid h-29 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-strong">
        <span className="grid size-11 place-items-center rounded-full bg-surface text-brand shadow-md">
          <Icon name="play-arrow" size={24} />
        </span>
        {duration ? (
          <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-caption-strong text-white">{duration}</span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col px-1.5 pb-1">
        <strong className="truncate text-body-sm font-semibold text-ink">{video.title}</strong>
        {video.description ? <small className="truncate text-caption text-ink-secondary">{video.description}</small> : null}
      </span>
    </button>
  );
}

function ContactRows({ config, withTicket = false }: { config: HelpConfig | undefined; withTicket?: boolean }) {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const role = useHelpRole();
  const { user } = useAuth();
  const isCompact = useIsCompact();
  const minutes = useReplyMinutes();
  const { openNewTicket } = useHelpActions();
  const rows = [
    withTicket
      ? { id: "ticket", icon: "forum", tone: "bg-brand-subtle text-brand", title: t("home.ticketRow"), hint: t("home.ticketRowHint", { minutes }), run: () => openNewTicket() }
      : null,
    config?.telegram
      ? {
          id: "telegram",
          icon: "send",
          tone: "bg-brand-subtle text-brand",
          title: t("home.telegram"),
          hint: [config.telegram, isCompact ? config.hours : ""].filter(Boolean).join(" · "),
          run: () => window.open(config.telegramUrl, "_blank", "noopener,noreferrer"),
        }
      : null,
    config?.phone
      ? {
          id: "phone",
          icon: "call",
          tone: "bg-success-bg text-success-fg",
          title: t("home.phone"),
          hint: [config.phone, isCompact ? config.hours : ""].filter(Boolean).join(" · "),
          run: () => window.open(`tel:${config.phone.replace(/[^\d+]/g, "")}`, "_self"),
        }
      : null,
    { id: "tickets", icon: "chat", tone: "bg-accent-violet-bg text-accent-violet-fg", title: t("home.myTickets"), hint: t("home.myTicketsHint"), run: () => navigate(paths.tickets) },
    role === "teacher" && isCompact
      ? {
          id: "tour",
          icon: "school",
          tone: "bg-success-bg text-success-fg",
          title: t("home.tour"),
          hint: t("home.tourHint"),
          run: () => {
            storage.remove(`yolup:onboarding:${user?.id ?? ""}`);
            navigate("/teacher");
          },
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <HelpCard className="py-1">
      {rows.map((row) => (
        <HelpRow key={row.id} icon={row.icon} tone={row.tone} title={row.title} subtitle={row.hint} onClick={row.run} />
      ))}
    </HelpCard>
  );
}

function Hero({ compact }: { compact: boolean }) {
  const { t } = useTranslation("help");
  const { user } = useAuth();
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const config = useHelpConfig();
  const { openNewTicket } = useHelpActions();
  const name = (user?.firstName || user?.name || "").split(" ")[0];

  return (
    <section className="rounded-2xl bg-brand px-5 pt-5 pb-5 text-white lg:px-7 lg:pt-7 lg:pb-8">
      {name ? <p className="text-caption-strong tracking-wide text-white/80 uppercase">{t("home.greeting", { name })}</p> : null}
      <h2 className={`mt-2 font-heading text-white ${compact ? "text-h2" : "text-h1"}`}>{t("home.heading")}</h2>
      {compact ? (
        <button
          type="button"
          className="mt-4 flex h-12 w-full items-center gap-3 rounded-full bg-surface px-4 text-left text-body-sm text-ink-secondary"
          onClick={() => navigate(paths.search())}
        >
          <Icon name="search" size={20} />
          {t("home.search")}
        </button>
      ) : (
        <div className="mt-5 flex items-start gap-3">
          <HeroSearch />
          <button
            type="button"
            className="flex h-13 shrink-0 items-center gap-2 rounded-full bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
            onClick={() => openNewTicket()}
          >
            <Icon name="forum" size={20} />
            {t("home.send")}
          </button>
        </div>
      )}
      <StatusLine config={config.data} />
    </section>
  );
}

function CategoryGrid() {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const categories = useCategoryList();
  const isCompact = useIsCompact();
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className="flex min-w-0 flex-col items-start gap-4 rounded-xl bg-surface p-4 text-left transition-colors hover:bg-subtle"
          onClick={() => navigate(paths.category(category.id))}
        >
          <span className={`grid size-9 place-items-center rounded-md ${category.tone}`}>
            <Icon name={category.icon} size={20} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <strong className="truncate text-body-sm font-semibold text-ink">
              {t(`categories.${category.id}.${isCompact ? "short" : "title"}`)}
            </strong>
            <small className="text-caption text-ink-secondary">{t("home.articleCount", { count: category.articles.length })}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export function HelpHome() {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const isCompact = useIsCompact();
  const online = useOnline();
  const config = useHelpConfig();
  const tickets = useSupportTickets();
  const videos = useHelpVideos();
  const { popular } = useHelpArticles();
  const active = activeTicket(tickets.data);
  const loading = tickets.isLoading && videos.isLoading;
  const failed = !online && !tickets.data && !videos.data;

  function retry() {
    void tickets.refetch();
    void videos.refetch();
    void config.refetch();
  }

  const faq = (
    <HelpSection title={t("home.faq")} action={{ label: t("home.all"), onClick: () => navigate(paths.articles) }}>
      <ArticleRows articles={popular} />
    </HelpSection>
  );
  const ticketSection = active ? (
    <HelpSection title={t("home.activeTicket")} action={{ label: t("home.all"), onClick: () => navigate(paths.tickets) }}>
      <TicketCard ticket={active} />
    </HelpSection>
  ) : null;
  const videoList = videos.data ?? [];
  const videoSection = videoList.length ? (
    <HelpSection title={t("home.videos")} action={{ label: t("home.all"), onClick: () => navigate(paths.videos) }}>
      {isCompact ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {videoList.map((video) => (
            <div key={video.id} className="w-58 shrink-0">
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {videoList.slice(0, 3).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </HelpSection>
  ) : null;

  const offline = failed ? (
    <div className="flex flex-col gap-5">
      <OfflineBanner />
      <LoadError onRetry={retry} />
      {config.data?.phone ? (
        <HelpSection title={isCompact ? t("states.urgent") : ""}>
          <HelpCard>
            <HelpRow
              icon="call"
              tone="bg-success-bg text-success-fg"
              title={t("home.phone")}
              subtitle={isCompact ? [config.data.phone, config.data.hours].filter(Boolean).join(" · ") : t("states.phoneOffline", { phone: config.data.phone })}
              onClick={() => window.open(`tel:${config.data?.phone.replace(/[^\d+]/g, "")}`, "_self")}
            />
          </HelpCard>
        </HelpSection>
      ) : null}
    </div>
  ) : null;

  if (isCompact)
    return (
      <MobileHelpScreen title={t("title")}>
        {offline ?? (loading ? (
          <HomeSkeleton />
        ) : (
          <>
            <Hero compact />
            {ticketSection}
            <HelpSection title={t("home.categories")}>
              <CategoryGrid />
            </HelpSection>
            {faq}
            {videoSection}
            <HelpSection title={t("home.contact")}>
              <ContactRows config={config.data} withTicket />
            </HelpSection>
          </>
        ))}
      </MobileHelpScreen>
    );

  if (offline) return offline;
  if (loading) return <HomeSkeleton />;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Hero compact={false} />
      <HelpSection title={t("home.categories")}>
        <CategoryGrid />
      </HelpSection>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {faq}
        <div className="flex min-w-0 flex-col gap-5">
          {ticketSection}
          <HelpSection title={t("home.contact")}>
            <ContactRows config={config.data} />
          </HelpSection>
        </div>
      </div>
      {videoSection}
    </div>
  );
}
