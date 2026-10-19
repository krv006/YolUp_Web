import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatMessageTime } from "@/shared/lib";
import { ROLES } from "@/shared/constants";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import type { ChatMessage } from "@/shared/types";
import { MessageAttachment } from "./message-attachment";
import { VoiceMessage } from "./voice-message";
import { MessageText } from "./message-text";

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string | null;
  onReply: (message: ChatMessage) => void;
  onOpenActions: (message: ChatMessage, position: { x: number; y: number }) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onRetryMessage?: (message: ChatMessage) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (message: ChatMessage) => void;
  highlighted?: boolean;
}

export function MessageBubble({
  message,
  currentUserId = null,
  onReply,
  onOpenActions,
  onReact,
  onRetryMessage,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  highlighted = false,
}: MessageBubbleProps) {
  const { t } = useTranslation("chat");
  const outgoing = message.senderId === currentUserId;
  const isTeacherSender = message.senderRole === ROLES.TEACHER;
  const longPressRef = useRef<number | null>(null);

  function cancelLongPress() {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  if (message.type === "system")
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-subtle px-3 py-1 text-caption text-ink-tertiary">
          {message.text}
        </span>
      </div>
    );

  return (
    <motion.div
      className={`group relative flex items-end gap-2 ${outgoing ? "flex-row-reverse" : ""} ${
        message.pending ? "opacity-70" : ""
      } ${selectionMode ? "cursor-pointer select-none" : ""} ${
        selected ? "rounded-2xl bg-action-subtle/70" : ""
      } ${highlighted ? "rounded-2xl ring-2 ring-action" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      drag={selectionMode ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.16}
      dragMomentum={false}
      onDragEnd={(_event, info) => {
        if (Math.abs(info.offset.x) > 46) onReply(message);
      }}
      onDoubleClick={() => onReply(message)}
      onPointerDown={(event) => {
        if (selectionMode || event.pointerType === "mouse") return;
        const point = { x: event.clientX, y: event.clientY };
        cancelLongPress();
        longPressRef.current = window.setTimeout(() => {
          longPressRef.current = null;
          onOpenActions(message, point);
        }, 450);
      }}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerMove={cancelLongPress}
      onClick={() => {
        if (selectionMode) onToggleSelect?.(message);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenActions(message, { x: event.clientX, y: event.clientY });
      }}
    >
      {selectionMode ? (
        <span
          className={`mb-2 grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
            selected ? "border-action bg-action text-on-action" : "border-line bg-surface"
          }`}
          aria-hidden="true"
        >
          {selected ? <Icon name="check-circle" size={14} /> : null}
        </span>
      ) : null}

      {outgoing ? null : (
        <span className="mb-1 shrink-0">
          <Avatar name={message.senderName} size="sm" />
        </span>
      )}

      <div
        className={`flex max-w-[78%] flex-col gap-1.5 rounded-2xl px-4 py-3 lg:max-w-[560px] ${
          outgoing
            ? "rounded-br-md bg-action text-on-action"
            : "rounded-bl-md border border-line bg-surface text-ink"
        }`}
      >
        {message.senderName && !outgoing && (
          <span className="flex items-center gap-1 text-caption-strong text-action">
            {isTeacherSender && <Icon name="school" size={13} />}
            {message.senderName}
          </span>
        )}

        {message.replyTo && (
          <div
            className={`flex flex-col gap-0.5 rounded-lg border-l-2 py-1 pl-2.5 ${
              outgoing
                ? "border-l-white/60 bg-white/15"
                : "border-l-action bg-action-subtle text-ink-secondary"
            }`}
          >
            <strong className="text-caption-strong">{message.replyTo.author}</strong>
            <span className="line-clamp-2 text-caption">{message.replyTo.text}</span>
          </div>
        )}

        {message.text && <MessageText text={message.text} />}
        {message.attachment ? (
          message.attachment.mimeType?.startsWith("audio/") ? (
            <VoiceMessage attachment={message.attachment} outgoing={outgoing} />
          ) : (
            <MessageAttachment
              attachment={message.attachment}
              failed={message.failed}
              uploading={message.pending}
            />
          )
        ) : null}

        <span
          className={`flex items-center justify-end gap-1 font-numeric text-caption ${
            outgoing ? "text-on-action/75" : "text-ink-tertiary"
          }`}
        >
          {message.editedAt && <em className="not-italic">{t("bubble.edited")}</em>}
          <time>{formatMessageTime(message.createdAt)}</time>
          {outgoing && (
            <Icon
              name="done-all"
              size={15}
              className={message.status === "read" ? "opacity-100" : "opacity-60"}
              title={message.status}
            />
          )}
        </span>

        {message.failed ? (
          <span className="flex items-center gap-1.5 self-end text-caption-strong text-error-text">
            <Icon name="error" size={14} />
            {t("offline.failed")}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={(event) => {
                event.stopPropagation();
                onRetryMessage?.(message);
              }}
            >
              {t("offline.retry")}
            </button>
          </span>
        ) : null}

        <AnimatePresence initial={false}>
          {message.reactions && message.reactions.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-1"
              aria-label={t("bubble.reactionsAria")}
              initial={{ opacity: 0, y: -18, scale: 0.68 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.72 }}
              transition={{ type: "spring", stiffness: 520, damping: 24 }}
            >
              {message.reactions.map((reaction) => (
                <motion.button
                  layout
                  key={`${reaction.emoji}-${reaction.count}-${reaction.reacted}`}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-numeric text-caption ${
                    reaction.reacted
                      ? "border-action bg-action-subtle text-action"
                      : "border-line bg-surface text-ink-secondary"
                  }`}
                  initial={{ opacity: 0, y: -22, scale: 0.35, rotate: -18 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, y: -10, scale: 0.45 }}
                  transition={{ type: "spring", stiffness: 640, damping: 21 }}
                  whileTap={{ scale: 0.82 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onReact(message, reaction.emoji);
                  }}
                >
                  <span>{reaction.emoji}</span>
                  {reaction.count}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectionMode ? null : (
        <span className="mb-2 hidden items-center gap-1 rounded-full border border-line bg-surface px-1 py-1 opacity-0 shadow-xs transition-opacity group-hover:opacity-100 lg:flex">
          <button
            type="button"
            className="grid size-7 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            onClick={(event) => {
              event.stopPropagation();
              onReply(message);
            }}
            aria-label={t("bubble.replyAria")}
          >
            <Icon name="arrow-back" size={16} />
          </button>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle hover:text-ink"
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              onOpenActions(message, { x: rect.left, y: rect.bottom + 6 });
            }}
            aria-label={t("bubble.moreAria")}
          >
            <Icon name="more" size={16} />
          </button>
        </span>
      )}
    </motion.div>
  );
}
