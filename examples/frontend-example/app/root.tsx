import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type LinksFunction,
  type MetaFunction,
  type unstable_MiddlewareFunction,
} from "react-router";

import {
  initializeCms,
  initializeSessions,
  initializeConfig,
  loader,
  AnalyticsScript,
  OptInLivePreview,
  BRANDS_DEPTH,
} from "@fxmk/frontend";

export { loader, handle } from "@fxmk/frontend";
import styles from "./global.css?url";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ThemeProvider } from "./themes";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Playfair%20Display:wght@400..500&display=swap",
  },
];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const brandId = data?.brand?.id ?? "puerta";
  return [
    {
      tagName: "link",
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      href: `/assets/${brandId}/favicon-96x96.png`,
    },
    {
      tagName: "link",
      rel: "icon",
      type: "image/svg+xml",
      href: `/assets/${brandId}/favicon.svg`,
    },
    {
      tagName: "link",
      rel: "shortcut icon",
      href: `/assets/${brandId}/favicon.ico`,
    },
    {
      tagName: "link",
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: `/assets/${brandId}/apple-touch-icon.png`,
    },
    {
      tagName: "link",
      rel: "manifest",
      sizes: "180x180",
      href: `/assets/${brandId}/site.webmanifest`,
    },
  ];
};

const middleware: unstable_MiddlewareFunction = function middleware({}) {
  initializeCms({
    apiKey: process.env.PAYLOAD_CMS_API_KEY!,
    baseUrl: process.env.PAYLOAD_CMS_BASE_URL!,
    redisUrl: process.env.REDIS_URL!,
  });
  initializeSessions({
    canonicalHostname: process.env.CANONICAL_HOSTNAME!,
    sessionSecret: process.env.SESSION_SECRET!,
  });
  initializeConfig({
    canonicalHostname: process.env.CANONICAL_HOSTNAME!,
  });
};

export const unstable_middleware = [middleware];

export default function App(): ReactNode {
  const {
    brand,
    settings,
    // footer, // TODO fix this
    analyticsDomain,
    allBrands,
    isAuthorized,
    adminLocale,
    environment,
    publishedLocales,
  } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();

  const [headerHeight, setHeaderHeight] = useState(0);

  return (
    <html
      lang={i18n.language}
      dir={i18n.dir()}
      style={{ scrollPaddingTop: getScrollTopPadding(headerHeight) }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <AnalyticsScript analyticsDomain={analyticsDomain} />
      </head>
      <body className="bg-white text-neutral-900 antialiased">
        {/* <GoogleMapsAPIProvider
          apiKey={environment.googleMapsApiKey}
          language={
            publishedLocales.find((l) => l.id === i18n.language)
              ?.googleMapsLanguage ?? undefined
          }
          region={settings.maps?.region || undefined}
        > */}
        <ThemeProvider brandId={brand.id}>
          {/*    {settings.maintenanceScreen?.show && isAuthorized && (
              <PreviewBar adminLocale={adminLocale!} />
            )}*/}
          <OptInLivePreview
            path={`brands/${brand.id}`}
            data={brand}
            depth={BRANDS_DEPTH}
          >
            {(brand) => (
              <>
                {/* {isAuthorized && (
                  <Header
                    brand={brand}
                    allBrands={allBrands}
                    publishedLocales={publishedLocales}
                    onHeightChanged={setHeaderHeight}
                  />
                )} */}
                <main>
                  <Outlet />
                </main>
                {/* {isAuthorized && (
                  <Footer
                    brand={brand}
                    allBrands={allBrands}
                    content={footer}
                  />
                )} */}
              </>
            )}
          </OptInLivePreview>
        </ThemeProvider>
        {/* </GoogleMapsAPIProvider> */}

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const ADDITIONAL_SCROLL_PADDING = 32;

function getScrollTopPadding(headerHeight: number) {
  return headerHeight + ADDITIONAL_SCROLL_PADDING;
}

// export const ErrorBoundary = GlobalErrorBoundary;
