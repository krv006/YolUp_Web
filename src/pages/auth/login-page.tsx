import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import { LoginForm, MobileLoginForm, resolveHomeRoute } from "@/modules/auth";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { LoginCredentials } from "@/shared/types";
import { Brand } from "@/shared/ui/legacy";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const isCompact = useIsCompact();

  if (user) return <Navigate to={resolveHomeRoute(user)} replace />;
  if (isCompact) return <MobileLoginForm onSubmit={handleLogin} />;

  async function handleLogin(credentials: LoginCredentials) {
    const nextUser = await login(credentials);
    navigate(resolveHomeRoute(nextUser), { replace: true });
  }

  return (
    <main className="login-page">
      <div className="login-orb login-orb--one" />
      <div className="login-orb login-orb--two" />
      <motion.section
        className="login-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Brand />
        <div className="login-heading">
          <span className="eyebrow">
            <Sparkles size={14} /> {t("tagline")}
          </span>
          <h1>{t("title")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <LoginForm onSubmit={handleLogin} />
        <Link className="auth-switch-link" to="/register">{t("createAccount")}</Link>
      </motion.section>
      <p className="login-footer">{t("footer")}</p>
    </main>
  );
}
