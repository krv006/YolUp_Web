import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useConversations } from "@/modules/conversation";
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

  const items = (conversations.data ?? []).filter((item) =>
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
      variant="confirm"
      title={t("forward.title")}
      description={t("forward.description", { count: messages.length })}
      footer={
        <button
          type="button"
          className={dialogButton.primary}
          disabled={!selected.length || pending}
          onClick={() => onConfirm(selected)}
        >
          {t("forward.submit", { count: selected.length })}
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex h-12.5 items-center gap-3 border-b border-line-subtle px-1">
          <Icon name="search" size={18} className="shrink-0 text-icon-tertiary" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("forward.searchPlaceholder")}
          />
        </label>

        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {items.map((item) => {
            const checked = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                  checked ? "bg-brand-subtle" : "hover:bg-subtle"
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
                    className="size-10 rounded-md text-title-sm"
                  />
                ) : (
                  <Avatar
                    name={item.title}
                    tone={item.avatarTone}
                    src={item.imageUrl ?? undefined}
                    size="sm"
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title-sm text-ink">{item.title}</strong>
                  {item.memberCount ? (
                    <small className="truncate text-body-xs text-ink-tertiary">
                      {t("forward.memberCount", { count: item.memberCount })}
                    </small>
                  ) : null}
                </span>
                <span
                  className={`grid size-5.5 shrink-0 place-items-center rounded-xs ${
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
