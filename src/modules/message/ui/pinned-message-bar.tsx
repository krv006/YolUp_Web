import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";
import { useChatUiStore, usePinnedMessage } from "../model/chat-ui.store";

export function PinnedMessageBar({ roomId }: { roomId: string }) {
  const { t } = useTranslation("chat");
  const pinned = usePinnedMessage(roomId);
  const unpin = useChatUiStore((state) => state.unpin);

  if (!pinned) return null;

  return (
    <div className="flex shrink-0 items-start gap-3 border-b border-line bg-saffron-subtle px-4 py-2.5 lg:px-6">
      <span className="mt-0.5 h-9 w-0.5 shrink-0 rounded-full bg-saffron-strong" />
      <span className="flex min-w-0 flex-1 flex-col">
        <small className="text-caption-strong text-saffron-strong">{t("pinned.label")}</small>
        <span className="truncate text-body-sm text-ink">{pinned.text}</span>
      </span>
      <button
        className="grid size-8 shrink-0 place-items-center rounded-full text-saffron-strong transition-colors hover:bg-saffron/15"
        onClick={() => unpin(roomId)}
        aria-label={t("pinned.removeAria")}
      >
        <Icon name="add" size={17} className="rotate-45" />
      </button>
    </div>
  );
}
