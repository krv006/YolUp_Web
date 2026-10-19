import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";
import { useChatUiStore } from "../model/chat-ui.store";
import { DateSeparator } from "./date-separator";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { MessageActionsMenu } from "./message-actions-menu";
import { HomeworkMessageCard } from "@/modules/homework";
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
  pinnedIds?: string[];
  onPin?: (message: ChatMessage, pinned: boolean) => void;
  onForward?: (messages: ChatMessage[]) => void;
  onBulkDelete?: (messageIds: string[], scope: "me" | "everyone") => void;
}

type TimelineEntry = { kind: "message" | "assignment"; message: ChatMessage };

const SELECTION_ACTION =
  "flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 text-label-strong transition-colors hover:bg-subtle lg:px-4";

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
  pinnedIds = [],
  onPin,
  onForward,
  onBulkDelete,
}: MessageListProps) {
  const { t } = useTranslation("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const search = useChatUiStore((state) => state.search).trim();
  const serverSearch = useQuery({
    queryKey: messageKeys.search(conversation.id, search.toLowerCase()),
    queryFn: ({ signal }) => messageApi.search(conversation.id, search, { signal }),
    enabled: search.length > 0,
  });
  const matchedIds = new Set((serverSearch.data?.items ?? []).map((item) => item.id));
  const visible = search
    ? (messages ?? []).filter(
        (message) =>
          matchedIds.has(message.id) ||
          message.text.toLowerCase().includes(search.toLowerCase())
      )
    : (messages ?? []);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 20, y: 20 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenCountRef = useRef(0);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(conversation.unreadCount ?? 0);
  const [dividerId, setDividerId] = useState<string | null>(
    conversation.firstUnreadMessageId ?? null
  );
  const selected = useChatUiStore((state) => state.selected);
  const toggleSelected = useChatUiStore((state) => state.toggleSelected);
  const clearSelection = useChatUiStore((state) => state.clearSelection);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteForEveryone, setDeleteForEveryone] = useState(true);
  const selectionMode = selected.length > 0;
  const announcement = Boolean(conversation.announcementOnly);
  const searchIndex = useChatUiStore((state) => state.searchIndex);
  const setSearchCount = useChatUiStore((state) => state.setSearchCount);
  const activeMatchId = search ? (visible[searchIndex]?.id ?? null) : null;
  const timeline: TimelineEntry[] = visible.map((message) => ({
    kind: message.type === "assignment" && message.assignment ? ("assignment" as const) : ("message" as const),
    message,
  }));
  const matchRef = useRef<HTMLDivElement>(null);

  const serverTotal = serverSearch.data?.total ?? 0;

  useEffect(() => {
    if (search) setSearchCount(Math.max(visible.length, serverTotal));
  }, [search, visible.length, serverTotal, setSearchCount]);

  useEffect(() => {
    if (activeMatchId) matchRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeMatchId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setUnread(0);
  }, []);

  useEffect(() => clearSelection, [clearSelection, conversation.id]);

  useEffect(() => {
    const total = messages?.length ?? 0;
    const added = total - seenCountRef.current;
    const firstLoad = seenCountRef.current === 0;
    seenCountRef.current = total;
    if (added <= 0) return;
    if (atBottomRef.current) {
      scrollToBottom(total === added ? "auto" : "smooth");
      return;
    }
    if (firstLoad) return;
    setUnread((count) => count + added);
    setDividerId((current) => current ?? messages?.[total - added]?.id ?? null);
  }, [messages, scrollToBottom]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const bottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setUnread(0);
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
            {t("actionsMenu.selectedMessages", { count: selected.length })}
          </strong>
          <button
            type="button"
            className={`${SELECTION_ACTION} text-ink`}
            onClick={() => {
              const picked = (messages ?? []).filter((message) => selected.includes(message.id));
              if (onForward) onForward(picked);
              else toast.info(t("actions.notAvailable"));
            }}
          >
            <Icon name="send" size={18} />
            <span className="hidden lg:inline">{t("actionsMenu.forward")}</span>
          </button>
          <button
            type="button"
            className={`${SELECTION_ACTION} text-ink`}
            onClick={copySelection}
          >
            <Icon name="assign" size={18} />
            <span className="hidden lg:inline">{t("actionsMenu.copy")}</span>
          </button>
          <button
            type="button"
            className={`${SELECTION_ACTION} border-error-bg text-error-text hover:bg-error-bg`}
            onClick={() => setDeleteOpen(true)}
          >
            <Icon name="trash" size={18} />
            <span className="hidden lg:inline">{t("actionsMenu.delete")}</span>
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
        {search ? null : announcement ? (
          <div className="flex justify-center py-1">
            <span className="flex items-center gap-2 rounded-full bg-subtle px-3 py-1.5 text-caption text-ink-secondary">
              <Icon name="bell" size={14} className="shrink-0" />
              {t("list.announcementOn")}
            </span>
          </div>
        ) : null}
        {search ? null : <DateSeparator>{t("list.today")}</DateSeparator>}
        {search && serverTotal > visible.length ? (
          <p className="py-2 text-center text-caption text-ink-tertiary">
            {t("list.searchOlder", { count: serverTotal - visible.length })}
          </p>
        ) : null}
        {search && !visible.length && !serverSearch.isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-action-subtle text-action">
              <Icon name="search" size={26} />
            </span>
            <strong className="font-heading text-h3 text-ink">{t("list.searchEmpty")}</strong>
            <p className="max-w-[320px] text-body-sm text-ink-secondary">
              {t("list.searchEmptyHint", { query: search })}
            </p>
          </div>
        ) : null}
        {timeline.map((entry) =>
          entry.kind === "assignment" && entry.message.assignment ? (
            <div key={entry.message.id} className="flex justify-start">
              <HomeworkMessageCard
                assignment={entry.message.assignment}
                canReview={entry.message.senderId === currentUserId}
              />
            </div>
          ) : (
            <Fragment key={entry.message.id}>
              {dividerId === entry.message.id ? (
                <DateSeparator>{t("actionsMenu.newMessages", { count: unread })}</DateSeparator>
              ) : null}
              <div ref={entry.message.id === activeMatchId ? matchRef : undefined}>
                <MessageBubble
                  message={entry.message}
                  currentUserId={currentUserId}
                  selectionMode={selectionMode}
                  selected={selected.includes(entry.message.id)}
                  onToggleSelect={(item) => toggleSelected(item.id)}
                  onReply={onReply}
                  onReact={onReact}
                  onRetryMessage={onRetryMessage}
                  onOpenActions={(target, position) => {
                    const mobile = window.innerWidth <= 768;
                    const menuWidth = mobile ? 226 : 234;
                    const menuHeight = mobile ? 270 : 292;
                    setActionMessage(target);
                    setMenuPosition({
                      x: Math.max(
                        10,
                        Math.min(
                          mobile ? position.x - menuWidth / 2 : position.x,
                          window.innerWidth - menuWidth - 10
                        )
                      ),
                      y: Math.max(
                        64,
                        Math.min(
                          mobile ? position.y - 126 : position.y,
                          window.innerHeight - menuHeight - 10
                        )
                      ),
                    });
                  }}
                  highlighted={entry.message.id === activeMatchId}
                />
              </div>
            </Fragment>
          )
        )}
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
        icon={
          <span className="grid size-11 place-items-center rounded-full bg-error-bg text-error-text">
            <Icon name="trash" size={20} />
          </span>
        }
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
                const scope = deleteForEveryone ? "everyone" : "me";
                if (onBulkDelete) onBulkDelete(selected, scope);
                else
                  (messages ?? [])
                    .filter((message) => selected.includes(message.id))
                    .forEach((message) => onDelete(message, scope));
                setDeleteOpen(false);
                clearSelection();
              }}
            >
              {t("actionsMenu.delete")}
            </button>
          </>
        }
      >
        <label className="flex cursor-pointer items-center gap-3 text-body-sm text-ink">
          <input
            type="checkbox"
            className="size-5 accent-[var(--action-primary)]"
            checked={deleteForEveryone}
            onChange={(event) => setDeleteForEveryone(event.target.checked)}
          />
          {t("actionsMenu.deleteForEveryone")}
        </label>
      </AppDialog>

      <MessageActionsMenu
        message={actionMessage}
        position={menuPosition}
        onClose={() => setActionMessage(null)}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onReact={onReact}
        onPin={onPin}
        pinnedIds={pinnedIds}
        onForward={onForward ? (message) => onForward([message]) : undefined}
        capabilities={capabilities}
      />
    </div>
  );
}
