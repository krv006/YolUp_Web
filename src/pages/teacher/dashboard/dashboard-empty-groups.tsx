import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/ui/icon";

const STEPS = [
  { id: "create", icon: "person", tone: "bg-accent-blue-bg text-accent-blue-fg" },
  { id: "invite", icon: "nav-chat", tone: "bg-accent-green-bg text-accent-green-fg" },
  { id: "lesson", icon: "clock", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
];

export interface DashboardEmptyGroupsProps {
  onCreate: () => void;
}

export function DashboardEmptyGroups({ onCreate }: DashboardEmptyGroupsProps) {
  const { t } = useTranslation("dashboard");

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-6">
      <section className="flex flex-col items-center gap-4 rounded-xl bg-surface px-8 py-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-subtle text-brand">
          <Icon name="add" size={28} />
        </span>
        <strong className="font-heading text-h1 text-ink">{t("noGroups.title")}</strong>
        <p className="max-w-[420px] text-body-sm text-ink-secondary">{t("noGroups.description")}</p>
        <button
          type="button"
          className="mt-1 flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-button text-ink-inverse transition-colors hover:bg-brand-strong"
          onClick={onCreate}
        >
          <Icon name="add" size={20} /> {t("noGroups.action")}
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="px-1 font-heading text-h2 text-ink">{t("noGroups.stepsTitle")}</h2>
        <div className="flex flex-col overflow-hidden rounded-lg bg-surface">
          {STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              className="flex items-center gap-3 border-b border-line px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-subtle"
              onClick={onCreate}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${step.tone}`}>
                <Icon name={step.icon} size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-title-sm text-ink">
                  {t(`noGroups.steps.${step.id}.title`)}
                </strong>
                <small className="truncate text-caption text-ink-tertiary">
                  {t(`noGroups.steps.${step.id}.hint`)}
                </small>
              </span>
              <Icon name="chevron-right" size={20} className="shrink-0 text-icon-tertiary" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
