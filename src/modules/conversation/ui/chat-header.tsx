import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";

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

        <button
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-subtle"
          onClick={() => setInfoOpen(true)}
          aria-label={t("header.openInfoAria", { title: conversation.title })}
        >
          <MoreHorizontal size={20} />
        </button>
      </header>

      <ConversationInfoPanel
        conversation={conversation}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </>
  );
}
