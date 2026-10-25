import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ConversationActionsSheet,
  matchesConversationFilter,
  useConversationFilter,
  useConversations,
  useNewConversationStore,
  type ConversationFilter,
} from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { formatMessageTime } from "@/shared/lib";
import { Avatar } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import type { Conversation } from "@/shared/types";

const FILTERS: ConversationFilter[] = ["all", "group", "direct", "unread"];

function preview(conversation: Conversation, youLabel: string): string {
  if (!conversation.lastMessage) return "";
  const sender = conversation.lastSender;
  if (!sender) return conversation.lastMessage;
  return `${sender === "me" ? youLabel : sender}: ${conversation.lastMessage}`;
}

export function ConversationListPanel() {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { filter, setFilter } = useConversationFilter();
  const [search, setSearch] = useState("");
  const [actionsFor, setActionsFor] = useState<Conversation | null>(null);
  const [actionsAt, setActionsAt] = useState<{ x: number; y: number } | null>(null);
  const openNewConversation = useNewConversationStore((state) => state.setOpen);
  const { data = [], isLoading, isError, refetch } = useConversations("teacher");

  const query = search.trim().toLowerCase();

  const visible = useMemo(() => {
    const rows = data
      .filter((item) => matchesConversationFilter(item, filter))
      .filter((item) => (query ? item.title.toLowerCase().includes(query) : true));
    return [...rows].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [data, filter, query]);

  const unreadTotal = data.reduce((sum, item) => sum + (item.unreadCount > 0 ? 1 : 0), 0);

  return (
    <section
      className="flex h-full w-[360px] shrink-0 flex-col border-r border-line-subtle bg-surface"
      aria-label={t("panel.listAria")}
    >
      <header className="flex shrink-0 items-start gap-3 px-5 pt-6 pb-4">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <small className="truncate text-caption text-ink-tertiary">
            {unreadTotal
              ? t("panel.unreadCount", { count: unreadTotal })
              : t("panel.allRead")}
          </small>
          <h1 className="truncate font-heading text-h1 text-ink">{t("panel.title")}</h1>
        </span>

        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-icon transition-colors hover:bg-muted"
          aria-label={t("panel.newDirect")}
          onClick={() => openNewConversation(true)}
        >
          <Icon name="edit" size={20} />
        </button>
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-icon transition-colors hover:bg-muted"
          aria-label={t("panel.newGroup")}
          onClick={() => openNewConversation(true)}
        >
          <Icon name="add" size={20} />
        </button>
      </header>

      <label className="mx-5 flex h-11 shrink-0 items-center gap-2.5 px-[18px]">
        <Icon name="search" size={20} className="shrink-0 text-icon-tertiary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-tertiary"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("panel.searchPlaceholder")}
          aria-label={t("panel.searchAria")}
        />
        {search ? (
          <button
            type="button"
            className="grid size-7 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink"
            onClick={() => setSearch("")}
            aria-label={t("panel.closeSearchAria")}
          >
            <Icon name="close" size={18} />
          </button>
        ) : null}
      </label>

      {query ? (
        <p className="shrink-0 px-5 pt-5 pb-2 text-title-sm text-ink">
          {t("panel.resultCount", { count: visible.length })}
        </p>
      ) : (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-5 pt-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
          {FILTERS.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              className={`flex h-9 shrink-0 items-center rounded-full px-4 text-label transition-colors ${
                filter === id
                  ? "bg-brand text-ink-inverse"
                  : "text-ink-secondary hover:bg-subtle hover:text-ink"
              }`}
              onClick={() => setFilter(id)}
            >
              {t(`panel.filters.${id}`)}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-5">
        {isLoading
          ? Array.from({ length: 6 }, (_, index) => (
              <span key={index} className="flex items-center gap-3 px-4 py-4">
                <span className="size-12 shrink-0 animate-pulse rounded-xl bg-muted" />
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <i className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
                  <i className="h-2.5 w-4/5 animate-pulse rounded-full bg-muted" />
                </span>
              </span>
            ))
          : null}

        {isError ? (
          <ListState
            icon="wifi"
            title={t("panel.loadError")}
            hint={t("panel.loadErrorHint")}
            actionLabel={t("panel.retry")}
            actionIcon="refresh"
            onAction={() => refetch()}
          />
        ) : null}

        {!isLoading && !isError && !visible.length ? (
          <ListState
            icon="search"
            title={t("panel.emptyTitle")}
            hint={t("panel.emptyHint")}
            actionLabel={t("panel.clearFilters")}
            onAction={() => {
              setFilter("all");
              setSearch("");
            }}
          />
        ) : null}

        {!isLoading && !isError
          ? visible.map((conversation) => {
              const active = conversation.id === conversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`flex items-center gap-3 rounded-xl border-b border-line px-4 py-3.5 text-left transition-colors last:border-b-0 ${
                    active ? "bg-brand-subtle" : "hover:bg-subtle"
                  }`}
                  onClick={() => navigate(ROUTES.teacher.chat(conversation.id))}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setActionsAt({ x: event.clientX, y: event.clientY });
                    setActionsFor(conversation);
                  }}
                >
                  {conversation.type === "group" ? (
                    <GroupTile
                      name={conversation.title}
                      tone={conversation.avatarTone}
                      className="size-12 rounded-xl text-title-sm"
                    />
                  ) : (
                    <Avatar
                      name={conversation.title}
                      tone={conversation.avatarTone}
                      src={conversation.imageUrl ?? undefined}
                      size="lg"
                      status={conversation.status === "online" ? "online" : undefined}
                    />
                  )}

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <strong className="truncate text-title-sm text-ink">
                      {conversation.title}
                    </strong>
                    {conversation.typing ? (
                      <small className="truncate text-body-sm text-brand">
                        {t("panel.typing", { name: conversation.typingName ?? "" })}
                      </small>
                    ) : (
                      <small className="flex min-w-0 items-center gap-1 text-body-sm text-ink-tertiary">
                        {conversation.lastSender === "me" ? (
                          <Icon name="done-all" size={16} className="shrink-0 text-brand" />
                        ) : null}
                        <span className="truncate">{preview(conversation, t("panel.you"))}</span>
                      </small>
                    )}
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-1">
                      {conversation.isPinned ? (
                        <Icon name="pin" size={14} className="text-icon-tertiary" />
                      ) : null}
                      <small
                        className={`text-caption ${
                          conversation.unreadCount ? "text-brand" : "text-ink-tertiary"
                        }`}
                      >
                        {conversation.updatedAt ? formatMessageTime(conversation.updatedAt) : ""}
                      </small>
                    </span>
                    {conversation.unreadCount ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-caption-strong text-ink-inverse">
                        {conversation.unreadCount}
                      </span>
                    ) : conversation.isMuted ? (
                      <Icon name="notifications-off" size={16} className="text-icon-tertiary" />
                    ) : null}
                  </span>
                </button>
              );
            })
          : null}
      </div>

      <ConversationActionsSheet
        conversation={actionsFor}
        anchor={actionsAt}
        onClose={() => {
          setActionsFor(null);
          setActionsAt(null);
        }}
      />
    </section>
  );
}

function ListState({
  icon,
  title,
  hint,
  actionLabel,
  actionIcon,
  onAction,
}: {
  icon: string;
  title: string;
  hint: string;
  actionLabel: string;
  actionIcon?: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 pt-16 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
        <Icon name={icon} size={28} />
      </span>
      <strong className="mt-2 font-heading text-h2 text-ink">{title}</strong>
      <p className="max-w-[260px] text-body-sm text-ink-secondary">{hint}</p>
      <button
        type="button"
        className="mt-3 flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
        onClick={onAction}
      >
        {actionIcon ? <Icon name={actionIcon} size={18} /> : null}
        {actionLabel}
      </button>
    </div>
  );
}
