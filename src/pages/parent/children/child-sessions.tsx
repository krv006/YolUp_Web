import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useChildSessions, useEndAllChildSessions, useEndChildSession } from "@/modules/parent";
import { formatRelativeShort } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Icon } from "@/shared/ui/icon";

export function ChildSessions({ childId, childName, enabled }: { childId: string; childName: string; enabled: boolean }) {
  const { t } = useTranslation("parent");
  const sessions = useChildSessions(childId, enabled);
  const endOne = useEndChildSession(childId);
  const endAll = useEndAllChildSessions(childId);
  const [confirming, setConfirming] = useState(false);
  const active = (sessions.data ?? []).filter((session) => session.active);
  const name = childName.split(" ")[0] || childName;
  if (!active.length) return null;

  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-5">
      <span className="flex flex-col gap-0.5">
        <strong className="text-title text-ink">{t("logins.sessions.title", { count: active.length })}</strong>
        <small className="text-body-xs text-ink-secondary">{t("logins.sessions.text", { name })}</small>
      </span>
      <ul className="flex flex-col">
        {active.map((session) => (
          <li key={session.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-icon-secondary">
              <Icon name={session.device_type === "computer" ? "laptop" : "smartphone"} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-title-sm text-ink">{session.device || [session.browser, session.os].filter(Boolean).join(" · ")}</strong>
              <small className="truncate text-body-xs text-ink-secondary">
                {[session.city, formatRelativeShort(session.last_active)].filter(Boolean).join(" · ")}
              </small>
            </span>
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-icon-secondary transition-colors hover:bg-danger-bg hover:text-error-text disabled:opacity-50"
              aria-label={t("logins.sessions.end")}
              disabled={endOne.isPending}
              onClick={() =>
                endOne.mutate(session.id, {
                  onSuccess: () => toast.success(t("logins.detail.ended")),
                  onError: () => toast.error(t("logins.detail.failed")),
                })
              }
            >
              <Icon name="logout" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface text-button text-error-text transition-colors hover:bg-danger-bg disabled:opacity-50"
        disabled={endAll.isPending}
        onClick={() => setConfirming(true)}
      >
        <Icon name="logout" size={18} />
        {t("logins.sessions.endAll")}
      </button>
      <ConfirmDialog
        alert
        open={confirming}
        onOpenChange={setConfirming}
        icon="logout"
        title={t("logins.sessions.confirmTitle")}
        description={t("logins.sessions.confirmText", { name })}
        confirmLabel={t("logins.sessions.confirm")}
        cancelLabel={t("logins.sessions.cancel")}
        pending={endAll.isPending}
        onConfirm={() =>
          endAll.mutate(undefined, {
            onSuccess: (result) => {
              setConfirming(false);
              toast.success(t("logins.sessions.endedAll", { count: result?.ended ?? active.length }));
            },
            onError: () => toast.error(t("logins.detail.failed")),
          })
        }
      />
    </section>
  );
}
