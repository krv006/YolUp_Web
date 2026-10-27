import { Fragment, useRef, useState, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ConversationActionsSheet,
  useNewConversationStore,
  type ConversationActionsFocus,
} from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import type { Conversation } from "@/shared/types";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import {
  MobileEmptyCard,
  MobileSearchField,
  MobileSegment,
  MobileTitleHeader,
  mobileRoundButton,
} from "@/shared/ui/mobile-page";
import { ConversationRowBody } from "./conversation-row";
import { CONVERSATION_FILTERS, useConversationList } from "./use-conversation-list";

const LONG_PRESS_MS = 450;

export function MobileConversationList() {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const openNewConversation = useNewConversationStore((state) => state.setOpen);
  const {
    data,
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
  const [focus, setFocus] = useState<ConversationActionsFocus | null>(null);
  const pressTimer = useRef<number | null>(null);
  const pressed = useRef(false);

  const fresh = !isLoading && !isError && data.length === 0;
  const subtitle = isError
    ? t("panel.connectionLost")
    : fresh
      ? t("panel.freshStart")
      : unreadTotal
        ? t("panel.unreadCount", { count: unreadTotal })
        : t("panel.allRead");

  function openActions(conversation: Conversation, element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    pressed.current = true;
    setActionsFor(conversation);
    setFocus({
      rect: { top: rect.top, left: 16, width: window.innerWidth - 32, height: rect.height },
      content: <ConversationRowBody conversation={conversation} />,
    });
  }

  function startPress(event: PointerEvent<HTMLButtonElement>, conversation: Conversation) {
    pressed.current = false;
    const element = event.currentTarget;
    pressTimer.current = window.setTimeout(() => openActions(conversation, element), LONG_PRESS_MS);
  }

  function cancelPress() {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  return (
    <main
      className="h-full overflow-y-auto bg-canvas bg-auth-gradient px-4 pt-5.5 pb-32 font-body text-ink"
      aria-label={t("panel.listAria")}
    >
      <MobileTitleHeader
        eyebrow={subtitle}
        title={t("panel.title")}
        action={
          <button
            type="button"
            className={mobileRoundButton}
            aria-label={t("panel.newGroup")}
            onClick={() => openNewConversation(true)}
          >
            <Icon name="add" size={24} />
          </button>
        }
      />

      {fresh ? (
        <div className="mt-5.5">
          <MobileEmptyCard
            icon="chat"
            iconTone="text-ink"
            title={t("panel.noChatsTitle")}
            description={t("panel.noChatsTeacherHint")}
            action={{ label: t("panel.createGroup"), icon: "add", onClick: () => openNewConversation(true) }}
          />
        </div>
      ) : (
        <>
          <MobileSearchField
            className="mt-5.5"
            value={search}
            onChange={setSearch}
            placeholder={t("panel.searchPlaceholder")}
            ariaLabel={t("panel.searchAria")}
            clearLabel={t("panel.closeSearchAria")}
          />

          {query ? (
            <p className="mt-5 text-body text-ink">
              {t("panel.resultCount", { count: visible.length + peopleRows.length })}
            </p>
          ) : (
            <div className="mt-5">
              <MobileSegment
                scroll
                items={CONVERSATION_FILTERS.map((id) => ({ id, label: t(`panel.filters.${id}`) }))}
                value={filter}
                onChange={setFilter}
              />
            </div>
          )}

          {isLoading ? (
            <div className="mt-5 flex flex-col overflow-hidden rounded-xl bg-surface py-1">
              {Array.from({ length: 6 }, (_, index) => (
                <span key={index} className="flex animate-pulse items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <i className="size-12 shrink-0 rounded-xl bg-subtle not-italic" />
                  <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <i className="h-3 w-32 rounded-full bg-subtle not-italic" />
                    <i className="h-3 w-48 rounded-full bg-subtle not-italic" />
                  </span>
                </span>
              ))}
            </div>
          ) : null}

          {isError ? (
            <div className="mt-5">
              <MobileEmptyCard
                icon="wifi"
                title={t("panel.loadError")}
                description={t("panel.loadErrorHint")}
                action={{ label: t("panel.retry"), icon: "refresh", onClick: () => void refetch() }}
              />
            </div>
          ) : null}

          {!isLoading && !isError && !visible.length && !peopleRows.length ? (
            <div className="mt-5">
              <MobileEmptyCard
                icon="search"
                title={t("panel.emptyTitle")}
                description={t("panel.emptyHint")}
                action={{
                  label: t("panel.clearFilters"),
                  onClick: () => {
                    setFilter("all");
                    setSearch("");
                  },
                }}
              />
            </div>
          ) : null}

          {!isLoading && !isError && visible.length ? (
            <div className={`${query ? "mt-2.5" : "mt-5"} flex flex-col overflow-hidden rounded-xl bg-surface py-1`}>
              {visible.map((conversation, index) => (
                <Fragment key={conversation.id}>
                  {index > 0 ? <i className="h-px shrink-0 bg-line not-italic" aria-hidden="true" /> : null}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors select-none [-webkit-touch-callout:none] active:bg-subtle"
                    onPointerDown={(event) => startPress(event, conversation)}
                    onPointerUp={cancelPress}
                    onPointerLeave={cancelPress}
                    onPointerCancel={cancelPress}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      cancelPress();
                      openActions(conversation, event.currentTarget);
                    }}
                    onClick={() => {
                      if (pressed.current) {
                        pressed.current = false;
                        return;
                      }
                      navigate(ROUTES.teacher.chat(conversation.id));
                    }}
                  >
                    <ConversationRowBody conversation={conversation} />
                  </button>
                </Fragment>
              ))}
            </div>
          ) : null}

          {query && peopleRows.length ? (
            <>
              <p className="mt-6 text-body text-ink">{t("panel.peopleSection")}</p>
              <div className="mt-3 flex flex-col overflow-hidden rounded-xl bg-surface">
                {peopleRows.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="flex items-center gap-3 border-b border-line px-4 py-4 text-left last:border-b-0"
                    onClick={() => {
                      if (person.roomId) {
                        navigate(ROUTES.teacher.chat(person.roomId));
                        setSearch("");
                      }
                    }}
                  >
                    <Avatar name={person.name} src={person.avatar} size="sm" className="[&_.avatar]:size-12" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-title text-ink">{person.name}</strong>
                      <small className="truncate text-body-sm text-ink-secondary">@{person.username}</small>
                    </span>
                    <Icon name="more" size={22} className="shrink-0 text-ink-secondary" />
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}

      <ConversationActionsSheet
        conversation={actionsFor}
        focus={focus}
        onClose={() => {
          setActionsFor(null);
          setFocus(null);
        }}
      />
    </main>
  );
}
