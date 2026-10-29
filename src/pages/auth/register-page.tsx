import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import type { AuthUser } from "@/shared/types";
import {
  AuthButton,
  MobileRegisterForm,
  PhoneVerifyDialog,
  RegisterForm,
  normalizeUzPhone,
  resolveHomeRoute,
  useRegisterMutation,
  useRegisterPhoneCodeMutation,
  useVerifyRegisterPhoneMutation,
  type RegisterFormValues,
} from "@/modules/auth";
import { AppError } from "@/shared/api";
import { useIsCompact } from "@/shared/hooks/use-media-query";
import { AuthShell } from "@/shared/ui/auth-shell";

export function RegisterPage() {
  const register = useRegisterMutation();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const isCompact = useIsCompact();
  const createdUser = useRef<AuthUser | null>(null);
  const [done, setDone] = useState(false);
  const requestCode = useRegisterPhoneCodeMutation();
  const verifyPhone = useVerifyRegisterPhoneMutation();
  const pending = useRef<{
    values: RegisterFormValues;
    resolve: (user: AuthUser) => void;
    reject: (error: unknown) => void;
  } | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  async function finish(values: RegisterFormValues) {
    const user = await register.mutateAsync(values);
    createdUser.current = user;
    if (!isCompact) setDone(true);
    return user;
  }

  function submit(values: RegisterFormValues) {
    const phone = values.phone?.trim();
    if (!phone) return finish(values);
    return new Promise<AuthUser>((resolve, reject) => {
      pending.current = { values: { ...values, phone: normalizeUzPhone(phone) }, resolve, reject };
      setVerifying(normalizeUzPhone(phone));
    });
  }

  function closeVerify(open: boolean) {
    if (open) return;
    setVerifying(null);
    pending.current?.reject(new AppError({ message: t("phoneVerify.cancelled") }));
    pending.current = null;
  }

  const phoneDialog = (
    <PhoneVerifyDialog
      key={verifying ?? "none"}
      open={Boolean(verifying)}
      onOpenChange={closeVerify}
      phone={verifying ?? ""}
      onRequest={(phone) => requestCode.mutateAsync(phone)}
      onVerify={async (phone, code) => {
        const current = pending.current;
        if (!current) return;
        const { phone_token: phoneToken } = await verifyPhone.mutateAsync({ phone, code });
        try {
          const user = await finish({ ...current.values, phone, phoneToken });
          pending.current = null;
          setVerifying(null);
          current.resolve(user);
        } catch (error) {
          pending.current = null;
          setVerifying(null);
          current.reject(error);
        }
      }}
    />
  );

  if (isCompact)
    return (
      <>
        <MobileRegisterForm
          onSubmit={submit}
          onDone={() =>
            navigate(createdUser.current ? resolveHomeRoute(createdUser.current) : "/login", {
              replace: true,
            })
          }
        />
        {phoneDialog}
      </>
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
        <>
          {t("register.haveAccountQuestion")}{" "}
          <Link className="text-brand transition-opacity hover:opacity-80" to="/login">
            {t("form.submit")}
          </Link>
        </>
      }
    >
      <RegisterForm onSubmit={submit} />
      {phoneDialog}
    </AuthShell>
  );
}
