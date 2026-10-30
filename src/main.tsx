import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { i18nReady } from "@/shared/i18n";
import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";

const container = document.getElementById("root");
if (!container) throw new Error("#root elementi topilmadi");

void i18nReady.then(() =>
  createRoot(container).render(
    <StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </StrictMode>
  )
);
