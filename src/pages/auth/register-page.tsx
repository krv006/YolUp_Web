import { useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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
import { Brand } from "@/shared/ui/legacy";

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
    <main className="login-page">
      <div className="login-orb login-orb--one" />
      <div className="login-orb login-orb--two" />
      <motion.section
        className="login-card register-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Brand />
        <div className="login-heading">
          <span className="eyebrow">
            <Sparkles size={14} /> {t("register.tagline")}
          </span>
          <h1>{t("register.title")}</h1>
          <p>{t("register.subtitle")}</p>
        </div>
        <RegisterForm onSubmit={submit} />
        <Link className="auth-switch-link" to="/login">
          {t("register.haveAccount")}
        </Link>
      </motion.section>
    </main>
  );
}
