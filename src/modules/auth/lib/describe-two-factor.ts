import type { TFunction } from "i18next";
import type { TwoFactorChallenge } from "../api/auth.dto";

export function describeTwoFactorChallenge(challenge: TwoFactorChallenge, t: TFunction<"auth">) {
  return challenge.phoneHint
    ? t("twoFactor.description", { phone: challenge.phoneHint })
    : t("twoFactor.descriptionAny");
}
