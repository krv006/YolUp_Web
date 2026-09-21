import { useState } from "react";
import { ClipboardCheck, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  MockTestRunner,
  useMockTests,
  useStartMockTest,
  type MockAttempt,
} from "@/modules/mock-test";
import { Button, LoadingFallback, RouteState, PageBackLink } from "@/shared/ui/legacy";

export function MockTestPage() {
  const { t } = useTranslation("mocktest");
  const list = useMockTests();
  const start = useStartMockTest();
  const [attempt, setAttempt] = useState<{ mockTestId: string; data: MockAttempt } | null>(null);
  const [result, setResult] = useState<{ total: number; max: number } | null>(null);

  if (attempt) {
    return (
      <div className="portal-page">
        <MockTestRunner
          mockTestId={attempt.mockTestId}
          attempt={attempt.data}
          onFinished={(score) => {
            setAttempt(null);
            setResult(score);
          }}
          onCancel={() => setAttempt(null)}
        />
      </div>
    );
  }

  if (list.isLoading) return <LoadingFallback label={t("list.loading")} />;
  if (list.isError)
    return (
      <RouteState title={t("list.loadError")} actionLabel={t("list.retry")} onAction={list.refetch} />
    );

  return (
    <div className="portal-page">
      <div className="portal-page-heading">
        <div>
          <PageBackLink />
          <span className="portal-eyebrow">{t("list.eyebrow")}</span>
          <h1>{t("list.title")}</h1>
          <p>{t("list.subtitle")}</p>
        </div>
      </div>

      {result ? (
        <div className="form-alert form-alert--success mock-result">
          {t("list.lastResult", { score: result.total, max: result.max })}
        </div>
      ) : null}

      {list.data?.length ? (
        <div className="mock-test-list">
          {list.data.map((item) => (
            <article key={item.id} className="mock-test-card">
              <span className="workspace-card-icon">
                <ClipboardCheck size={20} />
              </span>
              <div>
                <strong>{item.title}</strong>
                {item.description ? <p>{item.description}</p> : null}
                <small>
                  <Timer size={13} /> {t("list.minutes", { count: item.timeLimitMinutes })} ·{" "}
                  {t("list.sections", { count: item.sectionCount })}
                </small>
              </div>
              <Button
                loading={start.isPending && start.variables === item.id}
                onClick={() =>
                  start
                    .mutateAsync(item.id)
                    .then((data) => {
                      setResult(null);
                      setAttempt({ mockTestId: item.id, data });
                    })
                    .catch(() => undefined)
                }
              >
                {t("list.start")}
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <p className="portal-muted">{t("list.empty")}</p>
      )}
    </div>
  );
}
