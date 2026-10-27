import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatMessageTime } from "@/shared/lib";
import { ROLES } from "@/shared/constants";
import { Avatar } from "@/shared/ui/legacy";
import { Icon } from "@/shared/ui/icon";
import type { ChatMessage } from "@/shared/types";
import { MessageAttachment } from "./message-attachment";
import { VoiceMessage } from "./voice-message";
import { useChatUiStore } from "../model/chat-ui.store";
import { MessageText } from "./message-text";

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string | null;
  onReply: (message: ChatMessage) => void;
  onOpenActions: (
    message: ChatMessage,
    position: { x: number; y: number },
    bubble?: HTMLElement | null
  ) => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onRetryMessage?: (message: ChatMessage) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (message: ChatMessage) => void;
  highlighted?: boolean;
  /** Ketma-ket xabarlarda avatar va ism faqat guruhning oxirgi/birinchi xabarida ko'rsatiladi. */
  showAvatar?: boolean;
  showName?: boolean;
}

const SENDER_COLORS = ["text-action", "text-success-text", "text-saffron-strong", "text-link"];

function senderColor(id: string): string {
  let total = 0;
  for (const char of id) total += char.charCodeAt(0);
  return SENDER_COLORS[total % SENDER_COLORS.length];
}

const RECORDING_PATH = /\/recordings\/[\w-]+/;
const QUOTED_TITLE = /[“"']([^“”"']+)[”"']/;

function SystemMessage({ text }: { text: string }) {
  const { t } = useTranslation("chat");
  const path = text.match(RECORDING_PATH)?.[0] ?? null;

  if (path) {
    const title = text.match(QUOTED_TITLE)?.[1] ?? "";
    return (
      <div className="flex justify-end py-1">
        <div className="flex w-full max-w-[420px] items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action-subtle text-action">
            <Play size={18} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-label-strong text-ink">
              {t("system.recordingTitle")}
            </strong>
            <small className="truncate text-caption text-ink-tertiary">
              {title || t("system.recordingHint")}
            </small>
          </span>
          <Link
            to={path}
            className="flex h-9 shrink-0 items-center rounded-full bg-action px-4 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          >
            {t("system.recordingAction")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-1">
      <span className="max-w-[460px] rounded-full bg-subtle px-3 py-1 text-center text-caption text-ink-tertiary">
        {text}
      </span>
    </div>
  );
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
  showAvatar = true,
  showName = true,
}: MessageBubbleProps) {
  const { t } = useTranslation("chat");
  const outgoing = message.senderId === currentUserId;
  const searchTerm = useChatUiStore((state) => state.search);
  const isTeacherSender = message.senderRole === ROLES.TEACHER;
  const longPressRef = useRef<number | null>(null);

  function cancelLongPress() {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  if (message.type === "system") return <SystemMessage text={message.text} />;

  return (
    <motion.div
      className={`group relative flex items-end gap-2 ${outgoing ? "flex-row-reverse" : ""} ${
        message.pending ? "lg:opacity-70" : ""
      } ${selectionMode ? "cursor-pointer select-none" : ""} ${
        selected
          ? "rounded-xl bg-brand-subtle px-2 py-2 lg:rounded-2xl lg:bg-action-subtle/70 lg:p-0"
          : ""
      } ${highlighted ? "lg:rounded-2xl lg:ring-2 lg:ring-action" : ""}`}
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
        const bubble = event.currentTarget.querySelector<HTMLElement>("[data-bubble]");
        cancelLongPress();
        longPressRef.current = window.setTimeout(() => {
          longPressRef.current = null;
          onOpenActions(message, point, bubble);
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
        onOpenActions(
          message,
          { x: event.clientX, y: event.clientY },
          event.currentTarget.querySelector<HTMLElement>("[data-bubble]")
        );
      }}
    >
      {selectionMode ? (
        <span
          className={`mb-2 hidden size-5 shrink-0 place-items-center rounded-full border transition-colors lg:grid ${
            selected ? "border-action bg-action text-on-action" : "border-line bg-surface"
          }`}
          aria-hidden="true"
        >
          {selected ? <Icon name="check-circle" size={14} /> : null}
        </span>
      ) : null}

      {outgoing ? null : (
        <span className="mb-1 w-7 shrink-0 lg:w-8">
          {showAvatar ? (
            <Avatar name={message.senderName} size="sm" className="max-lg:[&_.avatar]:size-7" />
          ) : null}
        </span>
      )}

      <div
        data-bubble=""
        className={`flex w-66 max-w-[85%] flex-col gap-1 ${
          highlighted ? "max-lg:ring-[1.5px] max-lg:ring-saffron" : ""
        } rounded-lg px-3.5 pt-2.5 pb-2 text-[15px]/[22px] lg:w-auto lg:text-body lg:max-w-[560px] lg:gap-1.5 lg:px-4 lg:pt-3 lg:pb-3 ${
          outgoing
            ? "rounded-br-[6px] bg-brand text-on-action antialiased lg:rounded-br-sm"
            : "rounded-bl-[6px] bg-surface text-ink lg:rounded-bl-sm lg:shadow-xs"
        }`}
      >
        {message.senderName && !outgoing && showName && (
          <span
            className={`flex items-center gap-1 text-caption-strong ${senderColor(
              message.senderId || message.senderName
            )}`}
          >
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

        {message.text && (
          <MessageText text={message.text} highlight={highlighted ? searchTerm : undefined} />
        )}
        {message.attachment ? (
          message.attachment.kind === "voice" || message.attachment.mimeType?.startsWith("audio/") ? (
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
          {outgoing && message.failed ? (
            <>
              <Icon name="warning-fill" size={14} className="text-accent-red-bg lg:hidden" />
              <Icon name="warning" size={15} className="hidden text-accent-red-bg lg:block" />
            </>
          ) : outgoing && message.pending ? (
            <Icon name="schedule" size={14} />
          ) : outgoing ? (
            <Icon
              name="done-all"
              size={15}
              className={message.status === "read" ? "opacity-100" : "opacity-60"}
              title={message.status}
            />
          ) : null}
        </span>

        {message.failed ? (
          <span className="hidden items-center gap-1.5 self-end text-caption-strong text-error-text lg:flex">
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
