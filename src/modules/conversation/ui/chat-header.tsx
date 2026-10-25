import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOnlineStatus } from "@/shared/model";
import { Avatar } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";
import { PinnedMessageBar, useChatUiStore } from "@/modules/message";

import { ConversationInfoPanel } from "./conversation-info-panel";
import type { Conversation } from "@/shared/types";

export interface ChatHeaderProps {
  conversation: Conversation;
  backTo?: string;
  /** When given, the parent owns the info panel and the header only toggles it. */
  onToggleInfo?: () => void;
}

export function ChatHeader({
  conversation,
  backTo = "/teacher/chats",
  onToggleInfo,
}: ChatHeaderProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const infoOpen = params.has("info");

  function setInfoOpen(open: boolean) {
    const next = new URLSearchParams(params);
    if (open) next.set("info", "1");
    else next.delete("info");
    setParams(next, { replace: !open });
  }
  const search = useChatUiStore((state) => state.search);
  const searchOpen = useChatUiStore((state) => state.searchOpen);
  const setSearchOpen = useChatUiStore((state) => state.setSearchOpen);
  const setSearch = useChatUiStore((state) => state.setSearch);
  const online = useOnlineStatus();
  const searchIndex = useChatUiStore((state) => state.searchIndex);
  const searchCount = useChatUiStore((state) => state.searchCount);
  const stepSearch = useChatUiStore((state) => state.stepSearch);

  useEffect(() => {
    setSearchOpen(false);
    setSearch("");
  }, [conversation.id, setSearch]);

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 lg:h-[76px] lg:gap-3 lg:border-b-0 lg:bg-transparent lg:px-7">
        <button
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle lg:bg-subtle lg:text-icon lg:hover:bg-muted"
          onClick={() => navigate(backTo)}
          aria-label={t("header.backAria")}
        >
          <Icon name="arrow-back" size={22} className="lg:hidden" />
          <Icon name="chevron-left" size={22} className="hidden lg:block" />
        </button>

        {searchOpen ? (
          <>
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-action bg-surface px-4">
              <Icon name="search" size={18} className="shrink-0 text-ink-tertiary" />
              <input
                autoFocus
                className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeSearch();
                  if (event.key === "Enter") {
                    event.preventDefault();
                    stepSearch(event.shiftKey ? -1 : 1);
                  }
                }}
                placeholder={t("header.searchPlaceholder")}
                aria-label={t("header.searchPlaceholder")}
              />
            </label>
            <span className="shrink-0 font-numeric text-body-sm text-ink-tertiary">
              {searchCount ? searchIndex + 1 : 0} / {searchCount}
            </span>
            <button
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40"
              onClick={() => stepSearch(-1)}
              disabled={!searchCount}
              aria-label={t("header.searchPrevAria")}
            >
              <Icon name="chevron-down" size={18} className="rotate-180" />
            </button>
            <button
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink disabled:opacity-40"
              onClick={() => stepSearch(1)}
              disabled={!searchCount}
              aria-label={t("header.searchNextAria")}
            >
              <Icon name="chevron-down" size={18} />
            </button>
            <button
              className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
              onClick={closeSearch}
              aria-label={t("header.closeSearchAria")}
            >
              <Icon name="add" size={20} className="rotate-45" />
            </button>
          </>
        ) : (
          <button
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-subtle"
            onClick={() => setInfoOpen(true)}
            aria-label={t("header.openInfoAria", { title: conversation.title })}
          >
            {conversation.type === "group" ? (
              <GroupTile name={conversation.title} tone={conversation.avatarTone} />
            ) : (
              <Avatar
                name={conversation.title}
                tone={conversation.avatarTone}
                src={conversation.imageUrl}
                size="md"
                status={conversation.status}
              />
            )}
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-label-strong text-ink lg:text-title-lg">
                {conversation.title}
              </strong>
              <span className="truncate text-caption text-ink-tertiary lg:text-body-sm">
                {conversation.type === "group"
                  ? [
                      t("header.memberCount", { count: conversation.memberCount ?? 1 }),
                      conversation.onlineCount
                        ? t("header.onlineCount", { count: conversation.onlineCount })
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : conversation.status === "online"
                    ? t("header.online")
                    : t("header.recentlyActive")}
              </span>
            </span>
          </button>
        )}

        {searchOpen ? null : (
          <button
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle lg:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label={t("header.searchAria")}
          >
            <Icon name="search" size={19} />
          </button>
        )}

        <button
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle lg:border-0 lg:bg-subtle lg:text-icon lg:hover:bg-muted"
          onClick={() => (onToggleInfo ? onToggleInfo() : setInfoOpen(true))}
          aria-label={t("header.openInfoAria", { title: conversation.title })}
        >
          <Icon name="more" size={20} />
        </button>
      </header>

      {online ? null : (
        <div className="flex shrink-0 items-center gap-2.5 bg-error-bg px-4 py-2.5 text-error-text lg:px-6">
          <Icon name="error" size={17} className="shrink-0" />
          <span className="text-body-sm">{t("offline.banner")}</span>
        </div>
      )}

      <PinnedMessageBar roomId={conversation.id} />

      {onToggleInfo ? null : (
        <ConversationInfoPanel
          conversation={conversation}
          open={infoOpen}
          onOpenChange={setInfoOpen}
        />
      )}
    </>
  );
}
