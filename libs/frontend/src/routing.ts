import { matchPath, type Location } from "react-router";

// Simple regex only allowing locales with language code and optional country code
// Consider to extend if needed
const localeRegex = /^[a-zA-Z]{2}(?:-[a-zA-Z]{2})?$/;

export function getLocaleAndPageUrl(relativeUrl: string) {
  const pathname = toUrl(relativeUrl).pathname;
  const match = matchPath("/:localeCandidate/*", pathname);

  const localeCandidate = match?.params.localeCandidate;
  if (!localeCandidate || !localeRegex.test(localeCandidate)) {
    return { locale: undefined, pageUrl: relativeUrl };
  }

  return {
    locale: localeCandidate,
    pageUrl: relativeUrl.replace(`/${localeCandidate}`, ""),
  };
}

export function buildLocalizedRelativeUrl(
  locale: string | null,
  pageUrl: string,
) {
  const url = toUrl(pageUrl);
  url.pathname = `${locale ? `/${locale}` : ""}${url.pathname === "/" ? "" : url.pathname}`;
  return toRelativeUrl(url);
}

export function getRequestUrl(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("X-Forwarded-Proto") === "https") {
    url.protocol = "https";
  }

  return url;
}

export function toRelativeUrl(urlOrLocation: URL | Location) {
  if (urlOrLocation instanceof URL) {
    return urlOrLocation.toString().replace(urlOrLocation.origin, "");
  }

  return urlOrLocation.pathname + urlOrLocation.search + urlOrLocation.hash;
}

export function toUrl(relativeUrl: string, baseUrl?: string) {
  return new URL(relativeUrl, baseUrl || "http://dummy");
}
