import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { AuthUser } from "@/shared/types";
import {
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

  async function submit(values: RegisterFormValues) {
    const user = await register.mutateAsync(values);
    createdUser.current = user;
    toast.success(t("register.accountCreated"));
    if (!isCompact) navigate(resolveHomeRoute(user), { replace: true });
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
