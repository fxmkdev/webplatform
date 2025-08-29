import { redirect } from "react-router";
import { createRemixI18Next } from "./i18next.server";
import {
  getLocaleAndPageUrl,
  toRelativeUrl,
  getRequestUrl,
  buildLocalizedRelativeUrl,
} from "./routing";
import { cms } from "./cms.server";
import { isAuthenticated } from "./auth.server";
import { getPageLinkHref } from "./page-link";
import { config } from "./config";

export function getCanonicalRequestUrl(request: Request) {
  const url = getRequestUrl(request);
  url.hostname = config().canonicalHostname;
  return url;
}

export async function handleIncomingRequest(request: Request) {
  const url = getRequestUrl(request);

  redirectIfBrandSubdomain(url, "aqua");
  redirectIfBrandSubdomain(url, "azul");

  redirectIfNonCanonicalHostname(request);
  redirectIfPathnameEndsWithSlash(url);

  const { locale, pageUrl } = getLocaleAndPageUrl(toRelativeUrl(url));

  if (!locale) {
    const remixI18Next = await createRemixI18Next(request);
    const locale = await remixI18Next.getLocale(request);
    await redirectToLocalizedRoute(request, url, locale);
  }

  // TypeScript doesn't recognize that the awaited `redirectToLocalizedRoute` never returns
  if (!locale) throw new Error();

  const settings = await cms().getSettings(request, locale!);
  if (
    settings.maintenanceScreen?.show &&
    !(await isAuthenticated(request)) &&
    pageUrl !== "/login"
  ) {
    throw new Response(null, {
      status: 503,
      statusText: "Service Unavailable",
    });
  }

  return { locale, pageUrl };
}

function redirectIfBrandSubdomain(url: URL, brandName: string) {
  const domainPrefix = `${brandName}.`;
  if (url.hostname.startsWith(domainPrefix)) {
    url.hostname = url.hostname.replace(domainPrefix, "");
    url.pathname = `/${brandName}${url.pathname === "/" ? "" : url.pathname}`;
    throw redirect(url.href);
  }
}

function redirectIfNonCanonicalHostname(request: Request) {
  const canonicalRequestUrl = getCanonicalRequestUrl(request);
  if (getRequestUrl(request).hostname !== canonicalRequestUrl.hostname) {
    throw redirect(canonicalRequestUrl.href, { status: 301 });
  }
}

function redirectIfPathnameEndsWithSlash(url: URL) {
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
    throw redirect(toRelativeUrl(url), { status: 301 });
  }
}

export async function redirectToLocalizedRoute(
  request: Request,
  url: URL,
  locale: string,
  headers?: Record<string, string>,
): Promise<never> {
  const localizedPagePathname = await cms().tryGetLocalizedPathname(
    request,
    url.pathname,
    locale,
  );
  if (localizedPagePathname) {
    url.pathname = localizedPagePathname;
    throw redirect(buildLocalizedRelativeUrl(locale, toRelativeUrl(url)), {
      headers: { ...headers },
    });
  }

  // route is not a page pathname, just redirect it as-is (e.g. '/login')
  throw redirect(buildLocalizedRelativeUrl(locale, toRelativeUrl(url)), {
    headers: { ...headers },
  });
}

export async function handlePathname(
  request: Request,
  pathname: string,
  locale: string,
) {
  const content = await cms().tryGetPage(request, pathname, locale);
  if (content) return content;

  const redirectObj = await cms().tryGetRedirect(request, pathname, locale);
  if (redirectObj && redirectObj.to) {
    throw redirect(
      getPageLinkHref(
        {
          linkType: "internal",
          doc: redirectObj.to.page,
          queryString: redirectObj.to.queryString,
          fragment: redirectObj.to.fragment,
        },
        locale,
      ),
      { status: 301 },
    );
  }

  throw new Response(null, { status: 404, statusText: "Not Found" });
}
