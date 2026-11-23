import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useCourses, useSubjects } from "@/modules/course";
import { AiQuizCreator, usePaidTestGate } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { Icon } from "@/shared/ui/icon";
import { WorkspaceShell, workspaceGhostAction } from "@/widgets/workspace-shell";
import { NewTestImport } from "./new-test-import";
import { ManualEditor, ManualStartCard, type ManualStart } from "./new-test-manual";

type Tab = "ai" | "import" | "manual";

/**
 * Yangi test: «AI bilan yaratish», «Tayyor testni yuklash», «Qo'lda yozish» (AI yorlig'i `FEATURES.aiAssistant`ga bog'liq emas).
 * Faqat kompyuter ko'rinishi — telefonda eski oyna (`?new=1`) ishlayveradi.
 */
export function NewTestPage() {
  const { t } = useTranslation("quiz");
  const navigate = useNavigate();
  const isCompact = useIsCompact();
  const gate = usePaidTestGate();
  const [params, setParams] = useSearchParams();
  const subjects = useSubjects();
  const courses = useCourses();
  const [manual, setManual] = useState<ManualStart | null>(null);

  const tabs: Tab[] = ["ai", "import", "manual"];
  const requested = params.get("tab");
  const tab = tabs.find((item) => item === requested) ?? tabs[0];

  if (isCompact) return <Navigate to={`${ROUTES.teacher.tests}?new=1`} replace />;
  if (!gate.allowed) return <Navigate to={ROUTES.teacher.tests} replace />;

  const openQuiz = (quizId: string) => navigate(ROUTES.teacher.test(quizId));

  return (
    <WorkspaceShell
      eyebrow={t("newPage.eyebrow")}
      title={t("newPage.title")}
      action={
        manual ? null : (
          <button type="button" className={workspaceGhostAction} onClick={() => navigate(ROUTES.teacher.tests)}>
            <Icon name="arrow-back" size={18} />
            {t("newPage.back")}
          </button>
        )
      }
    >
      {manual ? (
        <div className="mx-auto w-full max-w-4xl">
          <ManualEditor
            start={manual}
            onBack={() => setManual(null)}
            onCreated={(quiz) => openQuiz(quiz.id)}
          />
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          <div role="tablist" className="flex flex-wrap gap-1 border-b border-line">
            {tabs.map((item) => {
              const active = item === tab;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`-mb-px border-b-2 px-4 py-3 text-button transition-colors ${
                    active
                      ? "border-brand text-ink"
                      : "border-transparent text-ink-secondary hover:text-ink"
                  }`}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set("tab", item);
                    setParams(next, { replace: true });
                  }}
                >
                  {t(`newPage.tabs.${item}`)}
                </button>
              );
            })}
          </div>

          <p className="text-body text-ink-secondary">{t(`newPage.leads.${tab}`)}</p>

          {tab === "ai" ? (
            <AiQuizCreator
              subjects={subjects.data ?? []}
              courses={(courses.data ?? []).map((course) => ({ id: course.id, title: course.title }))}
              onOpenQuiz={openQuiz}
            />
          ) : null}
          {tab === "import" ? <NewTestImport onCreated={(quiz) => openQuiz(quiz.id)} /> : null}
          {tab === "manual" ? <ManualStartCard onStart={setManual} /> : null}
        </div>
      )}
    </WorkspaceShell>
  );
}
