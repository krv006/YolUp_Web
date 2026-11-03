import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { parentFamily, useParentConsents, useSetParentConsent, type ConsentKind } from "@/modules/parent";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";
import { Switch } from "@/shared/ui/switch";

const CONSENTS: Array<{ kind: ConsentKind; icon: string; tone: string }> = [
  { kind: "recording", icon: "videocam-fill", tone: "bg-accent-blue-bg text-accent-blue-fg" },
  { kind: "camera", icon: "photo-camera-fill", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  { kind: "analytics", icon: "trending-up", tone: "bg-accent-green-bg text-accent-green-fg" },
];

export function ConsentSwitches({ childId, childName }: { childId: string; childName: string }) {
  const { t } = useTranslation("parent");
  const consents = useParentConsents();
  const setConsent = useSetParentConsent({ notify: false });
  const [turningOff, setTurningOff] = useState<ConsentKind | null>(null);

  function apply(kind: ConsentKind, value: boolean) {
    const label = t(`children.consentKinds.${kind}.label`);
    setConsent.mutate(
      { studentId: childId, kind, granted: value },
      { onSuccess: () => toast.success(t(value ? "profile.consentOn" : "profile.consentOff", { label })) }
    );
  }

  return (
    <>
      <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface">
        {CONSENTS.map((item) => (
          <li key={item.kind} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0 lg:px-5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>
              <Icon name={item.icon} size={22} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <strong className="text-title-sm text-ink">{t(`children.consentKinds.${item.kind}.label`)}</strong>
              <small className="truncate text-body-xs text-ink-secondary lg:whitespace-normal">
                {t(`children.consentKinds.${item.kind}.description`)}
              </small>
            </span>
            <Switch
              size="lg"
              checked={parentFamily.consentGranted(consents.data ?? [], childId, item.kind)}
              disabled={consents.isLoading || setConsent.isPending}
              aria-label={t(`children.consentKinds.${item.kind}.label`)}
              className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-line-strong"
              onCheckedChange={(next) => (next ? apply(item.kind, true) : setTurningOff(item.kind))}
            />
          </li>
        ))}
      </ul>
      <ConfirmDialog
        alert
        open={Boolean(turningOff)}
        onOpenChange={(open) => {
          if (!open) setTurningOff(null);
        }}
        icon={CONSENTS.find((item) => item.kind === turningOff)?.icon ?? "lock"}
        title={turningOff ? t(`profile.consentOffDialog.${turningOff}.title`) : ""}
        description={turningOff ? t(`profile.consentOffDialog.${turningOff}.description`, { name: childName.split(" ")[0] || childName }) : ""}
        confirmLabel={t("profile.consentOffDialog.confirm")}
        cancelLabel={t("profile.consentOffDialog.cancel")}
        pending={setConsent.isPending}
        onConfirm={() => {
          if (turningOff) apply(turningOff, false);
          setTurningOff(null);
        }}
      />
    </>
  );
}
