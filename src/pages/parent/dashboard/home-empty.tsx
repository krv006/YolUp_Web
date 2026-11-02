import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AddChildDialog, CreateChildDialog, LinkChildDialog, type ParentLink } from "@/modules/parent";
import { formatRelativeShort } from "@/shared/lib";
import { Icon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/legacy";

const STEP_ICONS = ["send", "how-to-reg", "trending-up"];

export function ConnectChild() {
  const { t } = useTranslation("parent");
  const [linkOpen, setLinkOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const steps = t("home.connect.steps", { returnObjects: true }) as Array<{ title: string; description: string }>;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex items-center gap-14 rounded-3xl bg-surface px-14 py-10">
        <span className="relative grid size-40 shrink-0 place-items-center rounded-full bg-brand-subtle">
          <span className="grid size-24 place-items-center rounded-full bg-gradient-to-b from-line-strong to-ink-tertiary font-heading text-[40px] font-bold text-on-action">
            ?
          </span>
          <span className="absolute right-0 bottom-2 grid size-14 place-items-center rounded-full border-4 border-surface bg-brand text-on-action">
            <Icon name="person-add" size={24} />
          </span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
          <h2 className="font-heading text-[26px]/8 font-semibold text-ink">{t("home.connect.title")}</h2>
          <p className="max-w-[740px] text-body text-ink-secondary">{t("home.connect.description")}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              className="flex h-13 items-center gap-2 rounded-full bg-brand px-6 text-title-sm font-semibold text-on-action transition-colors hover:bg-brand-strong"
              onClick={() => setLinkOpen(true)}
            >
              <Icon name="link" size={20} />
              {t("home.connect.link")}
            </button>
            <button
              type="button"
              className="flex h-13 items-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-title-sm font-semibold text-ink transition-colors hover:bg-subtle"
              onClick={() => setCreateOpen(true)}
            >
              <Icon name="person-add" size={20} />
              {t("home.connect.create")}
            </button>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <article key={step.title} className="flex flex-col gap-2 rounded-[20px] bg-surface p-5">
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-subtle text-brand">
                <Icon name={STEP_ICONS[index] ?? "check"} size={20} />
              </span>
              <small className="text-caption-strong text-ink-tertiary">{t("home.connect.step", { n: index + 1 })}</small>
            </span>
            <strong className="mt-2 text-title text-ink">{step.title}</strong>
            <small className="text-body-sm text-ink-secondary">{step.description}</small>
          </article>
        ))}
      </div>
      <LinkChildDialog open={linkOpen} onOpenChange={setLinkOpen} />
      <CreateChildDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export function PendingLink({ link }: { link: ParentLink }) {
  const { t } = useTranslation("parent");
  const [linkOpen, setLinkOpen] = useState(false);
  const steps = t("home.pending.how", { returnObjects: true }) as string[];
  const first = link.student.name.split(" ")[0] || link.student.name;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-5">
      <section className="flex items-center gap-8 rounded-3xl bg-surface px-9 py-10">
        <span className="flex shrink-0 items-center gap-1.5">
          <Avatar name={link.parent.name} src={link.parent.avatarUrl ?? undefined} size="xl" className="[&_.avatar]:size-20" />
          <span className="h-px w-3 border-t border-dashed border-line-strong" />
          <span className="grid size-10 place-items-center rounded-full bg-accent-teal-bg text-accent-teal-fg">
            <Icon name="hourglass-empty" size={20} />
          </span>
          <span className="h-px w-3 border-t border-dashed border-line-strong" />
          <Avatar name={link.student.name} src={link.student.avatarUrl ?? undefined} size="xl" className="[&_.avatar]:size-20" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-accent-teal-bg px-2.5 py-1 text-caption-strong text-accent-teal-fg">
            <Icon name="schedule" size={14} />
            {t("home.pending.chip", { time: formatRelativeShort(link.createdAt) })}
          </span>
          <h2 className="font-heading text-[22px]/8 font-semibold text-ink">{t("home.pending.title", { name: first })}</h2>
          <p className="text-body-sm text-ink-secondary">{t("home.pending.description", { username: link.student.username })}</p>
        </div>
      </section>
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-5">
          <strong className="text-title text-ink">{t("home.pending.howTitle")}</strong>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-body-sm text-ink">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-subtle text-caption-strong text-brand">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
        <button
          type="button"
          className="flex items-center gap-3 rounded-[20px] bg-surface px-4 py-4 text-left transition-colors hover:bg-subtle"
          onClick={() => setLinkOpen(true)}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-green-bg text-accent-green-fg">
            <Icon name="person-add" size={22} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-body font-semibold text-ink">{t("home.pending.addAnother")}</strong>
            <small className="truncate text-body-xs text-ink-secondary">{t("home.pending.addAnotherHint")}</small>
          </span>
          <Icon name="chevron-right" size={20} className="shrink-0 text-icon-secondary" />
        </button>
      </div>
      <AddChildDialog open={linkOpen} onOpenChange={setLinkOpen} />
    </div>
  );
}
