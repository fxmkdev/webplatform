import { createInstance as createI18nInstance, i18n } from "i18next";
import { getLocaleAndPageUrl, getRequestUrl, toRelativeUrl } from "./routing";
import { cms } from "./cms.server";
import { createRemixI18Next } from "./i18next.server";
import { EntryContext } from "react-router";
import { initReactI18next } from "react-i18next";
import { I18NextBackend } from "./i18next-backend.server";
import i18nConfig from "./i18n";
import { LocaleConfig } from "./cms-plugin-types";

export async function createI18NextServer(
  request: Request,
  reactRouterContext: EntryContext,
) {
  const i18nInstance = createI18nInstance() as i18n;
  const { locale } = getLocaleAndPageUrl(toRelativeUrl(getRequestUrl(request)));
  const settings = await cms().getSettings(request);
  const remixI18Next = await createRemixI18Next(request);

  const ns = remixI18Next.getRouteNamespaces(reactRouterContext);

  await i18nInstance
    .use(initReactI18next) // Tell our instance to use react-i18next
    .use(I18NextBackend)
    .init({
      ...i18nConfig, // spread the configuration
      // This is the language you want to use in case
      // if the user language is not in the supportedLngs
      fallbackLng: (settings.publishedLocales.fallbackLocale as LocaleConfig)
        .id,
      supportedLngs: (
        settings.publishedLocales.publishedLocales as LocaleConfig[]
      ).map((l) => l.id),
      lng: locale, // The locale we detected above
      ns, // The namespaces the routes about to render wants to use
      backend: { request },
    });

  return i18nInstance;
}
