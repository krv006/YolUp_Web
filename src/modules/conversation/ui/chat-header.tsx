import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import { PinnedMessageBar, useChatUiStore } from "@/modules/message";

import { ConversationInfoPanel } from "./conversation-info-panel";
import type { Conversation } from "@/shared/types";

export interface ChatHeaderProps {
  conversation: Conversation;
  backTo?: string;
}

export function ChatHeader({ conversation, backTo = "/teacher/chats" }: ChatHeaderProps) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const search = useChatUiStore((state) => state.search);
  const setSearch = useChatUiStore((state) => state.setSearch);

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
      <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:px-6">
        <button
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle lg:hidden"
          onClick={() => navigate(backTo)}
          aria-label={t("header.backAria")}
        >
          <Icon name="arrow-back" size={22} />
        </button>

        {searchOpen ? (
          <label className="flex h-11 flex-1 items-center gap-3 rounded-full border border-line bg-canvas px-4">
            <Icon name="search" size={18} className="shrink-0 text-ink-tertiary" />
            <input
              autoFocus
              className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && closeSearch()}
              placeholder={t("header.searchPlaceholder")}
              aria-label={t("header.searchPlaceholder")}
            />
            <button
              className="grid size-7 shrink-0 place-items-center rounded-full text-ink-tertiary hover:text-ink"
              onClick={closeSearch}
              aria-label={t("header.closeSearchAria")}
            >
              <Icon name="add" size={18} className="rotate-45" />
            </button>
          </label>
        ) : (
          <button
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-subtle"
            onClick={() => setInfoOpen(true)}
            aria-label={t("header.openInfoAria", { title: conversation.title })}
          >
            <Avatar
              name={conversation.title}
              tone={conversation.avatarTone}
              src={conversation.imageUrl}
              size="md"
              status={conversation.type === "direct" ? conversation.status : undefined}
            />
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-title text-ink">{conversation.title}</strong>
              <span className="truncate text-body-sm text-ink-tertiary">
                {conversation.type === "group"
                  ? t("header.memberCount", { count: conversation.memberCount ?? 1 })
                  : conversation.status === "online"
                    ? t("header.online")
                    : t("header.recentlyActive")}
              </span>
            </span>
          </button>
        )}

        {searchOpen ? null : (
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
            onClick={() => setSearchOpen(true)}
            aria-label={t("header.searchAria")}
          >
            <Icon name="search" size={19} />
          </button>
        )}

        <button
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
          onClick={() => setInfoOpen(true)}
          aria-label={t("header.openInfoAria", { title: conversation.title })}
        >
          <Icon name="more" size={20} />
        </button>
      </header>

      <PinnedMessageBar roomId={conversation.id} />

      <ConversationInfoPanel
        conversation={conversation}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </>
  );
}
