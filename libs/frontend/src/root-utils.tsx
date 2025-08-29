import { LoaderFunctionArgs } from "react-router";
import {
  getLocaleAndPageUrl,
  getRequestUrl,
  toRelativeUrl,
  toUrl,
} from "./routing";
import { cms } from "./cms.server";
import { isAuthenticated } from "./auth.server";
import { Brand, LocaleConfig } from "./cms-plugin-types";
import { createRemixI18Next } from "./i18next.server";
import { LanguageDetector } from "remix-i18next/server";
import { getVersion } from "./version.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = getRequestUrl(request);
  const { pageUrl, locale } = getLocaleAndPageUrl(toRelativeUrl(url));
  if (!locale) throw new Error("Locale has not been determined");

  const [page, allBrands, common, settings] = await Promise.all([
    cms().tryGetPage(request, toUrl(pageUrl).pathname, locale),
    cms().getBrands(request, locale),
    cms().getCommon(request, locale),
    cms().getSettings(request, locale),
    // cms().getFooter(request, locale), // TODO solve this
  ]);

  // If maintenance screen is not enabled, public access is authorized
  // Otherwise, check if the user is authenticated
  const isAuthorized =
    !settings.maintenanceScreen?.show || (await isAuthenticated(request));

  // retrieving the brand from `allBrands`, `page.brand` does not have the right depth
  const brandId = page ? (page.brand as Brand).id : "puerta";
  const brand = allBrands.find((b) => b.id === brandId);
  if (!brand) throw new Error("Brand not found");

  return {
    isAuthorized,
    locale,
    adminLocale: settings.maintenanceScreen?.show
      ? await loadAdminLocale()
      : undefined,
    brand,
    allBrands,
    settings,
    common,
    // footer,
    environment: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY!,
      version: await getVersion(),
      payloadCmsBaseUrl: process.env.PAYLOAD_CMS_BASE_URL!,
      imagekitBaseUrl: process.env.IMAGEKIT_BASE_URL!,
      preview: getRequestUrl(request).searchParams.get("preview") || undefined,
      useImageCacheBuster: false, // Cache busting is only used in Storybook for Chromatic
    },
    analyticsDomain: process.env.ANALYTICS_DOMAIN,
    publishedLocales: settings.publishedLocales
      .publishedLocales as LocaleConfig[],
  };

  async function loadAdminLocale() {
    const remixI18Next = await createRemixI18Next(request);
    // The admin should be able to test the page in any locale, but see the admin controls in their preferred locale.
    // Therefore only using header for the admin locale (unfortunately we cannot get the user's locale from Payload CMS)
    return await new LanguageDetector({
      ...remixI18Next["options"].detection,
      order: ["header"],
    }).detect(request);
  }
}

export const handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "ui-labels",
};
