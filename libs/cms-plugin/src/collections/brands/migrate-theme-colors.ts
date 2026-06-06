import type { Payload, PayloadRequest } from "payload";

type ID = number | string;

type BrandWithThemeColor = {
  id: ID;
  themeColor?: unknown;
};

type FindResult<T> = {
  docs: T[];
};

type PayloadFind = (
  options: Record<string, unknown>,
) => Promise<FindResult<unknown>>;

type PayloadUpdate = (options: Record<string, unknown>) => Promise<unknown>;

type RequestOptions = {
  req?: PayloadRequest;
};

export type MigrateBrandThemeColorsOptions = {
  brandCollectionSlug?: string;
  defaultThemeColor?: string;
  dryRun?: boolean;
  overwriteExisting?: boolean;
  payload: Payload;
  req?: PayloadRequest;
  themeColorByBrandId?: Record<string, string>;
};

export type MigrateBrandThemeColorsResult = {
  brandsAlreadyMigrated: number;
  brandsProcessed: number;
  brandsSkipped: number;
  brandsUpdated: number;
  brandsUsingDefaultThemeColor: number;
  dryRun: boolean;
};

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
      pagination: false,
      select: {
        themeColor: true,
      },
      showHiddenFields: true,
      ...requestOptions,
    })
  ).docs as BrandWithThemeColor[];
}

function usableThemeColor(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function migrateBrandThemeColors({
  brandCollectionSlug = "brands",
  defaultThemeColor = "default",
  dryRun = false,
  overwriteExisting = false,
  payload,
  req,
  themeColorByBrandId = {},
}: MigrateBrandThemeColorsOptions): Promise<MigrateBrandThemeColorsResult> {
  const result: MigrateBrandThemeColorsResult = {
    brandsAlreadyMigrated: 0,
    brandsProcessed: 0,
    brandsSkipped: 0,
    brandsUpdated: 0,
    brandsUsingDefaultThemeColor: 0,
    dryRun,
  };

  const requestOptions = req ? { req } : {};
  const find = payload.find.bind(payload) as unknown as PayloadFind;
  const update = payload.update.bind(payload) as unknown as PayloadUpdate;

  const brands = await findBrands({
    brandCollectionSlug,
    find,
    requestOptions,
  });

  for (const brand of brands) {
    result.brandsProcessed += 1;

    const existingThemeColor = usableThemeColor(brand.themeColor);
    if (existingThemeColor && !overwriteExisting) {
      result.brandsAlreadyMigrated += 1;
      result.brandsSkipped += 1;
      continue;
    }

    const mappedThemeColor = themeColorByBrandId[String(brand.id)];
    const themeColor = mappedThemeColor ?? defaultThemeColor;

    if (existingThemeColor === themeColor) {
      result.brandsAlreadyMigrated += 1;
      result.brandsSkipped += 1;
      continue;
    }

    if (!mappedThemeColor) {
      result.brandsUsingDefaultThemeColor += 1;
    }

    result.brandsUpdated += 1;

    if (!dryRun) {
      await update({
        id: brand.id,
        collection: brandCollectionSlug,
        data: {
          themeColor,
        },
        overrideAccess: true,
        ...requestOptions,
      });
    }
  }

  return result;
}
