import i18next, { type BackendModule, type ResourceKey } from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, useLanguageStore } from "@/shared/model";

type LocaleModule = { default: ResourceKey };

const PATTERN = /\/locales\/([a-z]+)\/([a-z]+)\.json$/;

const coreModules = import.meta.glob<LocaleModule>(
  ["./locales/uz/common.json", "./locales/uz/auth.json", "./locales/uz/nav.json"],
  { eager: true }
);
const lazyModules = import.meta.glob<LocaleModule>([
  "./locales/*/*.json",
  "!./locales/uz/common.json",
  "!./locales/uz/auth.json",
  "!./locales/uz/nav.json",
]);

const coreNamespaces: string[] = [];
const coreResources: Record<string, ResourceKey> = {};
for (const [path, module] of Object.entries(coreModules)) {
  const namespace = PATTERN.exec(path)?.[2];
  if (!namespace) continue;
  coreNamespaces.push(namespace);
  coreResources[namespace] = module.default;
}

const allNamespaces = [
  ...new Set(Object.keys(lazyModules).map((path) => PATTERN.exec(path)?.[2]).filter(Boolean) as string[]),
];

const localeBackend: BackendModule = {
  type: "backend",
  init: () => undefined,
  read(language, namespace, callback) {
    const load = lazyModules[`./locales/${language}/${namespace}.json`];
    if (!load) {
      callback(null, {});
      return;
    }
    load().then(
      (module) => callback(null, module.default),
      (error: unknown) => callback(error instanceof Error ? error : new Error(String(error)), false)
    );
  },
};

export const i18nReady = i18next
  .use(localeBackend)
  .use(initReactI18next)
  .init({
    resources: { [DEFAULT_LANGUAGE]: coreResources },
    partialBundledLanguages: true,
    lng: useLanguageStore.getState().language,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: coreNamespaces,
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnNull: false,
  })
  .then(() => undefined, () => undefined);

export function prefetchTranslations(): Promise<void> {
  return i18nReady.then(() => i18next.loadNamespaces(allNamespaces)).catch(() => undefined);
}

useLanguageStore.subscribe((state) => {
  if (i18next.language !== state.language) void i18next.changeLanguage(state.language);
});

export { i18next as i18n };
