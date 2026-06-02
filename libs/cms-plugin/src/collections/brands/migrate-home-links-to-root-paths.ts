import type { Payload, PayloadRequest } from "payload";

import { validateRootPathFormat } from "../../common/pathname.js";
import { type LocalizedRootPath, normalizeRootPathValue } from "./root-path.js";

type ID = number | string;

type BrandWithLegacyHomeLink = {
  homeLink?: {
    doc?: unknown;
  };
  id: ID;
  rootPath?: unknown;
};

type PageWithPathname = {
  id: ID;
  pathname?: unknown;
};

type FindResult<T> = {
  docs: T[];
};

type PayloadFind = (
  options: Record<string, unknown>,
) => Promise<FindResult<unknown>>;

type PayloadFindByID = (options: Record<string, unknown>) => Promise<unknown>;

type PayloadUpdate = (options: Record<string, unknown>) => Promise<unknown>;

type RequestOptions = {
  req?: PayloadRequest;
};

export type MigrateBrandHomeLinksToRootPathsOptions = {
  brandCollectionSlug?: string;
  dryRun?: boolean;
  pageCollectionSlug?: string;
  payload: Payload;
  req?: PayloadRequest;
};

export type MigrateBrandHomeLinksToRootPathsResult = {
  brandsAlreadyMigrated: number;
  brandsProcessed: number;
  brandsSkipped: number;
  brandsUpdated: number;
  dryRun: boolean;
  missingHomeLinks: number;
  missingPages: number;
};

function relationshipID(value: unknown): ID | undefined {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = value.id;
    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isUsableRootPath(value: string) {
  return value.length > 0 && validateRootPathFormat(value) === true;
}

function usableRootPath(
  value: unknown,
): LocalizedRootPath | string | undefined {
  const normalizedValue = normalizeRootPathValue(value);

  if (
    typeof normalizedValue === "string" &&
    isUsableRootPath(normalizedValue)
  ) {
    return normalizedValue;
  }

  if (!isPlainObject(normalizedValue)) {
    return undefined;
  }

  const localizedRootPath = Object.fromEntries(
    Object.entries(normalizedValue).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && isUsableRootPath(entry[1]),
    ),
  );

  return Object.keys(localizedRootPath).length > 0
    ? localizedRootPath
    : undefined;
}

async function findBrands({
  brandCollectionSlug,
  find,
  requestOptions,
}: {
  brandCollectionSlug: string;
  find: PayloadFind;
  requestOptions: RequestOptions;
}) {
  return (
    await find({
      collection: brandCollectionSlug,
      depth: 0,
      locale: "all",
      pagination: false,
      select: {
        homeLink: true,
        rootPath: true,
      },
      showHiddenFields: true,
      ...requestOptions,
    })
  ).docs as BrandWithLegacyHomeLink[];
}

async function findPageByID({
  findByID,
  pageCollectionSlug,
  pageID,
  requestOptions,
}: {
  findByID: PayloadFindByID;
  pageCollectionSlug: string;
  pageID: ID;
  requestOptions: RequestOptions;
}) {
  return (await findByID({
    id: pageID,
    collection: pageCollectionSlug,
    depth: 0,
    disableErrors: true,
    locale: "all",
    select: {
      pathname: true,
    },
    ...requestOptions,
  })) as null | PageWithPathname;
}

async function updateBrandRootPath({
  brandCollectionSlug,
  brandID,
  requestOptions,
  rootPath,
  update,
}: {
  brandCollectionSlug: string;
  brandID: ID;
  requestOptions: RequestOptions;
  rootPath: LocalizedRootPath | string;
  update: PayloadUpdate;
}) {
  if (typeof rootPath === "string") {
    await update({
      id: brandID,
      collection: brandCollectionSlug,
      data: {
        rootPath,
      },
      overrideAccess: true,
      ...requestOptions,
    });
    return;
  }

  for (const [locale, localizedRootPath] of Object.entries(rootPath)) {
    await update({
      id: brandID,
      collection: brandCollectionSlug,
      data: {
        rootPath: localizedRootPath,
      },
      locale,
      overrideAccess: true,
      ...requestOptions,
    });
  }
}

export async function migrateBrandHomeLinksToRootPaths({
  brandCollectionSlug = "brands",
  dryRun = false,
  pageCollectionSlug = "pages",
  payload,
  req,
}: MigrateBrandHomeLinksToRootPathsOptions): Promise<MigrateBrandHomeLinksToRootPathsResult> {
  const result: MigrateBrandHomeLinksToRootPathsResult = {
    brandsAlreadyMigrated: 0,
    brandsProcessed: 0,
    brandsSkipped: 0,
    brandsUpdated: 0,
    dryRun,
    missingHomeLinks: 0,
    missingPages: 0,
  };

  const requestOptions = req ? { req } : {};
  const find = payload.find.bind(payload) as unknown as PayloadFind;
  const findByID = payload.findByID.bind(payload) as unknown as PayloadFindByID;
  const update = payload.update.bind(payload) as unknown as PayloadUpdate;

  const brands = await findBrands({
    brandCollectionSlug,
    find,
    requestOptions,
  });

  for (const brand of brands) {
    result.brandsProcessed += 1;

    if (usableRootPath(brand.rootPath)) {
      result.brandsAlreadyMigrated += 1;
      result.brandsSkipped += 1;
      continue;
    }

    const homePageID = relationshipID(brand.homeLink?.doc);
    if (!homePageID) {
      result.missingHomeLinks += 1;
      result.brandsSkipped += 1;
      continue;
    }

    const page = await findPageByID({
      findByID,
      pageCollectionSlug,
      pageID: homePageID,
      requestOptions,
    });
    if (!page) {
      result.missingPages += 1;
      result.brandsSkipped += 1;
      continue;
    }

    const rootPath = usableRootPath(page.pathname);
    if (!rootPath) {
      result.brandsSkipped += 1;
      continue;
    }

    result.brandsUpdated += 1;

    if (!dryRun) {
      await updateBrandRootPath({
        brandCollectionSlug,
        brandID: brand.id,
        requestOptions,
        rootPath,
        update,
      });
    }
  }

  return result;
}
