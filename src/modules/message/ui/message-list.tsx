import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DateSeparator } from "./date-separator";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { MessageActionsMenu } from "./message-actions-menu";
import type { ChatMessage, Conversation, MessageCapabilities } from "@/shared/types";

export interface MessageListProps {
  messages?: ChatMessage[];
  conversation: Conversation;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage, scope: "me" | "everyone") => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onRetryMessage?: (message: ChatMessage) => void;
  currentUserId?: string | null;
  capabilities?: MessageCapabilities;
}

export function MessageList({
  messages,
  conversation,
  loading,
  error,
  onRetry,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onRetryMessage,
  currentUserId = null,
  capabilities,
}: MessageListProps) {
  const { t } = useTranslation("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 20, y: 20 });
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  if (loading)
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-hidden bg-canvas px-4 py-5 lg:px-6">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className={`h-16 w-3/5 max-w-[420px] animate-pulse rounded-2xl bg-muted ${
              index % 2 ? "self-end" : ""
            }`}
          />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-canvas px-6 text-center">
        <strong className="font-heading text-h3 text-ink">{t("list.loadError")}</strong>
        <p className="max-w-[320px] text-body-sm text-ink-secondary">{t("list.loadErrorHint")}</p>
        <button
          className="mt-3 flex h-12 items-center rounded-full bg-muted px-5 text-label-strong text-ink transition-colors hover:bg-subtle"
          onClick={onRetry}
        >
          {t("list.retry")}
        </button>
      </div>
    );

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas px-4 py-5 lg:px-6"
      role="log"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-3">
        <DateSeparator>{t("list.today")}</DateSeparator>
        {(messages ?? []).map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            onReply={onReply}
            onReact={onReact}
            onRetryMessage={onRetryMessage}
            onOpenActions={(selected, position) => {
              const mobile = window.innerWidth <= 768;
              const menuWidth = mobile ? 226 : 234;
              const menuHeight = mobile ? 270 : 292;
              setActionMessage(selected);
              setMenuPosition({
                x: Math.max(10, Math.min(mobile ? position.x - menuWidth / 2 : position.x, window.innerWidth - menuWidth - 10)),
                y: Math.max(64, Math.min(mobile ? position.y - 126 : position.y, window.innerHeight - menuHeight - 10)),
              });
            }}
          />
        ))}
        {conversation.typing && (
          <TypingIndicator name={conversation.typingName || conversation.title} />
        )}
        <div ref={bottomRef} />
      </div>
      <MessageActionsMenu
        message={actionMessage}
        position={menuPosition}
        onClose={() => setActionMessage(null)}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onReact={onReact}
        currentUserId={currentUserId}
        capabilities={capabilities}
      />
    </div>
  );
}
