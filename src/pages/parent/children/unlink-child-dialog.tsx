import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUnlinkChild, type ParentChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

export function UnlinkChildDialog({ child, open, onOpenChange }: { child: ParentChild; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const unlink = useUnlinkChild();
  const name = child.name.split(" ")[0] || child.name;

  return (
    <ConfirmDialog
      alert
      open={open}
      onOpenChange={onOpenChange}
      icon="link-off"
      title={t("profile.unlink.title", { name })}
      description={t("profile.unlink.description", { name })}
      confirmLabel={t("profile.unlink.confirm")}
      cancelLabel={t("profile.unlink.cancel")}
      pending={unlink.isPending}
      onConfirm={() =>
        unlink.mutate(child.linkId, {
          onSuccess: () => {
            onOpenChange(false);
            toast.success(t("profile.unlink.done", { name }));
            navigate(ROUTES.parent.children, { replace: true });
          },
          onError: () => toast.error(t("profile.unlink.failed")),
        })
      }
    />
  );
}
