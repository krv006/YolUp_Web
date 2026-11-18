import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { storage } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { PUSH_PROMPT_KEY, pushPromptSnoozed, shouldOfferPush } from "../lib/push-prompt";
import { enablePush, isPushSupported } from "../lib/push-subscription";
import { pushKeys } from "../model/use-push-notifications";

const SHOW_AFTER_MS = 3000;

function currentPermission(): NotificationPermission | null {
  try {
    return typeof Notification === "undefined" ? null : Notification.permission;
  } catch {
    return null;
  }
}

export function PushPrompt() {
  const { t } = useTranslation("notification");
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const offer = shouldOfferPush({
      supported: isPushSupported(),
      permission: currentPermission(),
      snoozed: pushPromptSnoozed(storage.get(PUSH_PROMPT_KEY)),
    });
    if (!offer) return undefined;
    const timer = globalThis.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => globalThis.clearTimeout(timer);
  }, []);

  async function enable() {
    setBusy(true);
    try {
      await enablePush();
      toast.success(t("pushPrompt.enabled"));
      setVisible(false);
    } catch (caught) {
      toast.error(caught instanceof Error && caught.message ? caught.message : t("pushPrompt.failed"));
      if (currentPermission() !== "default") setVisible(false);
    } finally {
      setBusy(false);
      void queryClient.invalidateQueries({ queryKey: pushKeys.status });
    }
  }

  function later() {
    storage.set(PUSH_PROMPT_KEY, Date.now());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section
      role="dialog"
      aria-label={t("pushPrompt.title")}
      className="fixed inset-x-4 bottom-30 z-40 flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-2xl ring-1 ring-line lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-90"
    >
      <span className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-subtle text-brand">
          <Icon name="notifications-active" size={22} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="text-title-sm text-ink">{t("pushPrompt.title")}</strong>
          <small className="text-body-xs text-ink-secondary">{t("pushPrompt.text")}</small>
        </span>
      </span>
      <span className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="flex h-10 items-center justify-center rounded-full border border-line-strong bg-surface text-button text-ink transition-colors hover:bg-subtle"
          onClick={later}
        >
          {t("pushPrompt.later")}
        </button>
        <button
          type="button"
          className="flex h-10 items-center justify-center rounded-full bg-brand text-button text-on-action transition-colors hover:bg-brand-strong disabled:opacity-60"
          disabled={busy}
          onClick={() => void enable()}
        >
          {t("pushPrompt.enable")}
        </button>
      </span>
    </section>
  );
}
