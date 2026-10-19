import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { useChatUiStore } from "../model/chat-ui.store";
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
  const search = useChatUiStore((state) => state.search).trim().toLowerCase();
  const visible = search
    ? (messages ?? []).filter((message) => message.text.toLowerCase().includes(search))
    : (messages ?? []);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 20, y: 20 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenCountRef = useRef(0);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(0);
  const [dividerId, setDividerId] = useState<string | null>(null);
  const selected = useChatUiStore((state) => state.selected);
  const toggleSelected = useChatUiStore((state) => state.toggleSelected);
  const clearSelection = useChatUiStore((state) => state.clearSelection);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const selectionMode = selected.length > 0;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setUnread(0);
    setDividerId(null);
  }, []);

  useEffect(() => clearSelection, [clearSelection, conversation.id]);

  useEffect(() => {
    const total = messages?.length ?? 0;
    const added = total - seenCountRef.current;
    seenCountRef.current = total;
    if (added <= 0) return;
    if (atBottomRef.current) {
      scrollToBottom(total === added ? "auto" : "smooth");
      return;
    }
    setUnread((count) => count + added);
    setDividerId((current) => current ?? messages?.[total - added]?.id ?? null);
  }, [messages, scrollToBottom]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const bottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) {
      setUnread(0);
      setDividerId(null);
    }
  }

  function copySelection() {
    const text = (messages ?? [])
      .filter((message) => selected.includes(message.id))
      .map((message) => message.text)
      .filter(Boolean)
      .join("\n");
    if (text) void navigator.clipboard.writeText(text);
    toast.success(t("actionsMenu.copied"));
    clearSelection();
  }

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
    <div className="relative flex min-h-0 flex-1 flex-col">
      {selectionMode ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-2.5 lg:px-6">
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            onClick={clearSelection}
            aria-label={t("actionsMenu.cancelSelection")}
          >
            <Icon name="add" size={20} className="rotate-45" />
          </button>
          <strong className="flex-1 text-label-strong text-ink">
            {t("actionsMenu.selectedCount", { count: selected.length })}
          </strong>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            onClick={copySelection}
            aria-label={t("actionsMenu.copy")}
          >
            <Icon name="assign" size={19} />
          </button>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            onClick={() => toast.info(t("actions.notAvailable"))}
            aria-label={t("actionsMenu.forward")}
          >
            <Icon name="send" size={19} />
          </button>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-error-text transition-colors hover:bg-error-bg"
            onClick={() => setDeleteOpen(true)}
            aria-label={t("actionsMenu.delete")}
          >
            <Icon name="trash" size={19} />
          </button>
        </div>
      ) : null}

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas px-4 py-5 lg:px-6"
        role="log"
        aria-live="polite"
        ref={scrollRef}
        onScroll={handleScroll}
      >
      <div className="mx-auto mt-auto flex w-full max-w-[920px] flex-col gap-3">
        {search ? null : <DateSeparator>{t("list.today")}</DateSeparator>}
        {search && !visible.length ? (
          <p className="py-10 text-center text-body-sm text-ink-tertiary">
            {t("list.searchEmpty")}
          </p>
        ) : null}
        {visible.map((message) => (
          <Fragment key={message.id}>
            {dividerId === message.id ? (
              <DateSeparator>{t("actionsMenu.newMessages", { count: unread })}</DateSeparator>
            ) : null}
            <MessageBubble
            message={message}
            currentUserId={currentUserId}
            selectionMode={selectionMode}
            selected={selected.includes(message.id)}
            onToggleSelect={(item) => toggleSelected(item.id)}
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
          </Fragment>
        ))}
        {!search && conversation.typing && (
          <TypingIndicator name={conversation.typingName || conversation.title} />
        )}
        <div ref={bottomRef} />
        </div>
      </div>

      {atBottom ? null : (
        <button
          type="button"
          className="absolute right-4 bottom-4 grid size-11 place-items-center rounded-full border border-line bg-surface text-ink shadow-lg transition-colors hover:bg-subtle lg:right-6"
          onClick={() => scrollToBottom()}
          aria-label={t("actionsMenu.scrollDown")}
        >
          <Icon name="chevron-down" size={20} />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-action px-1 font-numeric text-caption-strong text-on-action">
              {unread}
            </span>
          ) : null}
        </button>
      )}

      <AppDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="confirm"
        title={t("actionsMenu.deleteTitle", { count: selected.length })}
        description={t("actionsMenu.deleteDescription")}
        footer={
          <>
            <button
              type="button"
              className={dialogButton.secondary}
              onClick={() => setDeleteOpen(false)}
            >
              {t("actionsMenu.cancel")}
            </button>
            <button
              type="button"
              className={dialogButton.danger}
              onClick={() => {
                if (capabilities?.delete) {
                  (messages ?? [])
                    .filter((message) => selected.includes(message.id))
                    .forEach((message) => onDelete(message, "everyone"));
                } else {
                  toast.info(t("actions.notAvailable"));
                }
                setDeleteOpen(false);
                clearSelection();
              }}
            >
              {t("actionsMenu.delete")}
            </button>
          </>
        }
      />

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
