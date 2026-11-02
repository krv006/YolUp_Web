import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AddChildDialog, parentFamily, useParentLinks, useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { storage } from "@/shared/lib";
import { ParentStateScreen } from "./parent-state-screen";
import { STATE_BUTTON } from "./parent-state-styles";

export function ParentNotFound() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const [now] = useState(() => Date.now());
  return (
    <ParentStateScreen icon="search" tone="brand" code="404" title={t("states.notFound.title")} text={t("states.notFound.text")} now={now}>
      <button type="button" className={STATE_BUTTON.primary} onClick={() => navigate(ROUTES.parent.dashboard)}>
        {t("states.home")}
      </button>
    </ParentStateScreen>
  );
}

export function ParentOffline({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("parent");
  const [now] = useState(() => Date.now());
  return (
    <ParentStateScreen icon="wifi" tone="teal" title={t("states.offline.title")} text={t("states.offline.text")} now={now}>
      <button type="button" className={STATE_BUTTON.primary} onClick={onRetry}>
        {t("states.offline.retry")}
      </button>
    </ParentStateScreen>
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
      >
        <button type="button" className={STATE_BUTTON.secondary} onClick={() => dismiss(() => navigate(ROUTES.parent.children))}>
          {t("states.unlinked.ok")}
        </button>
        <button type="button" className={STATE_BUTTON.primary} onClick={() => dismiss(() => setAdding(true))}>
          {t("states.unlinked.again")}
        </button>
      </ParentStateScreen>
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}
