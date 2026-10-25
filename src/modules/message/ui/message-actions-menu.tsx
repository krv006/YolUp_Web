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
  onPin?: (message: ChatMessage, pinned: boolean) => void;
  pinnedIds?: string[];
  capabilities?: MessageCapabilities;
}

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "😮", "🙏"];
const EDGE_GAP = 12;

export function MessageActionsMenu({
  message,
  position,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  onPin,
  pinnedIds = [],
  capabilities,
}: MessageActionsMenuProps) {
  const { t } = useTranslation("chat");
  const startSelection = useChatUiStore((state) => state.startSelection);
  const rights: MessageCapabilities = message?.capabilities ??
    capabilities ?? { reply: true, edit: false, delete: true, react: true };

  useEffect(() => {
    if (!message) return undefined;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [message, onClose]);

  if (!message) return null;

  const isPinned = pinnedIds.includes(message.id);

  const items = [
    {
      id: "reply",
      icon: "arrow-back",
      label: t("actionsMenu.reply"),
      run: () => onReply(message),
      hidden: rights.reply === false,
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
      run: () => onEdit(message),
      hidden: !rights.edit,
    },
    {
      id: "pin",
      icon: "pin",
      label: isPinned ? t("actionsMenu.unpin") : t("actionsMenu.pin"),
      run: () => onPin?.(message, isPinned),
      hidden: !rights.pin || !onPin,
    },
    {
      id: "forward",
      icon: "send",
      label: t("actionsMenu.forward"),
      run: () => (onForward ? onForward(message) : toast.info(t("actions.notAvailable"))),
      hidden: rights.forward === false,
    },
    {
      id: "select",
      icon: "check-circle",
      label: t("actionsMenu.select"),
      run: () => startSelection(message.id),
      hidden: false,
    },
  ].filter((item) => !item.hidden);

  const reactions = (
    <div className="flex items-center gap-1 rounded-full bg-surface p-1.5 shadow-xl">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="grid size-9 place-items-center rounded-full text-xl transition-colors hover:bg-subtle"
          onClick={() => {
            if (rights.react !== false) onReact(message, emoji);
            else toast.info(t("actions.notAvailable"));
            onClose();
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  const list = (
    <div className="flex flex-col rounded-lg bg-surface p-1.5 shadow-xl">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className="flex h-12 items-center gap-3 rounded-md px-3 text-left text-body text-ink transition-colors hover:bg-subtle"
          onClick={() => {
            item.run();
            onClose();
          }}
        >
          <Icon name={item.icon} size={20} className="shrink-0 text-icon-secondary" />
          {item.label}
        </button>
      ))}

      <span className="my-1.5 h-px shrink-0 bg-line-subtle" />

      {rights.delete === false ? null : (
        <button
          type="button"
          role="menuitem"
          className="flex h-12 items-center gap-3 rounded-md px-3 text-left text-body text-danger transition-colors hover:bg-danger-bg"
          onClick={() => {
            onDelete(message, "me");
            onClose();
          }}
        >
          <Icon name="logout" size={20} className="shrink-0" />
          {t("actionsMenu.deleteForMe")}
        </button>
      )}

      {rights.deleteEveryone ? (
        <button
          type="button"
          role="menuitem"
          className="flex h-12 items-center gap-3 rounded-md px-3 text-left text-body text-danger transition-colors hover:bg-danger-bg"
          onClick={() => {
            onDelete(message, "everyone");
            onClose();
          }}
        >
          <Icon name="logout" size={20} className="shrink-0" />
          {t("actionsMenu.deleteForEveryone")}
        </button>
      ) : null}
    </div>
  );

  const body = (
    <>
      <div className="flex items-center gap-1 border-b border-line px-2 py-2">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="grid size-9 place-items-center rounded-full text-xl transition-colors hover:bg-subtle"
            onClick={() => {
              if (rights.react !== false) onReact(message, emoji);
              else toast.info(t("actions.notAvailable"));
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
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
        {rights.delete === false ? null : (
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-left text-body text-danger transition-colors hover:bg-danger-bg"
            onClick={() => {
              onDelete(message, "me");
              onClose();
            }}
          >
            <Icon name="logout" size={18} className="shrink-0" />
            {t("actionsMenu.deleteForMe")}
          </button>
        )}
        {rights.deleteEveryone ? (
          <button
            type="button"
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-left text-body text-danger transition-colors hover:bg-danger-bg"
            onClick={() => {
              onDelete(message, "everyone");
              onClose();
            }}
          >
            <Icon name="logout" size={18} className="shrink-0" />
            {t("actionsMenu.deleteForEveryone")}
          </button>
        ) : null}
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
        ref={(node) => {
          if (!node) return;
          const left = Math.min(position.x, window.innerWidth - node.offsetWidth - EDGE_GAP);
          const top = Math.min(position.y, window.innerHeight - node.offsetHeight - EDGE_GAP);
          node.style.left = `${Math.max(EDGE_GAP, left)}px`;
          node.style.top = `${Math.max(EDGE_GAP, top)}px`;
        }}
        className="fixed z-50 hidden max-h-[calc(100dvh-24px)] w-62.5 flex-col items-start gap-2 lg:flex"
        role="menu"
        style={{ left: position.x, top: position.y }}
        initial={{ opacity: 0, scale: 0.96, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
      >
        {reactions}
        {list}
      </motion.div>
    </AnimatePresence>
  );
}
