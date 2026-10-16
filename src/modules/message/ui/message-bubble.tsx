import { CheckCheck, GraduationCap, RefreshCw, Reply } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMessageTime } from "@/shared/lib";
import { ROLES } from "@/shared/constants";
import { Avatar } from "@/shared/ui/legacy";
import type { ChatMessage } from "@/shared/types";
import { MessageAttachment } from "./message-attachment";
import { MessageText } from "./message-text";

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string | null;
  onReply: (message: ChatMessage) => void;
  onOpenActions: (message: ChatMessage, position: { x: number; y: number }) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onRetryMessage?: (message: ChatMessage) => void;
}

export function MessageBubble({
  message,
  currentUserId = null,
  onReply,
  onOpenActions,
  onReact,
  onRetryMessage,
}: MessageBubbleProps) {
  const { t } = useTranslation("chat");
  const outgoing = message.senderId === currentUserId;
  const isTeacherSender = message.senderRole === ROLES.TEACHER;
  const [dragging, setDragging] = useState(false);

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
      className={`group flex items-end gap-2 ${outgoing ? "flex-row-reverse" : ""} ${
        message.pending ? "opacity-70" : ""
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.16}
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_event, info) => {
        setDragging(false);
        if (Math.abs(info.offset.x) > 46) onReply(message);
      }}
      onDoubleClick={() => onReply(message)}
      onClick={(event) => {
        if (!dragging && window.matchMedia("(max-width: 768px), (pointer: coarse)").matches) {
          onOpenActions(message, {
            x: event.clientX || 20,
            y: event.clientY || window.innerHeight - 330,
          });
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenActions(message, { x: event.clientX, y: event.clientY });
      }}
    >
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
            {isTeacherSender && <GraduationCap size={12} />}
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
        {message.attachment && <MessageAttachment attachment={message.attachment} />}

        <span
          className={`flex items-center justify-end gap-1 font-numeric text-caption ${
            outgoing ? "text-on-action/75" : "text-ink-tertiary"
          }`}
        >
          {message.editedAt && <em className="not-italic">{t("bubble.edited")}</em>}
          <time>{formatMessageTime(message.createdAt)}</time>
          {outgoing && (
            <CheckCheck
              size={15}
              className={message.status === "read" ? "opacity-100" : "opacity-60"}
              aria-label={message.status}
            />
          )}
        </span>

        {message.failed ? (
          <button
            className="flex items-center gap-1 self-end text-caption-strong text-error-text"
            onClick={(event) => {
              event.stopPropagation();
              onRetryMessage?.(message);
            }}
          >
            <RefreshCw size={13} /> {t("bubble.retry")}
          </button>
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

      <span
        className="pointer-events-none mb-2 text-ink-tertiary opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      >
        <Reply size={16} />
      </span>
    </motion.div>
  );
}
