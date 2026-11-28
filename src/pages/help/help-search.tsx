import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  clearRecentSearches,
  findCategory,
  recentSearches,
  rememberSearch,
  searchEntries,
} from "@/modules/support";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { useHelpActions } from "./help-actions";
import { ChipTabs, EmptyBlock, HelpCard, Highlight } from "./help-ui";
import { openVideo, useHelpPaths, useHelpSearchEntries, videoDuration, type HelpSearchEntry } from "./use-help";

const POPULAR_TOPICS = ["forgotPassword", "joinLesson", "submitHomework", "paymentCharged", "notifications"];

function useResults(query: string) {
  const entries = useHelpSearchEntries();
  return useMemo(() => searchEntries(entries, query), [entries, query]);
}

function useOpenEntry() {
  const navigate = useNavigate();
  const paths = useHelpPaths();
  return (entry: HelpSearchEntry, query: string) => {
    rememberSearch(query);
    if (entry.kind === "video") openVideo(entry.video);
    else if (entry.kind === "faq") navigate(paths.faq(entry.id));
    else navigate(paths.article(entry.id));
  };
}

function EntryRow({ entry, query, onOpen }: { entry: HelpSearchEntry; query: string; onOpen: () => void }) {
  const { t } = useTranslation("help");
  const category = entry.kind === "article" ? findCategory(entry.article.category) : null;
  const icon = entry.kind === "video" ? "play-arrow" : entry.kind === "faq" ? "help" : entry.article.icon;
  const tone =
    entry.kind === "video" ? "bg-accent-violet-bg text-accent-violet-fg" : (category?.tone ?? "bg-brand-subtle text-brand");
  const meta =
    entry.kind === "article"
      ? `${t(`categories.${entry.article.category}.title`)} · ${t("search.readMinutes", { minutes: entry.article.minutes })}`
      : entry.kind === "video"
        ? entry.video.durationSeconds
          ? t("search.videoMeta", { duration: videoDuration(entry.video.durationSeconds) })
          : t("search.videoMetaNoDuration")
        : t("search.faqMeta");
  return (
    <button
      type="button"
      className="flex min-h-[69px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-subtle"
      onClick={onOpen}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-md ${tone}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="truncate text-title-sm font-semibold text-ink">
          <Highlight text={entry.title} query={query} />
        </strong>
        <small className="truncate text-body-sm text-ink-secondary">{meta}</small>
      </span>
      <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
    </button>
  );
}

function grouped(results: HelpSearchEntry[]) {
  return {
    articles: results.filter((entry) => entry.kind !== "video"),
    videos: results.filter((entry) => entry.kind === "video"),
  };
}

export function HeroSearch() {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const { openNewTicket } = useHelpActions();
  const openEntry = useOpenEntry();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const results = useResults(query);
  const { articles, videos } = grouped(results);
  const showPanel = open && query.trim().length > 0;

  useEffect(() => {
    if (!showPanel) return undefined;
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showPanel]);

  function showAll() {
    rememberSearch(query);
    navigate(paths.search(query.trim()));
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <label className="flex h-13 items-center gap-3 rounded-full bg-surface px-4 text-ink">
        <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body-sm outline-none placeholder:text-ink-secondary"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && query.trim()) showAll();
            if (event.key === "Escape") setOpen(false);
          }}
          placeholder={t("home.search")}
          aria-label={t("home.search")}
        />
        {query ? (
          <button
            type="button"
            className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-ink-secondary transition-colors hover:text-ink"
            onClick={() => setQuery("")}
            aria-label={t("search.clear")}
          >
            <Icon name="close" size={14} />
          </button>
        ) : null}
      </label>

      {showPanel ? (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-surface text-ink shadow-xl ring-1 ring-line">
          {results.length ? (
            <>
              {articles.length ? (
                <>
                  <p className="px-4 pt-4 pb-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
                    {t("search.articles")} · {articles.length}
                  </p>
                  {articles.slice(0, 4).map((entry) => (
                    <EntryRow key={`${entry.kind}-${entry.id}`} entry={entry} query={query} onOpen={() => openEntry(entry, query)} />
                  ))}
                </>
              ) : null}
              {videos.length ? (
                <>
                  <p className="px-4 pt-4 pb-1 text-caption-strong tracking-wide text-ink-tertiary uppercase">
                    {t("search.videos")} · {videos.length}
                  </p>
                  {videos.slice(0, 2).map((entry) => (
                    <EntryRow key={`${entry.kind}-${entry.id}`} entry={entry} query={query} onOpen={() => openEntry(entry, query)} />
                  ))}
                </>
              ) : null}
              <button
                type="button"
                className="flex w-full items-center justify-between border-t border-line px-4 py-3 text-body-sm text-brand transition-colors hover:bg-subtle"
                onClick={showAll}
              >
                {t("search.allResults", { count: results.length })}
                <span className="text-caption text-ink-tertiary">{t("search.enter")} ↵</span>
              </button>
            </>
          ) : (
            <EmptyBlock
              plain
              icon="search"
              title={t("search.emptyTitle", { query: query.trim() })}
              text={t("search.emptyText")}
              action={{ label: t("home.send"), icon: "forum", onClick: () => openNewTicket() }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

type SearchTab = "all" | "articles" | "videos";

export function HelpSearchPage() {
  const { t } = useTranslation("help");
  const navigate = useNavigate();
  const paths = useHelpPaths();
  const isCompact = useIsCompact();
  const { openNewTicket } = useHelpActions();
  const openEntry = useOpenEntry();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [tab, setTab] = useState<SearchTab>("all");
  const [recent, setRecent] = useState(recentSearches);
  const entries = useHelpSearchEntries();
  const results = useResults(query);
  const { articles, videos } = grouped(results);
  const visible = tab === "articles" ? articles : tab === "videos" ? videos : results;
  const term = query.trim();

  function update(value: string) {
    setQuery(value);
    setTab("all");
    const next = new URLSearchParams(params);
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    setParams(next, { replace: true });
  }

  const suggestions = term ? results.filter((entry) => entry.kind === "article").slice(0, 4) : [];
  const popular = entries.filter((entry) => entry.kind === "article" && POPULAR_TOPICS.includes(entry.id));

  const searchField = (
    <div className="flex items-center gap-3">
      <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border-[1.5px] border-transparent bg-surface px-3.5 focus-within:border-focus">
        <Icon name="search" size={20} className="shrink-0 text-ink-secondary" />
        <input
          autoFocus
          className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-secondary"
          value={query}
          onChange={(event) => update(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && term) setRecent(rememberSearch(term));
          }}
          placeholder={t("home.search")}
          aria-label={t("home.search")}
        />
        {query ? (
          <button
            type="button"
            className="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-ink-secondary hover:text-ink"
            onClick={() => update("")}
            aria-label={t("search.clear")}
          >
            <Icon name="close" size={14} />
          </button>
        ) : null}
      </label>
      {isCompact ? (
        <button type="button" className="shrink-0 text-body-sm text-brand" onClick={() => navigate(paths.home)}>
          {t("search.cancel")}
        </button>
      ) : null}
    </div>
  );

  const pills = (items: Array<{ id: string; label: string; run: () => void }>) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="flex h-11 items-center rounded-full border border-line bg-surface px-4 text-body-sm text-ink transition-colors hover:bg-subtle"
          onClick={item.run}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const recentBlock = recent.length ? (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-title font-normal text-ink">{t("search.recent")}</h2>
        <button type="button" className="text-body-sm text-brand" onClick={() => setRecent(clearRecentSearches())}>
          {t("search.clear")}
        </button>
      </div>
      {pills(recent.map((item) => ({ id: item, label: item, run: () => update(item) })))}
    </section>
  ) : null;

  const body = term && term.length < 4 && suggestions.length ? (
    <>
      {recentBlock}
      <section className="flex flex-col gap-3">
        <h2 className="text-title font-normal text-ink">{t("search.suggestions")}</h2>
        <HelpCard className="py-1">
          {suggestions.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="flex min-h-[69px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-subtle"
              onClick={() => openEntry(entry, term)}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-subtle text-brand">
                <Icon name="search" size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <strong className="truncate text-title-sm font-semibold text-ink">
                  <Highlight text={entry.title} query={term} />
                </strong>
                {entry.kind === "article" ? (
                  <small className="truncate text-body-sm text-ink-secondary">{t(`categories.${entry.article.category}.title`)}</small>
                ) : null}
              </span>
              <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
            </button>
          ))}
        </HelpCard>
      </section>
    </>
  ) : !term ? (
    <>
      {recentBlock}
      <section className="flex flex-col gap-3">
        <h2 className="text-title font-normal text-ink">{t("search.popular")}</h2>
        {pills(popular.map((entry) => ({ id: entry.id, label: entry.title, run: () => openEntry(entry, entry.title) })))}
      </section>
    </>
  ) : results.length ? (
    <>
      {videos.length && articles.length ? (
        <ChipTabs
          items={[
            { id: "all" as const, label: `${t("search.allTab")} · ${results.length}` },
            { id: "articles" as const, label: `${t("search.articles")} · ${articles.length}` },
            { id: "videos" as const, label: `${t("search.videos")} · ${videos.length}` },
          ]}
          value={tab}
          onChange={setTab}
        />
      ) : null}
      <HelpCard className="py-1">
        {visible.map((entry) => (
          <EntryRow key={`${entry.kind}-${entry.id}`} entry={entry} query={query} onOpen={() => openEntry(entry, term)} />
        ))}
      </HelpCard>
      <HelpCard>
        <button
          type="button"
          className="flex items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-subtle"
          onClick={() => openNewTicket()}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-success-bg text-success-fg">
            <Icon name="forum" size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="text-title-sm font-semibold text-ink">{t("search.notFound")}</strong>
            <small className="text-body-sm text-ink-secondary">{t("search.notFoundHint")}</small>
          </span>
          <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
        </button>
      </HelpCard>
    </>
  ) : (
    <>
      <EmptyBlock
        icon="search"
        title={isCompact ? t("search.emptyTitleShort") : t("search.emptyTitle", { query: term })}
        text={t("search.emptyTextLong")}
        action={{ label: t("home.send"), icon: "add", onClick: () => openNewTicket() }}
      />
      <section className="flex flex-col gap-3">
        <h2 className="text-title font-normal text-ink">{t("search.popular")}</h2>
        {pills(popular.map((entry) => ({ id: entry.id, label: entry.title, run: () => openEntry(entry, entry.title) })))}
      </section>
    </>
  );

  if (isCompact)
    return (
      <div className="flex h-full min-h-0 flex-col bg-canvas bg-auth-gradient font-body text-ink">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-6 [&>*]:shrink-0">
          {searchField}
          {body}
        </div>
      </div>
    );

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <button type="button" className="flex items-center gap-1 self-start text-body-xs text-brand" onClick={() => navigate(paths.home)}>
        <Icon name="arrow-back" size={14} />
        {t("ticket.helpCenter")}
      </button>
      {searchField}
      {body}
    </div>
  );
}
