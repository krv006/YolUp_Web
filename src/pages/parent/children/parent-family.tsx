import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AddChildDialog, CreateChildDialog, LinkChildDialog, type FamilyPeriod } from "@/modules/parent";
import { useOnlineStatus } from "@/shared/model";
import { Icon } from "@/shared/ui/icon";
import { ParentErrorBanner, ParentPageHeader } from "@/widgets/parent-shell";
import { ConnectChild } from "../dashboard/home-empty";
import { AddMoreCard, ChildCard, PendingCard } from "./family-cards";
import { FamilyTable } from "./family-table";
import { useParentFamily } from "./use-parent-family";

function FamilySkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex h-[272px] flex-col gap-4 rounded-[20px] bg-surface p-5">
            <span className="flex items-center gap-3">
              <span className="size-14 rounded-full bg-skeleton" />
              <span className="flex flex-1 flex-col gap-2">
                <span className="h-4 w-2/3 rounded-full bg-skeleton" />
                <span className="h-3 w-1/2 rounded-full bg-skeleton" />
              </span>
            </span>
            <span className="h-[68px] rounded-2xl bg-skeleton" />
            <span className="h-3 w-3/4 rounded-full bg-skeleton" />
            <span className="mt-auto grid grid-cols-2 gap-3">
              <span className="h-11 rounded-full bg-skeleton" />
              <span className="h-11 rounded-full bg-skeleton" />
            </span>
          </div>
        ))}
      </div>
      <div className="h-[88px] rounded-[20px] bg-surface" />
    </div>
  );
}

export function ParentFamily() {
  const { t } = useTranslation("parent");
  const online = useOnlineStatus();
  const [period, setPeriod] = useState<FamilyPeriod>("week");
  const family = useParentFamily(period);
  const [dialog, setDialog] = useState<"add" | "link" | "create" | null>(null);
  const linked = family.rows.length;
  const pending = family.pending.length;
  const empty = !family.loading && !linked && !pending && !family.failed;

  return (
    <div className="flex flex-col gap-6 px-8 py-7">
      <ParentPageHeader
        eyebrow={
          empty
            ? t("home.connectSubtitle")
            : family.failed && !linked && !pending
              ? t("family.eyebrowBase")
              : pending
              ? t("family.eyebrowPending", { linked, pending })
              : t("family.eyebrow", { linked })
        }
        title={t("family.title")}
      />

      {online && family.failed ? <ParentErrorBanner onRetry={family.retry} /> : null}

      {family.loading ? (
        <FamilySkeleton />
      ) : empty ? (
        <ConnectChild />
      ) : (
        <>
          <div className="-mt-2 flex justify-end gap-3">
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-button text-ink transition-colors hover:bg-subtle"
              onClick={() => setDialog("link")}
            >
              <Icon name="link" size={20} />
              {t("family.link")}
            </button>
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-button text-on-action transition-colors hover:bg-brand-strong"
              onClick={() => setDialog("create")}
            >
              <Icon name="add" size={20} />
              {t("family.create")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
            {family.rows.map((row) => (
              <ChildCard
                key={row.child.id}
                row={row}
                now={family.now}
                selected={row.child.id === family.selectedChildId}
                onSelect={() => family.selectChild(row.child.id)}
              />
            ))}
            {family.pending.map((link) => (
              <PendingCard key={link.id} link={link} />
            ))}
          </div>

          <AddMoreCard onAdd={() => setDialog("add")} />

          {linked ? (
            <FamilyTable rows={family.rows} period={period} now={family.now} onPeriod={setPeriod} />
          ) : null}
        </>
      )}

      <AddChildDialog open={dialog === "add"} onOpenChange={(open) => setDialog(open ? "add" : null)} />
      <LinkChildDialog open={dialog === "link"} onOpenChange={(open) => setDialog(open ? "link" : null)} />
      <CreateChildDialog open={dialog === "create"} onOpenChange={(open) => setDialog(open ? "create" : null)} />
    </div>
  );
}
