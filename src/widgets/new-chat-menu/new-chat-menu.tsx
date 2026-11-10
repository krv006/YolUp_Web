import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCreateChannel, useNewConversationStore } from "@/modules/conversation";
import { useCreateClub } from "@/modules/course";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/shared/ui/legacy";
import { CreateAudienceDialog } from "./create-audience-dialog";

export function NewChatMenu({ children }: { children: ReactElement }) {
  const { t } = useTranslation("chat");
  const navigate = useNavigate();
  const openGroup = useNewConversationStore((state) => state.setOpen);
  const [dialog, setDialog] = useState<"channel" | "club" | null>(null);
  const createChannel = useCreateChannel();
  const createClub = useCreateClub();

  const items = [
    { id: "group", icon: "groups", run: () => openGroup(true) },
    { id: "channel", icon: "campaign", run: () => setDialog("channel") },
    { id: "club", icon: "mic", run: () => setDialog("club") },
  ] as const;

  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>{children}</DropdownTrigger>
        <DropdownContent align="end">
          {items.map((item) => (
            <DropdownItem key={item.id} onSelect={item.run}>
              <Icon name={item.icon} size={18} />
              {t(`create.menu.${item.id}`)}
            </DropdownItem>
          ))}
        </DropdownContent>
      </Dropdown>

      <CreateAudienceDialog
        open={dialog === "channel"}
        onOpenChange={(open) => setDialog(open ? "channel" : null)}
        kind="channel"
        pending={createChannel.isPending}
        onSubmit={(values, reset) =>
          createChannel.mutate(values, {
            onSuccess: (room) => {
              toast.success(t("create.channel.done"));
              reset();
              setDialog(null);
              navigate(ROUTES.teacher.chat(room.id));
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
      <CreateAudienceDialog
        open={dialog === "club"}
        onOpenChange={(open) => setDialog(open ? "club" : null)}
        kind="club"
        pending={createClub.isPending}
        onSubmit={(values, reset) =>
          createClub.mutate(values, {
            onSuccess: (club) => {
              toast.success(t("create.club.done"));
              reset();
              setDialog(null);
              if (club.chatRoomId) navigate(ROUTES.teacher.chat(club.chatRoomId));
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
    </>
  );
}
