import { MetaFunction, useLoaderData, LoaderFunctionArgs } from "react-router";
import { OptInLivePreview } from "../live-preview";
import { Page } from "../page";
import { getPageTitle } from "../meta";
import {
  getCanonicalRequestUrl,
  handleIncomingRequest,
  handlePathname,
} from "../routing.server";
import { buildLocalizedRelativeUrl, getRequestUrl, toUrl } from "../routing";
import { SerializeFromLoader } from "../types";
import { type loader as rootLoader } from "../root-utils";
import { toImagekitTransformationString } from "../image";
import { getAltFromMedia } from "../media";
import { PAGE_DEPTH } from "../cms";
import { cms } from "../cms.server";
import { LocaleConfig } from "../cms-plugin-types";
import { ReactNode } from "react";

export const meta: MetaFunction<typeof loader> = ({ data, matches }) => {
  if (!data) throw new Error("No loader data");

  const rootLoaderData = matches.find((m) => m.id === "root")
    ?.data as SerializeFromLoader<typeof rootLoader>;
  if (!rootLoaderData) throw new Error("No root loader data");

  const parentMeta = matches.flatMap((match) => match.meta ?? []);

  const description = data.content.seo?.description ?? "";
  return [
    ...parentMeta,
    ...data.alternateUrls.map((alternateUrl) => ({
      tagName: "link",
      rel: "alternate",
      href: alternateUrl.href,
      hrefLang: alternateUrl.hrefLang,
    })),
    {
      tagName: "link",
      rel: "canonical",
      href: data?.canonicalUrl,
    },
    { title: getPageTitle(data.content) },
    {
      name: "description",
      content: description,
    },
    {
      name: "og:title",
      content: getPageTitle(data.content),
    },
    {
      name: "og:description",
      content: description,
    },
    {
      name: "og:locale",
      content: rootLoaderData.locale,
    },
    ...data.publishedLocaleCodes
      .filter((lng) => lng !== rootLoaderData.locale)
      .map((lng) => ({
        name: "og:locale:alternate",
        content: lng,
      })),
    {
      name: "og:type",
      content: "website",
    },
    {
      name: "og:site_name",
      content: rootLoaderData.allBrands.find((b) => b.id === "puerta")!.name,
    },
    {
      name: "og:url",
      content: data.canonicalUrl,
    },
    ...getOpenGraphImageMeta(data, rootLoaderData),
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: getPageTitle(data.content),
    },
    {
      name: "twitter:description",
      content: description,
    },
    ...getTwitterCardImageMeta(data, rootLoaderData),
  ];
};

function getTwitterCardImageMeta(
  data: SerializeFromLoader<typeof loader>,
  rootLoaderData: SerializeFromLoader<typeof rootLoader>,
): { name: string; content: string }[] {
  const image = data.content.seo?.image;
  if (!image) {
    return [];
  }

  if (typeof image !== "object") {
    throw new Error("Invalid image");
  }

  return [
    {
      name: "twitter:image",
      content: getSocialImageUrl(data, rootLoaderData, 2400, 1200),
    },
    {
      name: "twitter:image:alt",
      content: getAltFromMedia(image) ?? "",
    },
  ];
}

function getOpenGraphImageMeta(
  data: SerializeFromLoader<typeof loader>,
  rootLoaderData: SerializeFromLoader<typeof rootLoader>,
): { name: string; content: string }[] {
  const image = data.content.seo?.image;
  if (!image) {
    return [];
  }

  if (typeof image !== "object") {
    throw new Error("Invalid image");
  }

  const width = 1200;
  const height = 630;

  return [
    {
      name: "og:image",
      content: getSocialImageUrl(data, rootLoaderData, width, height),
    },
    {
      name: "og:image:alt",
      content: getAltFromMedia(image) ?? "",
    },
    { name: "og:image:type", content: image.mimeType ?? "" },
    { name: "og:image:width", content: width.toString() },
    { name: "og:image:height", content: height.toString() },
  ];
}

function getSocialImageUrl(
  data: SerializeFromLoader<typeof loader>,
  rootLoaderData: SerializeFromLoader<typeof rootLoader>,
  width: number,
  height: number,
) {
  const image = data.content.seo?.image;
  if (typeof image !== "object") {
    throw new Error("Invalid image");
  }

  if (!image) return "";

  return `${rootLoaderData.environment.imagekitBaseUrl.toString()}/${toImagekitTransformationString({ width, height })}/${image.filename}`;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { pageUrl, locale } = await handleIncomingRequest(request);

  const requestUrl = getRequestUrl(request);

  const content = await handlePathname(
    request,
    toUrl(pageUrl).pathname,
    locale,
  );
  if (!content) {
    throw new Response(null, { status: 404, statusText: "Not Found" });
  }
  const dataPath = `pages/${content.id}`;
  const settings = await cms().getSettings(request);
  const publishedLocaleCodes = (
    settings.publishedLocales.publishedLocales as LocaleConfig[]
  ).map((l) => l.id);
  const alternateUrlsByLocale = await getAlternateHrefsByLocale(
    request,
    content.pathname,
    publishedLocaleCodes,
  );

  const fallbackLocaleCode = (
    settings.publishedLocales.fallbackLocale as LocaleConfig
  ).id;

  return {
    origin: requestUrl.origin,
    canonicalUrl: getCanonicalRequestUrl(request).href,
    pageUrl,
    dataPath,
    content,
    publishedLocaleCodes,
    fallbackLocaleCode,
    alternateUrls: [
      ...Object.entries(alternateUrlsByLocale).map(([locale, href]) => ({
        href,
        hrefLang: locale,
      })),
      {
        href: alternateUrlsByLocale[fallbackLocaleCode],
        hrefLang: "x-default",
      },
    ],
  };
}

export default function Route(): ReactNode {
  const { dataPath, content } = useLoaderData<typeof loader>();

  return (
    <OptInLivePreview path={dataPath} data={content} depth={PAGE_DEPTH}>
      {(data) => <Page content={data} />}
    </OptInLivePreview>
  );
}

async function getAlternateHrefsByLocale(
  request: Request,
  pathname: string,
  publishedLocaleCodes: string[],
) {
  return Object.fromEntries(
    await Promise.all(
      publishedLocaleCodes.map(async (lng) => {
        const localizedPathname = await cms().tryGetLocalizedPathname(
          request,
          pathname,
          lng,
        );
        if (!localizedPathname) {
          throw new Error("Localized pathname not found");
        }
        const requestUrl = getRequestUrl(request);
        requestUrl.pathname = buildLocalizedRelativeUrl(lng, localizedPathname);
        return [lng, requestUrl.toString()];
      }),
    ),
  );
}
