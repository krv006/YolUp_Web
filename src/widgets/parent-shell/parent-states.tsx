import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AddChildDialog, parentFamily, useParentLinks, useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { storage } from "@/shared/lib";
import { ParentStateScreen } from "./parent-state-screen";

export function ParentNotFound() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  return (
    <ParentStateScreen
      icon="search"
      tone="brand"
      code="404"
      title={t("states.notFound.title")}
      text={t("states.notFound.text")}
      now={now}
      primary={{ label: t("states.home"), onClick: () => navigate(ROUTES.parent.dashboard) }}
    />
  );
}

export function ParentOffline({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("parent");
  const [now] = useState(() => Date.now());
  return (
    <ParentStateScreen
      icon="wifi"
      tone="teal"
      title={t("states.offline.title")}
      text={t("states.offline.text")}
      now={now}
      primary={{ label: t("states.offline.retry"), onClick: onRetry }}
    />
  );
}

const SEEN_KEY = "yolup:parent:unlinked-seen";

export function ParentUnlinked({ children: content }: { children: ReactNode }) {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  const [adding, setAdding] = useState(false);
  const [seen, setSeen] = useState(() => new Set(storage.getJson<string[]>(SEEN_KEY, []) ?? []));
  const { children } = useSelectedChild();
  const links = useParentLinks();
  const declined = parentFamily.recentUnlink(links.data ?? [], new Set(children.map((child) => child.id)), seen, now);
  if (!declined) return <>{content}</>;
  const first = declined.student.name.split(" ")[0] || declined.student.name;

  function dismiss(next: () => void) {
    if (!declined) return;
    const ids = new Set(seen).add(declined.id);
    storage.setJson(SEEN_KEY, [...ids]);
    setSeen(ids);
    next();
  }

  return (
    <>
      <ParentStateScreen
        icon="link"
        tone="danger"
        title={t("states.unlinked.title", { name: first })}
        text={t("states.unlinked.text", { name: declined.student.name })}
        now={now}
        secondary={{ label: t("states.unlinked.ok"), onClick: () => dismiss(() => navigate(ROUTES.parent.children)) }}
        primary={{ label: t("states.unlinked.again"), onClick: () => dismiss(() => setAdding(true)) }}
      />
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}
