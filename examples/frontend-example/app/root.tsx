import {
  Link,
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
  type Brand,
  PageLink,
} from "@fxmk/frontend";

export { loader, handle } from "@fxmk/frontend";
import styles from "./global.css?url";
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { link } from "fs";

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

  return (
    <html lang={i18n.language} dir={i18n.dir()}>
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
              {isAuthorized && <Header brand={brand} />}
              <main>
                <Outlet />
              </main>
              {isAuthorized && <Footer brand={brand} />}
            </>
          )}
        </OptInLivePreview>
        {/* </GoogleMapsAPIProvider> */}

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Header({ brand }: { brand: Brand }) {
  return (
    <header>
      <nav>
        <ul className="flex gap-2">
          {brand.navLinks?.map((navLink) => (
            <li key={navLink.id}>
              <PageLink link={navLink.link}>{navLink.label}</PageLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function Footer({ brand }: { brand: Brand }) {
  return (
    <footer>
      <ul className="flex gap-4">
        {brand.footer?.linkGroups?.map((linkGroup) => (
          <li key={linkGroup.id}>
            <h3>{linkGroup.title}</h3>
            <ul>
              {linkGroup.links?.map((link) => (
                <li key={link.id}>
                  <PageLink link={link.link}>{link.label}</PageLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </footer>
  );
}

// export const ErrorBoundary = GlobalErrorBoundary;
