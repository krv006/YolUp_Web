import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useConversations } from "@/modules/conversation";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { ChatMessage, ConversationRole } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
import { GroupTile } from "@/shared/ui/group-tile";
import { Icon } from "@/shared/ui/icon";

export interface ForwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  role?: ConversationRole;
  pending?: boolean;
  onConfirm: (roomIds: string[]) => void;
}

export function ForwardDialog({
  open,
  onOpenChange,
  messages,
  role = "teacher",
  pending = false,
  onConfirm,
}: ForwardDialogProps) {
  const { t } = useTranslation("chat");
  const conversations = useConversations(role);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const isCompact = useIsCompact();

  const sourceIds = new Set(messages.map((message) => message.conversationId));
  const items = (conversations.data ?? [])
    .filter((item) => !sourceIds.has(item.id))
    .filter((item) =>
      search ? item.title.toLowerCase().includes(search.trim().toLowerCase()) : true
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSelected([]);
          setSearch("");
        }
        onOpenChange(next);
      }}
      variant={isCompact ? "sheet" : "confirm"}
      title={t("forward.title")}
      description={t("forward.description", { count: messages.length })}
      titleClassName={isCompact ? "text-h2 leading-6 font-semibold" : undefined}
      closeClassName={isCompact ? "size-11" : undefined}
      footerClassName={isCompact ? "px-4 pt-6 pb-[max(30px,env(safe-area-inset-bottom))]" : undefined}
      footer={
        <button
          type="button"
          className={`${dialogButton.primary} ${isCompact ? "h-13" : ""}`}
          disabled={!selected.length || pending}
          onClick={() => onConfirm(selected)}
        >
          {t("forward.submit", { count: selected.length })}
        </button>
      }
    >
      <div className="flex flex-col gap-3 max-lg:-mt-0.5 max-lg:gap-5">
        <label className="flex h-11 items-center gap-3 px-4.5 lg:h-12.5 lg:border-b lg:border-line-subtle lg:px-1">
          <Icon name="search" size={18} className="shrink-0 text-ink-secondary lg:text-icon-tertiary" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-secondary lg:text-body lg:placeholder:text-ink-tertiary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("forward.searchPlaceholder")}
          />
        </label>

        <div className="flex max-h-80 flex-col overflow-y-auto lg:gap-1">
          {items.map((item) => {
            const checked = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`flex items-center gap-3 py-2.5 pr-2.5 text-left transition-colors lg:rounded-md lg:px-3 ${
                  checked ? "lg:bg-brand-subtle" : "lg:hover:bg-subtle"
                }`}
                onClick={() =>
                  setSelected((current) =>
                    checked ? current.filter((id) => id !== item.id) : [...current, item.id]
                  )
                }
              >
                {item.type === "group" ? (
                  <GroupTile
                    name={item.title}
                    tone={item.avatarTone}
                    className="size-11 text-title-sm max-lg:!rounded-[12px] lg:size-10 lg:!rounded-md"
                  />
                ) : (
                  <Avatar
                    name={item.title}
                    tone={item.avatarTone}
                    src={item.imageUrl ?? undefined}
                    size="sm"
                    className="max-lg:[&_.avatar]:size-11"
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink lg:text-title-sm">{item.title}</strong>
                  {item.memberCount ? (
                    <small className="truncate text-body-sm text-ink-secondary lg:text-body-xs lg:text-ink-tertiary">
                      {t("forward.memberCount", { count: item.memberCount })}
                    </small>
                  ) : null}
                </span>
                <span
                  className={`grid size-5.5 shrink-0 place-items-center rounded-[6px] lg:rounded-xs ${
                    checked
                      ? "bg-brand text-ink-inverse"
                      : "border-2 border-line-strong bg-surface"
                  }`}
                >
                  {checked ? <Icon name="check" size={14} /> : null}
                </span>
              </button>
            );
          })}
          {!items.length ? (
            <p className="py-8 text-center text-body-sm text-ink-tertiary">
              {t("forward.empty")}
            </p>
          ) : null}
        </div>
      </div>
    </AppDialog>
  );
}
