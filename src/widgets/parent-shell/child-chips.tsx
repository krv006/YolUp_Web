import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AddChildDialog, useParentLinks, useSelectedChild } from "@/modules/parent";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

export function ChildChips() {
  const { t } = useTranslation("parent");
  const { children, selectedChildId, selectChild } = useSelectedChild();
  const links = useParentLinks();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const pending = (links.data ?? []).filter((link) => link.status === "pending");

  function choose(id: string, name: string) {
    if (id === selectedChildId) return;
    selectChild(id);
    toast.success(t("mobile.switcher.selected", { name: name.split(" ")[0] || name }));
  }

  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {children.map((child) => {
          const active = child.id === selectedChildId;
          return (
            <button
              key={child.id}
              type="button"
              className={`flex h-11 shrink-0 items-center gap-2 rounded-full border-2 bg-surface py-1 pr-4 pl-1 text-title-sm transition-colors ${
                active ? "border-brand text-ink" : "border-transparent text-ink-secondary"
              }`}
              onClick={() => (active ? setPickerOpen(true) : choose(child.id, child.name))}
            >
              <Avatar name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size="sm" className="[&_.avatar]:size-8" />
              {child.name.split(" ")[0]}
            </button>
          );
        })}
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-dashed border-line-strong bg-surface text-brand"
          aria-label={t("switcher.add")}
          onClick={() => setAdding(true)}
        >
          <Icon name="add" size={20} />
        </button>
      </div>

      <AppDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        variant="sheet"
        title={t("mobile.switcher.title")}
        description={t("mobile.switcher.subtitle")}
        footer={
          <button
            type="button"
            className="flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-brand-subtle text-title-sm font-semibold text-brand"
            onClick={() => {
              setPickerOpen(false);
              setAdding(true);
            }}
          >
            <Icon name="add" size={20} />
            {t("switcher.add")}
          </button>
        }
      >
        <div role="radiogroup" className="flex flex-col">
          {children.map((child) => {
            const active = child.id === selectedChildId;
            return (
              <button
                key={child.id}
                type="button"
                role="radio"
                aria-checked={active}
                className="flex items-center gap-3 py-3 text-left"
                onClick={() => {
                  choose(child.id, child.name);
                  setPickerOpen(false);
                }}
              >
                <Avatar name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size="md" className="shrink-0 [&_.avatar]:size-12" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-title text-ink">{child.name}</strong>
                  <small className="truncate text-body-xs text-ink-secondary">{child.username}</small>
                </span>
                <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${active ? "border-brand" : "border-line-strong"}`}>
                  {active ? <span className="size-3 rounded-full bg-brand" /> : null}
                </span>
              </button>
            );
          })}
          {pending.map((link) => (
            <span key={link.id} className="flex items-center gap-3 py-3">
              <Avatar name={link.student.name} src={link.student.avatarUrl ?? undefined} size="md" className="shrink-0 [&_.avatar]:size-12" />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title text-ink">{link.student.name}</strong>
                <small className="truncate text-body-xs text-ink-secondary">{t("mobile.switcher.requested", { username: link.student.username })}</small>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
                <Icon name="schedule" size={14} />
                {t("switcher.pending")}
              </span>
            </span>
          ))}
        </div>
      </AppDialog>
      <AddChildDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}
