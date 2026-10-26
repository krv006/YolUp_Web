import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import type { AuthUser } from "@/shared/types";
import {
  AuthButton,
  MobileRegisterForm,
  RegisterForm,
  resolveHomeRoute,
  useRegisterMutation,
  type RegisterFormValues,
} from "@/modules/auth";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AuthShell } from "@/shared/ui/auth-shell";

export function RegisterPage() {
  const register = useRegisterMutation();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const isCompact = useIsCompact();
  const createdUser = useRef<AuthUser | null>(null);
  const [done, setDone] = useState(false);

  async function submit(values: RegisterFormValues) {
    const user = await register.mutateAsync(values);
    createdUser.current = user;
    if (!isCompact) setDone(true);
    return user;
  }

  if (isCompact)
    return (
      <MobileRegisterForm
        onSubmit={submit}
        onDone={() =>
          navigate(createdUser.current ? resolveHomeRoute(createdUser.current) : "/login", {
            replace: true,
          })
        }
      />
    );

  if (done)
    return (
      <AuthShell
        title={t("register.doneTitle")}
        description={t("register.doneDescription")}
        action={
          <AuthButton
            onClick={() =>
              navigate(
                createdUser.current ? resolveHomeRoute(createdUser.current) : "/login",
                { replace: true }
              )
            }
          >
            {t("register.doneAction")}
          </AuthButton>
        }
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success-bg text-success">
          <Check size={30} />
        </span>
      </AuthShell>
    );

  return (
    <AuthShell
      title={t("register.title")}
      description={t("register.subtitle")}
      footer={
        <Link className="text-body-sm text-ink" to="/login">
          {t("register.haveAccount")}
        </Link>
      }
    >
      <RegisterForm onSubmit={submit} />
    </AuthShell>
  );
}
