import type { TFunction } from "@payloadcms/translations";
import type { PayloadRequest, TextField, ValidateOptions } from "payload";

import { text } from "payload/shared";

import type { TranslationsKey } from "../../translations/types.js";

import {
  normalizePathnameInput,
  pathnameBelongsToRootPath,
  validateRootPathFormat,
} from "../../common/pathname.js";
import { textField } from "../../fields/text.js";

export type LocalizedRootPath = Record<string, string>;
type TextValidationOptions = ValidateOptions<
  unknown,
  unknown,
  TextField,
  string
>;

export function rootPathField() {
  return textField({
    name: "rootPath",
    admin: {
      description: {
        en: "The localized root path for this brand. Pages for this brand must use this path or a child path below it.",
        es: "La ruta raíz localizada de esta marca. Las páginas de esta marca deben usar esta ruta o una ruta hija dentro de ella.",
      },
      placeholder: "e.g. /brand-name",
    },
    enableTranslationTools: false,
    hooks: {
      beforeValidate: [({ value }) => normalizeRootPathValue(value)],
    },
    label: {
      en: "Root Path",
      es: "Ruta raíz",
    },
    validate: validateRootPath,
  });
}

async function validateRootPath(
  value: LocalizedRootPath | null | string | undefined,
  options: ValidateOptions<
    Record<string, unknown>,
    Record<string, unknown>,
    TextField,
    LocalizedRootPath | string
  >,
) {
  const values = getRootPathValuesForValidation(value);
  const textValidationOptions = options as unknown as TextValidationOptions;

  if (values === null) {
    return text(undefined, textValidationOptions);
  }

  if (typeof values === "string") {
    return validateRootPathValue(values, options);
  }

  for (const rootPath of Object.values(values)) {
    const validationResult = await validateRootPathValue(rootPath, options);
    if (validationResult !== true) {
      return validationResult;
    }
  }

  return true;
}

async function validateRootPathValue(
  value: string,
  options: ValidateOptions<
    Record<string, unknown>,
    Record<string, unknown>,
    TextField,
    LocalizedRootPath | string
  >,
) {
  const defaultValidationResult = text(
    value,
    options as unknown as TextValidationOptions,
  );
  if (defaultValidationResult !== true) {
    return defaultValidationResult;
  }

  const t = options.req.t as unknown as TFunction<TranslationsKey>;
  const rootPath = normalizePathnameInput(value);
  const formatValidationResult = validateRootPathFormat(rootPath);

  if (formatValidationResult !== true) {
    return t(`cmsPlugin:brands:rootPath:${formatValidationResult}`);
  }

  const duplicateBrand = (
    await getBrandsWithDuplicateRootPath(options.req, rootPath)
  ).find((brand) => brand.id !== options.id);
  if (duplicateBrand) {
    return t("cmsPlugin:brands:rootPath:alreadyExists");
  }

  return true;
}

export function normalizeRootPathValue(value: unknown) {
  if (typeof value === "string") {
    return normalizePathnameInput(value);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([localeId, localizedValue]) => [
      localeId,
      typeof localizedValue === "string"
        ? normalizePathnameInput(localizedValue)
        : localizedValue,
    ]),
  );
}

export function resolveRootPathForLocale(
  rootPath: unknown,
  localeId: string | undefined,
) {
  if (typeof rootPath === "string") {
    return normalizePathnameInput(rootPath);
  }

  if (!localeId || !isPlainObject(rootPath)) {
    return undefined;
  }

  const localizedRootPath = rootPath[localeId];

  return typeof localizedRootPath === "string"
    ? normalizePathnameInput(localizedRootPath)
    : undefined;
}

export async function getBrandsWithDuplicateRootPath(
  req: PayloadRequest,
  rootPath: string,
) {
  const publishedLocaleIds = await getPublishedLocaleIds(req);

  const result = await req.payload.find({
    collection: "brands",
    locale: "all",
    pagination: false,
    req: createIsolatedLocalRequest(req),
    select: {
      rootPath: true,
    },
  });

  return result.docs.filter((brand) =>
    getLocalizedRootPaths(brand.rootPath, publishedLocaleIds).some(
      (existingRootPath) => rootPathsAreEqual(existingRootPath, rootPath),
    ),
  );
}

export function rootPathsAreEqual(rootPathA: string, rootPathB: string) {
  return (
    normalizePathnameInput(rootPathA) === normalizePathnameInput(rootPathB)
  );
}

export async function getMostSpecificBrandForPathname({
  localeId,
  pathname,
  req,
}: {
  localeId: string | undefined;
  pathname: string;
  req: PayloadRequest;
}) {
  if (!localeId) {
    return undefined;
  }

  const result = await req.payload.find({
    collection: "brands",
    locale: "all",
    pagination: false,
    req: createIsolatedLocalRequest(req),
    select: {
      rootPath: true,
    },
  });

  return result.docs.reduce<{ id: unknown; rootPath: string } | undefined>(
    (mostSpecificBrand, brand) => {
      const rootPath = resolveRootPathForLocale(brand.rootPath, localeId);

      if (!rootPath || !pathnameBelongsToRootPath(pathname, rootPath)) {
        return mostSpecificBrand;
      }

      if (
        !mostSpecificBrand ||
        rootPath.length > mostSpecificBrand.rootPath.length
      ) {
        return {
          id: brand.id,
          rootPath,
        };
      }

      return mostSpecificBrand;
    },
    undefined,
  );
}

export function getLocalizedRootPaths(rootPath: unknown, localeIds: string[]) {
  if (!isPlainObject(rootPath)) {
    return [];
  }

  return localeIds.flatMap((localeId) => {
    const localizedRootPath = resolveRootPathForLocale(rootPath, localeId);

    return localizedRootPath ? [localizedRootPath] : [];
  });
}

export async function getPublishedLocaleIds(req: PayloadRequest) {
  const settings = await req.payload.findGlobal({
    slug: "settings",
    req,
    select: {
      publishedLocales: {
        publishedLocales: true,
      },
    },
  });

  const publishedLocales = (
    settings.publishedLocales as Record<string, unknown>
  ).publishedLocales as ({ id: string } | string)[];

  return publishedLocales
    .map((locale) => (typeof locale === "string" ? locale : locale.id))
    .filter((localeId): localeId is string => Boolean(localeId));
}

function getRootPathValuesForValidation(
  value: LocalizedRootPath | null | string | undefined,
) {
  if (typeof value === "string") {
    return normalizePathnameInput(value);
  }

  if (isLocalizedRootPath(value)) {
    return value;
  }

  return null;
}

function isLocalizedRootPath(value: unknown): value is LocalizedRootPath {
  return (
    isPlainObject(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every((localizedValue) => {
      return typeof localizedValue === "string";
    })
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function createIsolatedLocalRequest(
  req: PayloadRequest,
): PayloadRequest {
  const isolatedReq = Object.create(req) as PayloadRequest;

  isolatedReq.context = { ...(req.context ?? {}) };
  isolatedReq.query = { ...(req.query ?? {}) };
  isolatedReq.routeParams = req.routeParams ? { ...req.routeParams } : {};
  Object.defineProperty(isolatedReq, "payloadDataLoader", {
    configurable: true,
    enumerable: true,
    value: undefined,
    writable: true,
  });

  return isolatedReq;
}
