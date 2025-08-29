import { createCookie } from "react-router";
import { RemixI18Next } from "remix-i18next/server";
import i18n from "./i18n"; // your i18n configuration file
import { I18NextBackend } from "./i18next-backend.server";
import { cms } from "./cms.server";
import { LocaleConfig } from "./cms-plugin-types";

export const localeCookie = createCookie("locale");

export async function createRemixI18Next(request: Request) {
  const settings = await cms().getSettings(request);
  return new RemixI18Next({
    detection: {
      supportedLanguages: (
        settings.publishedLocales.publishedLocales as LocaleConfig[]
      ).map((l) => l.id),
      fallbackLanguage: (
        settings.publishedLocales.fallbackLocale as LocaleConfig
      ).id,
      order: ["searchParams", "cookie", "header"],
      cookie: localeCookie,
    },
    // This is the configuration for i18next used
    // when translating messages server-side only
    i18next: i18n,
    // The i18next plugins you want RemixI18next to use for `i18n.getFixedT` inside loaders and actions.
    // E.g. The Backend plugin for loading translations from the file system
    // Tip: You could pass `resources` to the `i18next` configuration and avoid a backend here
    plugins: [I18NextBackend],
  });
}
