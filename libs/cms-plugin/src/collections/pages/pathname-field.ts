import type { TFunction } from "@payloadcms/translations";
import type { Field, FieldHook, TextField, ValidateOptions } from "payload";

import { text } from "payload/shared";

import type { TranslationsKey } from "../../translations/types.js";

import { pathnameBelongsToRootPath } from "../../common/pathname.js";
import { getPageBrandId } from "../brands/home-link.js";
import {
  getMostSpecificBrandForPathname,
  resolveRootPathForLocale,
} from "../brands/root-path.js";
import { getPagesForPathname } from "./localized-pathname.js";

type PathnameValidationOptions = ValidateOptions<
  Record<string, unknown>,
  Record<string, unknown>,
  TextField,
  string
>;

export function pagePathnameFields(): Field[] {
  return [
    {
      name: "pathname",
      type: "text",
      admin: {
        components: {
          Field: "@fxmk/cms-plugin/client#PathnameField",
        },
        description: {
          en: "The pathname is used to navigate to this page. It must be unique and start with the brand's root path.",
          es: "La ruta se utiliza para navegar a esta página. Debe ser única y comenzar con la ruta raíz de la marca.",
        },
        placeholder: "e.g. /experiences/lost-city",
        position: "sidebar",
      },
      hooks: {
        afterChange: [createRedirectForPreviousPathname],
      },
      index: true,
      label: {
        en: "Pathname",
        es: "Ruta",
      },
      localized: true,
      required: true,
      unique: true,
      validate: validatePagePathname,
    },
    {
      name: "pathname_locked",
      type: "checkbox",
      admin: {
        hidden: true,
      },
      defaultValue: true,
      virtual: true,
    },
    {
      name: "pathname_createRedirect",
      type: "checkbox",
      admin: {
        hidden: true,
      },
      defaultValue: true,
      virtual: true,
    },
  ];
}

const createRedirectForPreviousPathname: FieldHook = async ({
  operation,
  previousDoc,
  req,
  siblingData,
}) => {
  if (operation !== "update") {
    return;
  }
  if (!previousDoc) {
    return;
  }
  if (!siblingData["pathname_createRedirect"]) {
    return;
  }

  const redirects = await req.payload.find({
    collection: "redirects",
    pagination: false,
    where: {
      fromPathname: { equals: previousDoc.pathname },
    },
  });

  if (redirects.totalDocs > 0) {
    // Redirect already exists, so we don't need to create it again.
    console.log(`Redirect already exists for ${previousDoc.pathname}`);
    return;
  }

  console.log(`Creating redirect for ${previousDoc.pathname}`);
  await req.payload.create({
    collection: "redirects",
    data: {
      fromPathname: previousDoc.pathname,
      to: { page: previousDoc.id },
    },
  });
};

async function validatePagePathname(
  value: null | string | undefined,
  options: PathnameValidationOptions,
) {
  const defaultValidationResult = text(value, options);
  if (defaultValidationResult !== true) {
    return defaultValidationResult;
  }

  const { id, req, siblingData } = options;
  const t = req.t as unknown as TFunction<TranslationsKey>;

  const brandId = getPageBrandId({
    brand: siblingData.brand,
  });

  if (!brandId) {
    return t("cmsPlugin:pages:pathname:pleaseSelectABrandFirst");
  }

  if (!value) {
    return t("cmsPlugin:pages:pathname:pleaseEnterAPathname");
  }

  const brand = await req.payload.findByID({
    id: brandId,
    collection: "brands",
    depth: 2,
    req,
    select: {
      homeLink: true,
      rootPath: true,
    },
  });

  const localization = req.payload.config.localization;
  const locale =
    req.locale ?? (localization ? localization.defaultLocale : undefined);
  const brandRootPath = resolveRootPathForLocale(brand.rootPath, locale);
  const pageRelationship = brand.homeLink as
    | Record<string, unknown>
    | undefined;
  const legacyHomeLinkPathname = pageRelationship?.doc
    ? ((pageRelationship.doc as Record<string, unknown>).pathname as string)
    : undefined;
  const rootPath = brandRootPath ?? legacyHomeLinkPathname;

  if (rootPath) {
    if (!pathnameBelongsToRootPath(value, rootPath)) {
      return t("cmsPlugin:pages:pathname:pathnameMustStartWithPrefix", {
        prefix: rootPath,
      });
    }

    const mostSpecificBrand = await getMostSpecificBrandForPathname({
      localeId: locale,
      pathname: value,
      req,
    });

    if (mostSpecificBrand && String(mostSpecificBrand.id) !== String(brandId)) {
      return t("cmsPlugin:pages:pathname:pathnameBelongsToMoreSpecificBrand", {
        prefix: mostSpecificBrand.rootPath,
      });
    }
  }

  // Unique constraint only checks within the locale, but our pathnames must be unique across locales
  const pages = await getPagesForPathname(req, value);
  const alreadyExists = pages.some((p) => p.id !== id);
  if (alreadyExists) {
    return t("cmsPlugin:pages:pathname:alreadyExists");
  }

  return true;
}
