import { useState } from "react";
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
import { AuthShell } from "@/shared/ui/auth-shell";

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
    <AuthShell
      title={pending ? t("twoFactor.title") : t("title")}
      description={pending ? describeTwoFactorChallenge(pending.challenge, t) : t("subtitle")}
      footer={
        pending ? null : (
          <Link className="text-body-sm text-ink" to="/register">
            {t("createAccount")}
          </Link>
        )
      }
    >
      {pending ? (
        <TwoFactorForm
          challenge={pending.challenge}
          onSubmit={handleCode}
          onResend={handleResend}
          onCancel={() => setPending(null)}
        />
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </AuthShell>
  );
}
