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
  onVoice?: () => void;
  workspace?: boolean;
}

export function ChatHeader({
  conversation,
  backTo = "/teacher/chats",
  onToggleInfo,
  onVoice,
  workspace = false,
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
  const selectedCount = useChatUiStore((state) => state.selected.length);
  const clearSelection = useChatUiStore((state) => state.clearSelection);

  useEffect(() => {
    setSearchOpen(false);
    setSearch("");
  }, [conversation.id, setSearch]);

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

  const desk = (classes: string) => (workspace ? "" : classes);

  return (
    <>
      {selectedCount ? (
        <header className="flex shrink-0 items-center gap-3 bg-surface px-4 pt-5 pb-3 lg:hidden">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted"
            onClick={clearSelection}
            aria-label={t("actionsMenu.cancelSelection")}
          >
            <Icon name="close" size={22} />
          </button>
          <strong className="min-w-0 flex-1 truncate text-title-lg text-ink">
            {t("actionsMenu.selectedMessages", { count: selectedCount })}
          </strong>
          <button
            className="shrink-0 text-body-sm font-semibold text-brand-strong"
            onClick={clearSelection}
          >
            {t("actionsMenu.cancelShort")}
          </button>
        </header>
      ) : null}

      <header
        className={`shrink-0 items-center px-4 pt-5 lg:flex ${desk("lg:h-[76px] lg:gap-3 lg:pt-0")} lg:px-7 ${
          searchOpen ? "gap-1.5" : "gap-2.5"
        } ${
          selectedCount ? "hidden" : "flex"
        }`}
      >
        <button
          className={`grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted ${desk("lg:size-10 lg:text-icon")}`}
          onClick={() => navigate(backTo)}
          aria-label={t("header.backAria")}
        >
          <Icon name="chevron-left" size={22} />
        </button>

        {searchOpen ? (
          <>
            <label className="flex h-11 w-18.5 shrink-0 items-center gap-2 rounded-full bg-surface px-3.5 lg:h-12 lg:w-auto lg:min-w-0 lg:flex-1 lg:gap-3 lg:rounded-xl lg:border lg:border-action lg:px-4">
              <Icon name="search" size={20} className="shrink-0 text-ink lg:text-ink-tertiary" />
              <input
                autoFocus
                className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary max-lg:text-ellipsis"
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
            <span className="shrink-0 font-numeric text-body-xs text-ink max-lg:-mr-0.5 lg:text-body-sm lg:text-ink-tertiary">
              {searchCount ? searchIndex + 1 : 0} / {searchCount}
            </span>
            <button
              className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted disabled:opacity-40 lg:size-9 lg:bg-transparent lg:text-ink-secondary lg:hover:bg-subtle lg:hover:text-ink"
              onClick={() => stepSearch(-1)}
              disabled={!searchCount}
              aria-label={t("header.searchPrevAria")}
            >
              <Icon name="chevron-down" size={22} className="rotate-180 lg:size-4.5" />
            </button>
            <button
              className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted disabled:opacity-40 lg:size-9 lg:bg-transparent lg:text-ink-secondary lg:hover:bg-subtle lg:hover:text-ink"
              onClick={() => stepSearch(1)}
              disabled={!searchCount}
              aria-label={t("header.searchNextAria")}
            >
              <Icon name="chevron-down" size={22} className="lg:size-4.5" />
            </button>
            {onVoice ? (
              <button
                className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted lg:hidden"
                onClick={onVoice}
                aria-label={t("header.voiceAria")}
              >
                <Icon name="volume" size={22} />
              </button>
            ) : null}
            <button
              className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted lg:size-9 lg:bg-transparent lg:text-ink-secondary lg:hover:bg-subtle lg:hover:text-ink"
              onClick={closeSearch}
              aria-label={t("header.closeSearchAria")}
            >
              <Icon name="close" size={22} />
            </button>
          </>
        ) : (
          <button
            className={`flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl text-left transition-colors ${desk("lg:h-auto lg:gap-3 lg:px-1 lg:py-1 lg:hover:bg-subtle")}`}
            onClick={() => setInfoOpen(true)}
            aria-label={t("header.openInfoAria", { title: conversation.title })}
          >
            {conversation.type === "group" ? (
              <GroupTile
                name={conversation.title}
                tone={conversation.avatarTone}
                src={conversation.imageUrl}
                className={`size-11 rounded-lg ${desk("lg:size-10 lg:rounded-xl")}`}
              />
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
              <strong className={`truncate text-title text-ink ${desk("lg:text-title-lg")}`}>
                {conversation.title}
              </strong>
              <span className={`truncate text-body-xs text-ink-secondary ${desk("lg:text-body-sm lg:text-ink-tertiary")}`}>
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

        {searchOpen || conversation.type === "group" ? null : (
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted lg:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label={t("header.searchAria")}
          >
            <Icon name="search" size={20} />
          </button>
        )}

        {onVoice && !searchOpen && online ? (
          <button
            className={`grid size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted ${desk("lg:hidden")}`}
            onClick={onVoice}
            aria-label={t("header.voiceAria")}
          >
            <Icon name="volume" size={22} />
          </button>
        ) : null}

        <button
          className={`size-11 shrink-0 place-items-center rounded-full bg-subtle text-ink transition-colors hover:bg-muted lg:grid ${desk("lg:size-10 lg:text-icon")} ${
            searchOpen ? "hidden" : "grid"
          }`}
          onClick={() => (onToggleInfo ? onToggleInfo() : setInfoOpen(true))}
          aria-label={t("header.openInfoAria", { title: conversation.title })}
        >
          <Icon name="more" size={20} />
        </button>
      </header>

      {online ? null : (
        <div className="hidden shrink-0 items-center gap-2.5 bg-error-bg px-4 py-2.5 text-error-text lg:flex lg:px-6">
          <Icon name="error" size={17} className="shrink-0" />
          <span className="text-body-sm">{t("offline.banner")}</span>
        </div>
      )}

      {workspace ? null : <PinnedMessageBar roomId={conversation.id} />}

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
