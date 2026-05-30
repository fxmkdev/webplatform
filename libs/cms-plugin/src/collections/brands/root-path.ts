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
    hooks: {
      beforeValidate: [
        ({ value }) =>
          typeof value === "string" ? normalizePathnameInput(value) : value,
      ],
    },
    label: {
      en: "Root Path",
      es: "Ruta raíz",
    },
    validate: validateRootPath,
  });
}

async function validateRootPath(
  value: null | string | undefined,
  options: ValidateOptions<
    Record<string, unknown>,
    Record<string, unknown>,
    TextField,
    string
  >,
) {
  const defaultValidationResult = text(value, options);
  if (defaultValidationResult !== true) {
    return defaultValidationResult;
  }

  const t = options.req.t as unknown as TFunction<TranslationsKey>;
  const rootPath = normalizePathnameInput(value ?? "");
  const formatValidationResult = validateRootPathFormat(rootPath);

  if (formatValidationResult !== true) {
    return t(`cmsPlugin:brands:rootPath:${formatValidationResult}`);
  }

  const overlappingBrand = (
    await getBrandsWithOverlappingRootPath(options.req, rootPath)
  ).find((brand) => brand.id !== options.id);
  if (overlappingBrand) {
    return t("cmsPlugin:brands:rootPath:overlaps");
  }

  return true;
}

export async function getBrandsWithOverlappingRootPath(
  req: PayloadRequest,
  rootPath: string,
) {
  const publishedLocaleIds = await getPublishedLocaleIds(req);

  const result = await req.payload.find({
    collection: "brands",
    locale: "all",
    pagination: false,
    req,
    select: {
      rootPath: true,
    },
  });

  return result.docs.filter((brand) =>
    getLocalizedRootPaths(brand.rootPath, publishedLocaleIds).some(
      (existingRootPath) => rootPathsOverlap(existingRootPath, rootPath),
    ),
  );
}

export function rootPathsOverlap(rootPathA: string, rootPathB: string) {
  return (
    pathnameBelongsToRootPath(rootPathA, rootPathB) ||
    pathnameBelongsToRootPath(rootPathB, rootPathA)
  );
}

function getLocalizedRootPaths(rootPath: unknown, localeIds: string[]) {
  if (typeof rootPath === "string") {
    return [rootPath];
  }

  if (!rootPath || typeof rootPath !== "object" || Array.isArray(rootPath)) {
    return [];
  }

  return localeIds.flatMap((localeId) => {
    const localizedRootPath = (rootPath as Record<string, unknown>)[localeId];

    return typeof localizedRootPath === "string" ? [localizedRootPath] : [];
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
