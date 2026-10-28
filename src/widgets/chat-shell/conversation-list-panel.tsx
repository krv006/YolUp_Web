import { Fragment, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRoleRoutes } from "@/modules/auth";
import { ConversationActionsSheet, useNewConversationStore } from "@/modules/conversation";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import type { Conversation } from "@/shared/types";
import { ConversationRowBody } from "./conversation-row";
import { CONVERSATION_FILTERS, useConversationList } from "./use-conversation-list";


export function ConversationListPanel() {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const routes = useRoleRoutes();
  const { conversationId } = useParams();
  const {
    isLoading,
    isError,
    refetch,
    filter,
    setFilter,
    search,
    setSearch,
    query,
    visible,
    peopleRows,
    unreadTotal,
  } = useConversationList();
  const [actionsFor, setActionsFor] = useState<Conversation | null>(null);
  const [actionsAt, setActionsAt] = useState<{ x: number; y: number } | null>(null);
  const openNewConversation = useNewConversationStore((state) => state.setOpen);

  return (
    <section
      className="flex h-full w-[360px] shrink-0 flex-col border-r border-line-subtle bg-surface"
      aria-label={t("panel.listAria")}
    >
      <header className="flex shrink-0 items-start gap-3 px-5 pt-7 pb-4.5">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <small className="truncate text-caption text-ink-secondary">
            {unreadTotal
              ? t("panel.unreadCount", { count: unreadTotal })
              : t("panel.allRead")}
          </small>
          <h1 className="truncate text-[24px]/[28px] font-bold text-ink">{t("panel.title")}</h1>
        </span>

        <button
          type="button"
          className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-icon transition-colors hover:bg-muted"
          aria-label={t("panel.newGroup")}
          onClick={() => openNewConversation(true)}
        >
          <Icon name="add" size={20} />
        </button>
      </header>

      <label className="mx-5 mt-0.5 flex h-11 shrink-0 items-center gap-2.5 px-4">
        <Icon name="search" size={20} className="shrink-0 text-icon-secondary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-secondary"
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
          {t("panel.resultCount", { count: visible.length + peopleRows.length })}
        </p>
      ) : (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-5 pt-4.5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
          {CONVERSATION_FILTERS.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={filter === id}
              className={`flex h-9 min-w-[101px] shrink-0 items-center justify-center rounded-full border px-5 text-body-sm font-medium whitespace-nowrap transition-colors ${
                filter === id
                  ? "border-brand bg-brand text-ink-inverse"
                  : "border-line bg-surface text-ink hover:bg-subtle"
              }`}
              onClick={() => setFilter(id)}
            >
              {t(`panel.filters.${id}`)}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-5">
        {isLoading
          ? Array.from({ length: 6 }, (_, index) => (
              <span key={index} className="mx-5 flex h-[72px] shrink-0 items-center px-4">
                <RowSkeleton />
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

        {!isLoading && !isError && !visible.length && !peopleRows.length ? (
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
          ? visible.map((conversation, index) => {
              const active = conversation.id === conversationId;
              return (
                <Fragment key={conversation.id}>
                  {index > 0 ? (
                    <i className="mx-5 h-px shrink-0 bg-line not-italic" aria-hidden="true" />
                  ) : null}

                  <button
                    type="button"
                    className={`mx-5 flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                      active ? "bg-brand-subtle" : "hover:bg-subtle"
                    }`}
                    onClick={() => navigate(routes.chat(conversation.id))}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setActionsAt({ x: event.clientX, y: event.clientY });
                      setActionsFor(conversation);
                    }}
                  >
                    <ConversationRowBody conversation={conversation} />
                  </button>
                </Fragment>
              );
            })
          : null}

        {query && peopleRows.length ? (
          <>
            <p className="px-5 pt-6 pb-3 text-title text-ink">
              {t("panel.peopleSection")}
            </p>

            {peopleRows.map((person) => (
              <button
                key={person.id}
                type="button"
                className="mx-5 flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-subtle"
                onClick={() => {
                  if (person.roomId) {
                    navigate(routes.chat(person.roomId));
                    setSearch("");
                  }
                }}
              >
                <Avatar name={person.name} src={person.avatar} size="sm" className="[&_.avatar]:size-10" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-ink">{person.name}</strong>
                  <small className="truncate text-body-xs text-ink-tertiary">
                    @{person.username}
                  </small>
                </span>
                {person.roomId ? (
                  <Icon name="chevron-right" size={18} className="shrink-0 text-icon-tertiary" />
                ) : (
                  <small className="shrink-0 text-body-xs text-brand">
                    {t("panel.startChat")}
                  </small>
                )}
              </button>
            ))}
          </>
        ) : null}
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
    <div className="flex flex-col items-center gap-2 px-9 pt-16 text-center">
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
