import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/shared/ui/icon";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  currentUserId?: string | null;
  capabilities?: MessageCapabilities;
}

const quickReactions = ["👍", "❤️", "🔥", "👏", "😁", "🤔"];

export function MessageActionsMenu({
  message,
  position,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onReact,
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

  useEffect(() => {
    if (!message) return undefined;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <>
          <motion.button
            className="message-menu-overlay"
            aria-label={t("actionsMenu.closeAria")}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="message-actions-menu"
            role="menu"
            style={{ left: position.x, top: position.y }}
            initial={{ opacity: 0, scale: 0.94, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14 }}
          >
            {capabilities.react ? <div
              className="message-reaction-picker"
              aria-label={t("actionsMenu.reactionsAria")}
            >
              {quickReactions.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ y: -3, scale: 1.08 }}
                  whileTap={{ scale: 1.28, rotate: -7 }}
                  onClick={() => {
                    onReact(message, emoji);
                    onClose();
                  }}
                  aria-label={t("actionsMenu.addReactionAria", { emoji })}
                >
                  {emoji}
                </motion.button>
              ))}
            </div> : null}
            {capabilities.react ? <span className="message-menu-divider" /> : null}
            {capabilities.reply ? <button
              role="menuitem"
              onClick={() => {
                onReply(message);
                onClose();
              }}
            >
              <Icon name="arrow-back" size={17} /> {t("actionsMenu.reply")}
            </button> : null}
            {capabilities.edit && outgoing && (
              <button
                role="menuitem"
                onClick={() => {
                  onEdit(message);
                  onClose();
                }}
              >
                <Icon name="edit" size={16} /> {t("actionsMenu.edit")}
              </button>
            )}
            <button
              role="menuitem"
              onClick={() => {
                if (pinned?.id === message.id) unpin(message.conversationId);
                else
                  pin(message.conversationId, {
                    id: message.id,
                    author: message.senderName,
                    text: message.text || message.attachment?.name || "",
                  });
                onClose();
              }}
            >
              <Icon name="pin" size={16} />{" "}
              {pinned?.id === message.id ? t("actionsMenu.unpin") : t("actionsMenu.pin")}
            </button>
            {capabilities.delete ? <span className="message-menu-divider" /> : null}
            {capabilities.delete ? <button
              role="menuitem"
              className="destructive"
              onClick={() => {
                onDelete(message, "me");
                onClose();
              }}
            >
              <Icon name="trash" size={16} /> {t("actionsMenu.deleteForMe")}
            </button> : null}
            {capabilities.delete && outgoing && (
              <button
                role="menuitem"
                className="destructive"
                onClick={() => {
                  onDelete(message, "everyone");
                  onClose();
                }}
              >
                <Icon name="groups" size={16} /> {t("actionsMenu.deleteForEveryone")}
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
