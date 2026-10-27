import { useState } from "react";
import { useTranslation } from "react-i18next";
import { storage } from "@/shared/lib";

const STEPS = ["home", "workspace"] as const;

export function MobileOnboarding({ userId }: { userId: string }) {
  const { t } = useTranslation("dashboard");
  const key = `yolup:onboarding:${userId}`;
  const [step, setStep] = useState<number | null>(() => (storage.get(key) ? null : 0));

  if (step === null) return null;

  const id = STEPS[step];
  const last = step === STEPS.length - 1;

  function finish() {
    storage.set(key, "1");
    setStep(null);
  }

  return (
    <div className="lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-onboarding-title">
      <div className="fixed inset-0 z-[25] bg-scrim" aria-hidden="true" />
      <span
        className="pointer-events-none fixed inset-x-2.5 bottom-[calc(max(30px,env(safe-area-inset-bottom))-6px)] z-30 h-20 rounded-[34px] border-2 border-dashed border-on-action"
        aria-hidden="true"
      />
      <section className="fixed inset-x-4 bottom-[calc(max(30px,env(safe-area-inset-bottom))+86px)] z-40 flex flex-col rounded-xl bg-surface p-4 pt-[17px] font-body text-ink">
        <small className="text-caption-strong text-brand">
          {t("mobile.tour.step", { current: step + 1, total: STEPS.length })}
        </small>
        <h2 id="mobile-onboarding-title" className="mt-2 text-title-lg text-ink">
          {t(`mobile.tour.${id}.title`)}
        </h2>
        <p className="mt-2 -mr-1 text-body-sm text-ink-secondary">{t(`mobile.tour.${id}.text`)}</p>
        <div className="mt-[15px] flex gap-2">
          <button type="button" className="h-11 shrink-0 px-[15px] text-button text-brand" onClick={finish}>
            {t("mobile.tour.skip")}
          </button>
          <button
            type="button"
            className="h-11 min-w-0 flex-1 rounded-full bg-brand px-4 text-button text-on-action transition-colors hover:bg-brand-strong"
            onClick={() => (last ? finish() : setStep(step + 1))}
          >
            {t(last ? "mobile.tour.start" : "mobile.tour.next")}
          </button>
        </div>
      </section>
    </div>
  );
}
