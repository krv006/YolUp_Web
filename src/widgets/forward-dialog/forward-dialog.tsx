import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useConversations } from "@/modules/conversation";
import type { ChatMessage, ConversationRole } from "@/shared/types";
import { AppDialog, dialogButton } from "@/shared/ui/app-dialog";
import { Avatar } from "@/shared/ui/legacy";
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
      title={t("forward.title")}
      description={t("forward.description", { count: messages.length })}
      footer={
        <>
          <button
            type="button"
            className={dialogButton.secondary}
            onClick={() => onOpenChange(false)}
          >
            {t("actionsMenu.cancel")}
          </button>
          <button
            type="button"
            className={dialogButton.primary}
            disabled={!selected.length || pending}
            onClick={() => onConfirm(selected)}
          >
            {t("actionsMenu.forward")}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex h-12 items-center gap-3 rounded-xl border border-line bg-canvas px-4">
          <Icon name="search" size={18} className="shrink-0 text-ink-tertiary" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-tertiary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("forward.searchPlaceholder")}
          />
        </label>

        <div className="flex max-h-[320px] flex-col overflow-y-auto">
          {items.map((item) => {
            const checked = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-subtle"
                onClick={() =>
                  setSelected((current) =>
                    checked ? current.filter((id) => id !== item.id) : [...current, item.id]
                  )
                }
              >
                <Avatar
                  name={item.title}
                  tone={item.avatarTone}
                  src={item.imageUrl ?? undefined}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{item.title}</span>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                    checked ? "border-action bg-action text-on-action" : "border-line"
                  }`}
                >
                  {checked ? <Icon name="check-circle" size={14} /> : null}
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
