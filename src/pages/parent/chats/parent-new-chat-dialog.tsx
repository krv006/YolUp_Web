import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DIRECT_STATUS, useDirectStatusLabel, useRequestDirect, useTeachersForDirect, type DirectTeacher } from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

export function ParentNewChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const statusLabel = useDirectStatusLabel();
  const teachers = useTeachersForDirect(open);
  const request = useRequestDirect();

  function openChat(teacher: DirectTeacher) {
    if (teacher.roomId) {
      onOpenChange(false);
      navigate(ROUTES.parent.chat(teacher.roomId));
      return;
    }
    request.mutate(teacher.id, {
      onSuccess: (room) => {
        if (room.directStatus !== DIRECT_STATUS.ACTIVE) toast.success(t("chats.requestSent"));
        onOpenChange(false);
        navigate(ROUTES.parent.chat(room.id));
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  const items = teachers.data ?? [];

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      variant="adaptive"
      width="lg:max-w-110"
      title={t("chats.newTitle")}
      description={t("chats.newDescription")}
    >
      <ul className="flex flex-col overflow-hidden rounded-xl border border-line">
        {items.map((teacher) => {
          const locked = teacher.directStatus === DIRECT_STATUS.BLOCKED || teacher.directStatus === DIRECT_STATUS.SPAM;
          return (
            <li key={teacher.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <Avatar name={teacher.name} src={teacher.avatarUrl ?? undefined} size="sm" className="[&_.avatar]:size-10" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">{teacher.name}</strong>
                <small className="truncate text-body-xs text-ink-secondary">
                  @{teacher.username} · {statusLabel(teacher.directStatus)}
                </small>
              </span>
              <button
                type="button"
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-subtle px-3 text-caption-strong text-brand transition-colors hover:bg-tint disabled:opacity-50"
                disabled={locked || request.isPending}
                onClick={() => openChat(teacher)}
              >
                <Icon name="chat" size={16} />
                {teacher.roomId ? t("chats.open") : t("chats.request")}
              </button>
            </li>
          );
        })}
        {!items.length ? (
          <li className="px-4 py-6 text-center text-body-sm text-ink-secondary">
            {teachers.isLoading ? t("chats.loading") : t("chats.noTeachers")}
          </li>
        ) : null}
      </ul>
    </AppDialog>
  );
}
