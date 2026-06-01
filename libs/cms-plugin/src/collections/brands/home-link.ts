import type { PayloadRequest } from "payload";

import {
  createIsolatedLocalRequest,
  getPublishedLocaleIds,
  resolveRootPathForLocale,
} from "./root-path.js";

function getRelationshipId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }

  return undefined;
}

export function getPageBrandId(page: Record<string, unknown>) {
  return getRelationshipId(page.brand);
}

export async function syncBrandHomeLink({
  brandId,
  req,
}: {
  brandId: string;
  req: PayloadRequest;
}) {
  const brand = await req.payload.findByID({
    id: brandId,
    collection: "brands",
    locale: "all",
    req: createIsolatedLocalRequest(req),
    select: {
      rootPath: true,
    },
  });

  const rootPathsByLocale = getRootPathsByLocale(
    brand.rootPath,
    await getPublishedLocaleIds(req),
  );

  if (rootPathsByLocale.length === 0) {
    return;
  }

  const homePages = await req.payload.find({
    collection: "pages",
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: {
      and: [
        { brand: { equals: brandId } },
        {
          or: rootPathsByLocale.map(({ localeId, rootPath }) => ({
            [`pathname.${localeId}`]: { equals: rootPath },
          })),
        },
      ],
    },
  });

  const homePage = homePages.docs[0];
  await req.payload.update({
    id: brandId,
    collection: "brands",
    data: {
      homeLink: homePage
        ? {
            doc: homePage.id,
            linkType: "internal",
          }
        : {},
    },
    locale: "en",
    overrideAccess: true,
    req,
  });
}

export function getRootPathsByLocale(rootPath: unknown, localeIds: string[]) {
  if (!rootPath || typeof rootPath !== "object" || Array.isArray(rootPath)) {
    return [];
  }

  return localeIds.flatMap((localeId) => {
    const localizedRootPath = resolveRootPathForLocale(rootPath, localeId);

    return localizedRootPath ? [{ localeId, rootPath: localizedRootPath }] : [];
  });
}
