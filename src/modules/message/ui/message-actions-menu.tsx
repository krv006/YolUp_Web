import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Icon } from "@/shared/ui/icon";
import type { ChatMessage, MessageCapabilities } from "@/shared/types";
import { useChatUiStore } from "../model/chat-ui.store";

export interface MessageActionsMenuProps {
  message: ChatMessage | null;
  position: { x: number; y: number };
  onClose: () => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage, scope: "me" | "everyone") => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onForward?: (message: ChatMessage) => void;
  currentUserId?: string | null;
  capabilities?: MessageCapabilities;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏"];

export function MessageActionsMenu({
  message,
  position,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  currentUserId = null,
  capabilities = { reply: true, edit: false, delete: false, react: false },
}: MessageActionsMenuProps) {
  const { t } = useTranslation("chat");
  const outgoing = message?.senderId === currentUserId;
  const pinned = useChatUiStore((state) =>
    message ? state.pinned[message.conversationId] : undefined
  );
  const pin = useChatUiStore((state) => state.pin);
  const unpin = useChatUiStore((state) => state.unpin);
  const startSelection = useChatUiStore((state) => state.startSelection);

  useEffect(() => {
    if (!message) return undefined;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [message, onClose]);

  if (!message) return null;

  const isPinned = pinned?.id === message.id;

  const items = [
    {
      id: "reply",
      icon: "arrow-back",
      label: t("actionsMenu.reply"),
      run: () => onReply(message),
      hidden: !capabilities.reply,
    },
    {
      id: "copy",
      icon: "assign",
      label: t("actionsMenu.copy"),
      run: () => {
        void navigator.clipboard.writeText(message.text);
        toast.success(t("actionsMenu.copied"));
      },
      hidden: !message.text,
    },
    {
      id: "edit",
      icon: "edit",
      label: t("actionsMenu.edit"),
      run: () => (capabilities.edit ? onEdit(message) : toast.info(t("actions.notAvailable"))),
      hidden: !outgoing,
    },
    {
      id: "pin",
      icon: "pin",
      label: isPinned ? t("actionsMenu.unpin") : t("actionsMenu.pin"),
      run: () =>
        isPinned
          ? unpin(message.conversationId)
          : pin(message.conversationId, {
              id: message.id,
              author: message.senderName,
              text: message.text || message.attachment?.name || "",
            }),
      hidden: false,
    },
    {
      id: "forward",
      icon: "send",
      label: t("actionsMenu.forward"),
      run: () => (onForward ? onForward(message) : toast.info(t("actions.notAvailable"))),
      hidden: false,
    },
    {
      id: "select",
      icon: "check-circle",
      label: t("actionsMenu.select"),
      run: () => startSelection(message.id),
      hidden: false,
    },
  ].filter((item) => !item.hidden);

  const body = (
    <>
      <div className="flex items-center gap-1 border-b border-line px-2 py-2">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="grid size-9 place-items-center rounded-full text-xl transition-colors hover:bg-subtle"
            onClick={() => {
              if (capabilities.react) onReact(message, emoji);
              else toast.info(t("actions.notAvailable"));
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
        <span className="grid size-9 place-items-center rounded-full text-ink-tertiary">
          <Icon name="emoji" size={18} />
        </span>
      </div>

      <div className="flex flex-col py-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-left text-body text-ink transition-colors hover:bg-subtle"
            onClick={() => {
              item.run();
              onClose();
            }}
          >
            <Icon name={item.icon} size={18} className="shrink-0 text-ink-secondary" />
            {item.label}
          </button>
        ))}
        <button
          type="button"
          role="menuitem"
          className="flex items-center gap-3 px-4 py-2.5 text-left text-body text-error-text transition-colors hover:bg-error-bg"
          onClick={() => {
            if (capabilities.delete) onDelete(message, "everyone");
            else toast.info(t("actions.notAvailable"));
            onClose();
          }}
        >
          <Icon name="trash" size={18} className="shrink-0" />
          {t("actionsMenu.delete")}
        </button>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      <motion.button
        key="overlay"
        className="fixed inset-0 z-40 bg-scrim lg:bg-transparent"
        aria-label={t("actionsMenu.closeAria")}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        key="sheet"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl lg:hidden"
        role="menu"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
      >
        <span className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted" aria-hidden="true" />
        {body}
      </motion.div>

      <motion.div
        key="menu"
        className="fixed z-50 hidden w-[240px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl lg:flex"
        role="menu"
        style={{ left: position.x, top: position.y }}
        initial={{ opacity: 0, scale: 0.96, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
      >
        {body}
      </motion.div>
    </AnimatePresence>
  );
}
