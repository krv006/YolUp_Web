import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { useJoinCourse } from "@/modules/course";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";
import { AppError } from "@/shared/api";
import { Icon } from "@/shared/ui/icon";
import { Brand } from "@/shared/ui/legacy";

type JoinState = "idle" | "joined" | "pending" | "error";

export function JoinCoursePage() {
  const { t } = useTranslation("group");
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const join = useJoinCourse();
  const [state, setState] = useState<JoinState>("idle");
  const [message, setMessage] = useState("");
  const [courseId, setCourseId] = useState("");

  const isStudent = user?.role === ROLES.STUDENT;

  function submit() {
    setMessage("");
    join.mutate(code, {
      onSuccess: (result) => {
        setCourseId(result.courseId);
        setState(result.status === "pending" ? "pending" : "joined");
      },
      onError: (error: Error) => {
        setState("error");
        setMessage(describeJoinError(error, t));
      },
    });
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-5 py-10">
      <Brand />

      <section className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-6 text-center">
        <span
          className={`grid size-14 place-items-center rounded-2xl ${
            state === "error"
              ? "bg-error-bg text-error-text"
              : state === "joined"
                ? "bg-success-bg text-success-text"
                : "bg-action-subtle text-action"
          }`}
        >
          <Icon
            name={state === "error" ? "error" : state === "joined" ? "check-circle" : "groups"}
            size={26}
          />
        </span>

        <h1 className="font-heading text-h2 text-ink">
          {state === "joined"
            ? t("join.joinedTitle")
            : state === "pending"
              ? t("join.pendingTitle")
              : state === "error"
                ? t("join.errorTitle")
                : t("join.title")}
        </h1>

        <p className="text-body-sm text-ink-secondary">
          {state === "joined"
            ? t("join.joinedDescription")
            : state === "pending"
              ? t("join.pendingDescription")
              : state === "error"
                ? message
                : isStudent
                  ? t("join.description")
                  : t("join.notStudent")}
        </p>

        {state === "idle" ? (
          <span className="rounded-full bg-subtle px-4 py-2 font-numeric text-title text-ink">
            {code.toUpperCase()}
          </span>
        ) : null}

        {state === "idle" && isStudent ? (
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full bg-action text-label-strong text-on-action transition-colors hover:bg-action-hover disabled:opacity-60"
            disabled={join.isPending || !code}
            onClick={submit}
          >
            {join.isPending ? t("join.joining") : t("join.action")}
          </button>
        ) : null}

        {state === "joined" && courseId ? (
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full bg-action text-label-strong text-on-action transition-colors hover:bg-action-hover"
            onClick={() => navigate(ROUTES.student.course(courseId), { replace: true })}
          >
            {t("join.openCourse")}
          </button>
        ) : null}

        {state === "error" ? (
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full border border-line bg-surface text-label-strong text-ink transition-colors hover:bg-subtle"
            onClick={() => {
              setState("idle");
              setMessage("");
            }}
          >
            {t("join.retry")}
          </button>
        ) : null}

        <button
          type="button"
          className="text-label-strong text-action"
          onClick={() => navigate(ROUTES.root, { replace: true })}
        >
          {t("join.home")}
        </button>
      </section>
    </main>
  );
}

function describeJoinError(error: Error, t: (key: string) => string): string {
  if (error instanceof AppError) {
    if (error.status === 404) return t("join.errorNotFound");
    if (error.status === 400) return t("join.errorExpired");
    if (error.status === 403) return t("join.errorForbidden");
    if (error.message) return error.message;
  }
  return t("join.errorGeneric");
}
