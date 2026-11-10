import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConversations } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { RowSkeleton } from "@/shared/ui/row-skeleton";
import { ConversationRowBody } from "@/widgets/chat-shell";
import { ParentNewChatDialog } from "./parent-new-chat-dialog";

export function ParentChatList({ activeId, compact }: { activeId?: string; compact: boolean }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const rooms = useConversations("parent");
  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      [...(rooms.data ?? [])]
        .filter((room) => (query ? room.title.toLowerCase().includes(query) : true))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [rooms.data, query]
  );

  return (
    <section
      className={`flex min-h-0 flex-col ${compact ? "h-full px-4 pt-6 pb-8" : "h-full w-90 shrink-0 border-r border-line-subtle bg-surface pt-6"}`}
    >
      <header className={`flex items-center gap-3 ${compact ? "" : "px-5"}`}>
        {compact ? (
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink"
            aria-label={t("chats.back")}
            onClick={() => navigate(ROUTES.parent.dashboard)}
          >
            <Icon name="arrow-back" size={22} />
          </button>
        ) : null}
        <h1 className="min-w-0 flex-1 truncate font-heading text-[26px]/9 font-semibold text-ink">{t("chats.title")}</h1>
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-action transition-opacity hover:opacity-90"
          aria-label={t("chats.newTitle")}
          title={t("chats.newTitle")}
          onClick={() => setNewOpen(true)}
        >
          <Icon name="add" size={22} />
        </button>
      </header>

      <label className={`mt-4 flex h-12 shrink-0 items-center gap-3 rounded-full border border-line bg-surface px-4 ${compact ? "" : "mx-5"}`}>
        <Icon name="search" size={20} className="shrink-0 text-icon-secondary" />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-tertiary"
          value={search}
          placeholder={t("chats.searchPlaceholder")}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className={`mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto ${compact ? "rounded-xl bg-surface" : ""}`}>
        {rooms.isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex h-18 items-center px-5">
                <RowSkeleton />
              </div>
            ))
          : visible.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`flex items-center gap-3 border-b border-line px-5 py-3 text-left transition-colors last:border-b-0 hover:bg-subtle ${
                  room.id === activeId ? "bg-brand-subtle" : ""
                }`}
                onClick={() => navigate(ROUTES.parent.chat(room.id))}
              >
                <ConversationRowBody conversation={room} />
              </button>
            ))}
        {!rooms.isLoading && !visible.length ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
              <Icon name="chat" size={28} />
            </span>
            <strong className="text-title text-ink">{query ? t("chats.noResults") : t("chats.emptyTitle")}</strong>
            {query ? null : (
              <>
                <p className="text-body-sm text-ink-secondary">{t("chats.emptyHint")}</p>
                <button
                  type="button"
                  className="mt-1 flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action"
                  onClick={() => setNewOpen(true)}
                >
                  <Icon name="add" size={18} />
                  {t("chats.newTitle")}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <ParentNewChatDialog open={newOpen} onOpenChange={setNewOpen} />
    </section>
  );
}
