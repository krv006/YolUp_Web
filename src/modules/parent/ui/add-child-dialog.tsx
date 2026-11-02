import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/shared/ui/app-dialog";
import { Icon } from "@/shared/ui/icon";
import { CHILD_BUTTON, DIALOG_TITLE } from "./child-dialog-styles";
import { CreateChildDialog } from "./create-child-dialog";
import { LinkChildDialog } from "./link-child-dialog";

export interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Method = "link" | "create";

const METHODS: Array<{ id: Method; icon: string; tone: string }> = [
  { id: "link", icon: "link", tone: "bg-brand-subtle text-brand" },
  { id: "create", icon: "person-add", tone: "bg-accent-green-bg text-accent-green-fg" },
];

export function AddChildDialog({ open, onOpenChange }: AddChildDialogProps) {
  const { t } = useTranslation("parent");
  const [method, setMethod] = useState<Method>("link");
  const [next, setNext] = useState<Method | null>(null);

  function close(value: boolean) {
    onOpenChange(value);
    if (!value) setMethod("link");
  }

  return (
    <>
      <AppDialog
        open={open}
        onOpenChange={close}
        variant="confirm"
        width="lg:w-140"
        title={t("addChild.title")}
        description={t("addChild.description")}
        titleClassName={DIALOG_TITLE}
        footerClassName="justify-end px-6 pt-5 pb-6"
        footer={
          <>
            <button type="button" className={CHILD_BUTTON.secondary} onClick={() => close(false)}>
              {t("addChild.cancel")}
            </button>
            <button
              type="button"
              className={CHILD_BUTTON.primary}
              onClick={() => {
                setNext(method);
                close(false);
              }}
            >
              {t("addChild.next")}
            </button>
          </>
        }
      >
        <div role="radiogroup" className="flex flex-col gap-3 px-1">
          {METHODS.map((item) => {
            const active = method === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
                  active ? "border-brand bg-brand-subtle" : "border-transparent bg-subtle hover:bg-muted"
                }`}
                onClick={() => setMethod(item.id)}
                onDoubleClick={() => {
                  setNext(item.id);
                  close(false);
                }}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="text-title-sm text-ink">{t(`addChild.${item.id}Title`)}</strong>
                  <small className="text-body-sm text-ink-secondary">{t(`addChild.${item.id}Text`)}</small>
                </span>
                <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
              </button>
            );
          })}
        </div>
      </AppDialog>

      <LinkChildDialog open={next === "link"} onOpenChange={(value) => setNext(value ? "link" : null)} />
      <CreateChildDialog open={next === "create"} onOpenChange={(value) => setNext(value ? "create" : null)} />
    </>
  );
}
