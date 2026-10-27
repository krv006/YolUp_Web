import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/shared/ui/icon";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";

export interface PinnedMessageBarProps {
  roomId: string;
  canUnpin?: boolean;
  onUnpin?: (messageId: string) => void;
}

export function PinnedMessageBar({ roomId, canUnpin = true, onUnpin }: PinnedMessageBarProps) {
  const { t } = useTranslation("chat");
  const pinned = useQuery({
    queryKey: messageKeys.pinned(roomId),
    queryFn: ({ signal }) => messageApi.getPinned(roomId, { signal }),
    enabled: Boolean(roomId),
  });

  const items = pinned.data ?? [];
  const current = items[0];
  if (!current) return null;

  return (
    <>
    <div className="mx-4 mt-4 flex h-12 shrink-0 items-center gap-3 rounded-xl bg-surface pr-2 pl-4 lg:hidden">
      <Icon name="pin" size={18} className="shrink-0 text-brand" />
      <span className="min-w-0 flex-1 truncate text-body-sm text-ink">
        {current.text || t("pinned.attachment")}
      </span>
      {canUnpin ? (
        <button
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors hover:bg-subtle"
          onClick={() => onUnpin?.(current.messageId)}
          aria-label={t("pinned.removeAria")}
        >
          <Icon name="close" size={18} />
        </button>
      ) : null}
    </div>
    <div className="hidden shrink-0 items-start gap-3 border-b border-line bg-saffron-subtle px-4 py-2.5 lg:flex lg:px-6">
      <span className="mt-0.5 h-9 w-0.5 shrink-0 rounded-full bg-saffron-strong" />
      <span className="mt-1.5 shrink-0 text-saffron-strong">
        <Icon name="pin" size={16} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <small className="text-caption-strong text-saffron-strong">
          {items.length > 1
            ? `${t("pinned.label")} · ${items.length}`
            : t("pinned.label")}
        </small>
        <span className="truncate text-body-sm text-ink">
          {current.text || t("pinned.attachment")}
        </span>
      </span>
      {canUnpin ? (
        <button
          className="grid size-8 shrink-0 place-items-center rounded-full text-saffron-strong transition-colors hover:bg-saffron/15"
          onClick={() => onUnpin?.(current.messageId)}
          aria-label={t("pinned.removeAria")}
        >
          <Icon name="add" size={17} className="rotate-45" />
        </button>
      ) : null}
    </div>
    </>
  );
}
