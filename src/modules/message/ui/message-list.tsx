import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";
import { useChatUiStore } from "../model/chat-ui.store";
import { DateSeparator } from "./date-separator";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { MessageActionsMenu, type MessageMenuAnchor } from "./message-actions-menu";
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
  variant?: "default" | "workspace";
  onOpenAssignment?: (assignmentId: string) => void;
  assignmentSubmitted?: (assignmentId: string) => boolean | null;
}

type TimelineEntry = { kind: "message" | "assignment"; message: ChatMessage };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

const SELECTION_ACTION =
  "flex h-10 min-w-0 items-center justify-center gap-2 rounded-full px-3 text-button whitespace-nowrap transition-colors hover:bg-subtle";

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
  variant = "default",
  onOpenAssignment,
  assignmentSubmitted,
}: MessageListProps) {
  const workspace = variant === "workspace";
  const { t } = useTranslation("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const search = useChatUiStore((state) => state.search).trim();
  const serverSearch = useQuery({
    queryKey: messageKeys.search(conversation.id, search.toLowerCase()),
    queryFn: ({ signal }) => messageApi.search(conversation.id, search, { signal }),
    enabled: search.length > 0,
  });
  const matchedIds = new Set((serverSearch.data?.items ?? []).map((item) => item.id));
  const isCompact = useIsCompact();
  const matches = search
    ? (messages ?? []).filter(
        (message) =>
          matchedIds.has(message.id) ||
          message.text.toLowerCase().includes(search.toLowerCase())
      )
    : (messages ?? []);
  const visible = search && isCompact ? (messages ?? []) : matches;
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 20, y: 20 });
  const [menuAnchor, setMenuAnchor] = useState<MessageMenuAnchor | null>(null);
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
  const activeMatchId = search ? (matches[searchIndex]?.id ?? null) : null;
  const timeline: TimelineEntry[] = visible.map((message) => ({
    kind: message.type === "assignment" && message.assignment ? ("assignment" as const) : ("message" as const),
    message,
  }));
  const emptyCompact = (isCompact || workspace) && !search && !timeline.length && !conversation.typing;
  const canvas = workspace ? "" : "bg-canvas max-lg:bg-transparent";
  const matchRef = useRef<HTMLDivElement>(null);

  const serverTotal = serverSearch.data?.total ?? 0;

  useEffect(() => {
    if (search) setSearchCount(Math.max(matches.length, serverTotal));
  }, [search, matches.length, serverTotal, setSearchCount]);

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

  if (loading && workspace && !isCompact)
    return (
      <div className="flex flex-1 flex-col justify-end gap-[38px] overflow-hidden px-11 pb-7">
        {Array.from({ length: 4 }, (_, index) => (
          <RowSkeleton key={index} />
        ))}
      </div>
    );
  if (loading)
    return (
      <div className={`flex flex-1 flex-col gap-3 overflow-hidden px-4 py-5 lg:px-6 ${canvas}`}>
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
      <div className={`flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center ${canvas}`}>
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
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-2 lg:py-5 ${workspace ? "lg:px-7" : "lg:px-6"} ${canvas}`}
        role="log"
        aria-live="polite"
        ref={scrollRef}
        onScroll={handleScroll}
      >
      {emptyCompact ? (
        <div className="my-auto flex -translate-y-[41px] flex-col items-center rounded-2xl bg-surface px-6 pt-7 pb-[26px] text-center lg:mx-auto lg:w-full lg:max-w-[436px] lg:translate-y-0 lg:pb-7">
          <span className="grid size-18 place-items-center rounded-full bg-brand-subtle text-brand">
            <Icon name="forum" size={32} />
          </span>
          <strong className="mt-3 font-heading text-title font-bold tracking-tight text-ink">
            {conversation.kind === "course" ? t("list.emptyGroupTitle") : t("list.emptyTitle")}
          </strong>
          <p className="mt-3 max-w-[260px] text-body-sm text-ink-secondary">
            {conversation.kind === "course" ? t("list.emptyGroupHint") : t("list.emptyHint")}
          </p>
        </div>
      ) : null}
      <div className={`mx-auto mt-auto w-full max-w-[920px] flex-col gap-[11px] lg:gap-3 ${emptyCompact ? "hidden" : "flex"}`}>
        {search ? null : announcement ? (
          <div className="flex justify-center py-1">
            <span className="flex h-6 items-center gap-1.5 rounded-full bg-subtle px-3 text-caption text-ink-secondary lg:h-auto lg:gap-2 lg:py-1.5">
              <Icon name="person" size={14} className="shrink-0 lg:hidden" />
              <Icon name="bell" size={14} className="hidden shrink-0 lg:block" />
              <span className="lg:hidden">{t("list.announcementChip")}</span>
              <span className="hidden lg:inline">{t("list.announcementOn")}</span>
            </span>
          </div>
        ) : null}
        {search || emptyCompact ? null : (
          <div className={announcement ? "hidden lg:block" : undefined}>
            <DateSeparator>{t("list.today")}</DateSeparator>
          </div>
        )}
        {search && serverTotal > matches.length ? (
          <p className="hidden py-2 text-center text-caption text-ink-tertiary lg:block">
            {t("list.searchOlder", { count: serverTotal - matches.length })}
          </p>
        ) : null}
        {search && !matches.length && !serverSearch.isLoading && !isCompact ? (
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
        {timeline.map((entry, index) => {
          const previous = timeline[index - 1]?.message;
          const next = timeline[index + 1]?.message;
          const sameAs = (other?: ChatMessage) =>
            Boolean(
              other &&
                other.senderId === entry.message.senderId &&
                other.type !== "system" &&
                Math.abs(
                  new Date(other.createdAt).getTime() -
                    new Date(entry.message.createdAt).getTime()
                ) < GROUP_WINDOW_MS
            );
          const showName = !sameAs(previous);
          const showAvatar = !sameAs(next);
          return entry.kind === "assignment" && entry.message.assignment ? (
            <div key={entry.message.id} className="flex justify-start">
              <HomeworkMessageCard
                assignment={entry.message.assignment}
                canReview={entry.message.senderId === currentUserId}
                compact={workspace}
                submitted={assignmentSubmitted?.(entry.message.assignment.id) ?? null}
                onOpen={onOpenAssignment ? () => onOpenAssignment(entry.message.assignment?.id ?? "") : undefined}
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
                  showName={showName}
                  showAvatar={showAvatar}
                  selectionMode={selectionMode}
                  selected={selected.includes(entry.message.id)}
                  onToggleSelect={(item) => toggleSelected(item.id)}
                  onReply={onReply}
                  onReact={onReact}
                  onRetryMessage={onRetryMessage}
                  onOpenActions={(target, position, bubble) => {
                    if (bubble) {
                      const rect = bubble.getBoundingClientRect();
                      setMenuAnchor({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        html: bubble.outerHTML,
                        outgoing: target.senderId === currentUserId,
                      });
                    } else setMenuAnchor(null);
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
                {entry.message.failed ? (
                  <p className="mt-1.5 flex items-center justify-end gap-1 text-caption text-error-text lg:hidden">
                    <Icon name="refresh" size={15} />
                    <span>
                      {t("offline.failed")} ·{" "}
                      <button type="button" onClick={() => onRetryMessage?.(entry.message)}>
                        {t("offline.resend")}
                      </button>
                    </span>
                  </p>
                ) : null}
              </div>
            </Fragment>
          );
        })}
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
        layout={isCompact ? "centered" : "inline"}
        width={isCompact ? "max-w-82.5" : "lg:w-130"}
        titleClassName={isCompact ? "text-title-lg" : undefined}
        footerClassName={isCompact ? "-mt-1.5 flex-col gap-1 px-6 pb-6" : undefined}
        icon={
          <span
            className={`grid place-items-center rounded-full bg-error-bg text-error-text ${
              isCompact ? "size-14" : "size-11"
            }`}
          >
            <Icon name="trash" size={isCompact ? 24 : 20} />
          </span>
        }
        title={t("actionsMenu.deleteTitle", { count: selected.length })}
        description={t("actionsMenu.deleteDescription")}
        footer={
          <>
            {isCompact ? null : (
              <button
                type="button"
                className={dialogButton.secondary}
                onClick={() => setDeleteOpen(false)}
              >
                {t("actionsMenu.cancel")}
              </button>
            )}
            <button
              type="button"
              className={isCompact ? `${dialogButton.danger} h-13 w-full flex-none` : dialogButton.danger}
              onClick={() => {
                const scope = deleteForEveryone || isCompact ? "everyone" : "me";
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
            {isCompact ? (
              <button
                type="button"
                className="flex h-12 items-center justify-center text-button text-brand-strong transition-opacity hover:opacity-80"
                onClick={() => setDeleteOpen(false)}
              >
                {t("actionsMenu.cancel")}
              </button>
            ) : null}
          </>
        }
      >
        <label className="hidden cursor-pointer items-center gap-3 text-body-sm text-ink lg:flex">
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
        anchor={menuAnchor}
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

      {selectionMode ? (
        <div className="flex shrink-0 gap-2 bg-surface px-4 pt-3 pb-9 lg:hidden">
          <button
            type="button"
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-subtle text-button text-brand"
            onClick={() => {
              const picked = (messages ?? []).filter((message) => selected.includes(message.id));
              if (onForward) onForward(picked);
              else toast.info(t("actions.notAvailable"));
            }}
          >
            <Icon name="send" size={18} />
            {t("actionsMenu.forward")}
          </button>
          <button
            type="button"
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface text-button text-ink"
            onClick={copySelection}
          >
            <Icon name="assign" size={18} />
            {t("actionsMenu.copy")}
          </button>
          <button
            type="button"
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-danger-bg text-button text-error-text"
            onClick={() => setDeleteOpen(true)}
          >
            <Icon name="logout" size={18} />
            {t("actionsMenu.delete")}
          </button>
        </div>
      ) : null}

      {selectionMode ? (
        <div className="hidden shrink-0 flex-col gap-2 bg-canvas px-4 pb-4 lg:flex lg:px-6">
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2.5">
            <button
              type="button"
              className={`${SELECTION_ACTION} flex-1 text-ink`}
              onClick={() => {
                const picked = (messages ?? []).filter((message) => selected.includes(message.id));
                if (onForward) onForward(picked);
                else toast.info(t("actions.notAvailable"));
              }}
            >
              <Icon name="send" size={18} />
              {t("actionsMenu.forward")}
            </button>

            <button type="button" className={`${SELECTION_ACTION} flex-1 text-ink`} onClick={copySelection}>
              <Icon name="content-copy" size={18} />
              {t("actionsMenu.copy")}
            </button>

            <button
              type="button"
              className={`${SELECTION_ACTION} flex-1 bg-danger-bg text-danger hover:bg-danger-bg`}
              onClick={() => setDeleteOpen(true)}
            >
              <Icon name="delete" size={18} />
              {t("actionsMenu.delete")}
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3">
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-full text-icon-tertiary transition-colors hover:bg-subtle hover:text-ink"
              onClick={clearSelection}
              aria-label={t("actionsMenu.cancelSelection")}
            >
              <Icon name="close" size={18} />
            </button>

            <strong className="min-w-0 flex-1 truncate text-title-sm text-ink">
              {t("actionsMenu.selectedMessages", { count: selected.length })}
            </strong>

            <button
              type="button"
              className="shrink-0 text-button text-brand transition-opacity hover:opacity-80"
              onClick={clearSelection}
            >
              {t("actionsMenu.cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
