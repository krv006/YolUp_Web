import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/auth";
import {
  LoginForm,
  MobileLoginForm,
  MobileTwoFactorForm,
  TwoFactorForm,
  describeTwoFactorChallenge,
  resolveHomeRoute,
} from "@/modules/auth";
import type { TwoFactorChallenge } from "@/modules/auth";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import type { LoginCredentials } from "@/shared/types";
import { Brand } from "@/shared/ui/legacy";

interface PendingChallenge {
  credentials: LoginCredentials;
  challenge: TwoFactorChallenge;
}

export function LoginPage() {
  const { user, login, completeTwoFactorLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("auth");
  const isCompact = useIsCompact();
  const [pending, setPending] = useState<PendingChallenge | null>(null);
  const from = (location.state as { from?: string } | null)?.from;

  function landing(nextUser: Parameters<typeof resolveHomeRoute>[0]) {
    return from?.startsWith("/") ? from : resolveHomeRoute(nextUser);
  }

  async function handleLogin(credentials: LoginCredentials) {
    const result = await login(credentials);
    if (result.status === "twoFactor") {
      setPending({ credentials, challenge: result.challenge });
      return;
    }
    navigate(landing(result.user), { replace: true });
  }

  async function handleResend() {
    if (!pending) return;
    const result = await login(pending.credentials);
    if (result.status === "twoFactor") {
      setPending({ credentials: pending.credentials, challenge: result.challenge });
      return;
    }
    navigate(landing(result.user), { replace: true });
  }

  async function handleCode(code: string) {
    if (!pending) return;
    const nextUser = await completeTwoFactorLogin(
      pending.challenge.challengeToken,
      code,
      pending.credentials.remember !== false
    );
    navigate(landing(nextUser), { replace: true });
  }

  if (user) return <Navigate to={resolveHomeRoute(user)} replace />;

  if (isCompact) {
    return pending ? (
      <MobileTwoFactorForm
        challenge={pending.challenge}
        onSubmit={handleCode}
        onResend={handleResend}
        onCancel={() => setPending(null)}
      />
    ) : (
      <MobileLoginForm onSubmit={handleLogin} />
    );
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
          <h1>{pending ? t("twoFactor.title") : t("title")}</h1>
          <p>{pending ? describeTwoFactorChallenge(pending.challenge, t) : t("subtitle")}</p>
        </div>
        {pending ? (
          <TwoFactorForm
            challenge={pending.challenge}
            onSubmit={handleCode}
            onResend={handleResend}
            onCancel={() => setPending(null)}
          />
        ) : (
          <>
            <LoginForm onSubmit={handleLogin} />
            <Link className="auth-switch-link" to="/forgot-password">
              {t("mobile.login.forgotPassword")}
            </Link>
            <Link className="auth-switch-link" to="/register">
              {t("createAccount")}
            </Link>
          </>
        )}
      </motion.section>
      <p className="login-footer">{t("footer")}</p>
    </main>
  );
}
