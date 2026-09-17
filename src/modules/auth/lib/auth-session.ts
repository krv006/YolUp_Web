import { AppError, API_ERROR_CODES, refreshTokenManager, tokenStorage } from "@/shared/api";
import { authApi } from "../api/auth.api";
import { mapTokenPairDto } from "./auth.mappers";

let configured = false;

export function configureAuthRefresh(): void {
  if (configured) return;
  refreshTokenManager.configure(async () => {
    const refresh = tokenStorage.getRefreshToken();
    if (!refresh) {
      throw new AppError({ code: API_ERROR_CODES.UNAUTHORIZED, message: "Sessiya tugagan" });
    }
    const persistent = tokenStorage.isPersistent();
    const tokenPair = mapTokenPairDto(await authApi.refresh({ refresh }));
    if (tokenStorage.getRefreshToken() !== refresh) return;
    tokenStorage.setTokens(tokenPair, { persistent });
  });
  configured = true;
}
