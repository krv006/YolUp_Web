import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

const OPTIONS = [
  { id: "new", icon: "edit", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  { id: "bank", icon: "menu-book", tone: "bg-brand-subtle text-brand" },
] as const;

export interface AddAssignmentMenuProps {
  label: string;
  onCreate: () => void;
  onFromBank: () => void;
  className?: string;
}

export function AddAssignmentMenu({ label, onCreate, onFromBank, className = "" }: AddAssignmentMenuProps) {
  const { t } = useTranslation("homework");
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand text-button whitespace-nowrap text-on-action transition-colors hover:bg-brand-strong ${className}`}
        >
          <Icon name="add" size={16} />
          {label}
          <Icon name={open ? "expand-less" : "expand-more"} size={18} className="-mr-1" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 flex w-80 max-w-[calc(100vw-32px)] flex-col gap-1 rounded-xl bg-surface p-2 shadow-lg"
        >
          {OPTIONS.map((option) => (
            <DropdownMenu.Item
              key={option.id}
              className="flex h-16 cursor-pointer items-center gap-3 rounded-lg px-3.5 outline-none data-[highlighted]:bg-subtle"
              onSelect={option.id === "new" ? onCreate : onFromBank}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-md ${option.tone}`}>
                <Icon name={option.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-[17px]/5 font-semibold text-ink">
                  {option.id === "new" ? t("bank.newAssignment") : t("bank.fromBank")}
                </strong>
                <small className="mt-1 truncate text-body-sm leading-[18px] text-ink-secondary">
                  {option.id === "new" ? t("bank.newAssignmentHint") : t("bank.fromBankHint")}
                </small>
              </span>
              <Icon name="chevron-right" size={20} className="shrink-0 text-ink-secondary" />
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
