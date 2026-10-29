import { useTranslation } from "react-i18next";
import type { Conversation } from "@/shared/types";

export const DIRECT_STATUS = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  BLOCKED: "blocked",
});

export type DirectStatusValue = (typeof DIRECT_STATUS)[keyof typeof DIRECT_STATUS];

export function isDirectLocked(conversation: Conversation): boolean {
  return (
    conversation.type === "direct" &&
    Boolean(conversation.directStatus) &&
    conversation.directStatus !== DIRECT_STATUS.ACTIVE
  );
}

export function useDirectStatusLabel() {
  const { t } = useTranslation("chat");
  return (status: DirectStatusValue | null | undefined, fallback?: string): string => {
    if (!status) return fallback ?? t("directStatus.notSent");
    return t(`directStatus.${status}`, fallback ?? t("directStatus.notSent"));
  };
}
