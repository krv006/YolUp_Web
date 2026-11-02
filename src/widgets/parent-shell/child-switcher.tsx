import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useHomeworkReport } from "@/modules/homework";
import { LinkChildDialog, useParentLinks, useSelectedChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

export function ChildSwitcher() {
  const { t } = useTranslation("parent");
  const navigate = useNavigate();
  const { children, selectedChild, selectedChildId, selectChild } = useSelectedChild();
  const links = useParentLinks();
  const report = useHomeworkReport(selectedChildId, Boolean(selectedChildId));
  const [open, setOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const pending = (links.data ?? []).filter((link) => link.status === "pending");
  const others = [
    ...children.filter((child) => child.id !== selectedChildId).map((child) => ({ id: child.id, name: child.name, avatarUrl: child.avatarUrl })),
    ...pending.map((link) => ({ id: link.id, name: link.student.name, avatarUrl: link.student.avatarUrl ?? null })),
  ];
  const groups = report.data?.courses.length;

  if (!selectedChild) return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-subtle px-3 pt-3 pb-3.5">
      <span className="px-0.5 text-caption-strong tracking-wide text-ink-tertiary">{t("switcher.eyebrow")}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label={t("switcher.open")}
          >
            <Avatar
              name={selectedChild.name}
              src={selectedChild.avatarUrl ?? undefined}
              tone={selectedChild.avatarTone}
              size="sm"
              className="shrink-0 [&_.avatar]:size-9"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <strong className="truncate text-body-xs font-semibold tracking-tight text-ink">{selectedChild.name}</strong>
              {groups ? (
                <small className="truncate text-caption text-ink-secondary">{t("switcher.groups", { count: groups })}</small>
              ) : null}
            </span>
            <Icon name="expand-more" size={20} className="shrink-0 text-icon-secondary" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={10}
          className="w-80 rounded-2xl border border-line bg-surface p-2 text-ink shadow-xl"
        >
          <span className="block px-3 pt-2 pb-2 text-caption-strong tracking-wide text-ink-tertiary">
            {t("switcher.menuTitle")}
          </span>
          <ul className="flex flex-col gap-1">
            {children.map((child) => {
              const active = child.id === selectedChildId;
              return (
                <li key={child.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active ? "bg-brand-subtle" : "hover:bg-subtle"
                    }`}
                    onClick={() => {
                      selectChild(child.id);
                      setOpen(false);
                    }}
                  >
                    <Avatar name={child.name} src={child.avatarUrl ?? undefined} tone={child.avatarTone} size="sm" className="shrink-0 [&_.avatar]:size-10" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <strong className="truncate text-body-sm font-semibold text-ink">{child.name}</strong>
                      <small className="truncate text-caption text-ink-secondary">{child.username}</small>
                    </span>
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                        active ? "border-brand" : "border-line-strong"
                      }`}
                      aria-hidden="true"
                    >
                      {active ? <span className="size-2.5 rounded-full bg-brand" /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
            {pending.map((link) => (
              <li key={link.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar name={link.student.name} src={link.student.avatarUrl ?? undefined} size="sm" className="shrink-0 [&_.avatar]:size-10" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong className="truncate text-body-sm font-semibold text-ink">{link.student.name}</strong>
                  <small className="truncate text-caption text-ink-secondary">
                    @{link.student.username} · {t("switcher.requestSent")}
                  </small>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-caption-strong text-success-fg">
                  <Icon name="schedule" size={12} />
                  {t("switcher.pending")}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex flex-col gap-1 border-t border-line pt-1">
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-body-sm font-medium text-ink transition-colors hover:bg-subtle"
              onClick={() => {
                setOpen(false);
                setLinkOpen(true);
              }}
            >
              <Icon name="person-add" size={20} className="text-icon-secondary" />
              {t("switcher.add")}
            </button>
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-body-sm font-medium text-ink transition-colors hover:bg-subtle"
              onClick={() => {
                setOpen(false);
                navigate(ROUTES.parent.children);
              }}
            >
              <Icon name="settings" size={20} className="text-icon-secondary" />
              {t("switcher.manage")}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2">
        <span className="flex -space-x-1">
          {others.slice(0, 3).map((item) => (
            <Avatar key={item.id} name={item.name} src={item.avatarUrl ?? undefined} size="xs" className="rounded-full ring-2 ring-subtle [&_.avatar]:size-6" />
          ))}
        </span>
        <button
          type="button"
          className="grid size-6 shrink-0 place-items-center rounded-full border border-dashed border-line-strong text-brand transition-colors hover:bg-surface"
          aria-label={t("switcher.add")}
          onClick={() => setLinkOpen(true)}
        >
          <Icon name="add" size={14} />
        </button>
        {others.length ? (
          <small className="truncate text-caption text-ink-secondary">{t("switcher.others", { count: others.length })}</small>
        ) : null}
      </div>

      <LinkChildDialog open={linkOpen} onOpenChange={setLinkOpen} />
    </div>
  );
}
