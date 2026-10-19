import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Icon } from "@/shared/ui/icon";
import { useNewConversationStore } from "../model/new-conversation.store";
import { useConversations } from "../model/use-conversations";

export function ChatEmptyState({ onOpenConversations }: { onOpenConversations?: () => void }) {
  const { t } = useTranslation("chat");
  const { pathname } = useLocation();
  const isTeacher = !pathname.startsWith("/student");
  const { data = [], isLoading } = useConversations(isTeacher ? "teacher" : "student");
  const openNewConversation = useNewConversationStore((state) => state.setOpen);

  if (isLoading) {
    return (
      <section className="grid h-full w-full place-items-center bg-canvas">
        <span
          className="size-10 animate-spin rounded-full border-[3px] border-action-subtle border-t-action"
          role="status"
          aria-label={t("panel.loading")}
        />
      </section>
    );
  }

  if (data.length === 0) {
    return (
      <section className="flex h-full w-full flex-col items-center justify-center gap-4 bg-canvas px-8 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-action-subtle text-action">
          <Icon name="groups" size={32} />
        </span>
        <h2 className="font-heading text-h3 text-ink">{t("emptyState.noChatsTitle")}</h2>
        <p className="max-w-[330px] text-body-sm text-ink-secondary">
          {isTeacher ? t("emptyState.noChatsTeacher") : t("emptyState.noChatsStudent")}
        </p>
        <button
          className="mt-2 flex h-(--size-control-xl) items-center gap-2 rounded-full bg-action px-7 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={() => openNewConversation(true)}
        >
          <Icon name="add" size={18} />
          {isTeacher ? t("emptyState.createGroup") : t("emptyState.findTeacher")}
        </button>
      </section>
    );
  }

  return (
    <section className="flex h-full w-full flex-col items-center justify-center gap-4 bg-canvas px-8 text-center">
      <span className="grid size-24 place-items-center rounded-full bg-illustration text-white">
        <Icon name="nav-chat" size={40} />
      </span>
      <h2 className="font-heading text-h3 text-ink">{t("emptyState.title")}</h2>
      <p className="max-w-[360px] text-body-sm text-ink-secondary">{t("emptyState.description")}</p>
      {onOpenConversations ? (
        <button
          className="mt-2 flex h-(--size-control-xl) items-center gap-2 rounded-2xl bg-action px-6 text-label-strong text-on-action transition-colors hover:bg-action-hover"
          onClick={onOpenConversations}
        >
          {t("emptyState.openConversations")}
          <Icon name="chevron-right" size={18} />
        </button>
      ) : null}
    </section>
  );
}
