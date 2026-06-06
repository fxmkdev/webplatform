import type {
  Block,
  CollectionConfig,
  Locale,
  Payload,
  SanitizedCollectionConfig,
} from "payload";

import { canManageContent } from "../../common/access-control.js";
import { getLivePreviewUrl } from "../../common/live-preview.js";
import { contentGroup } from "../../groups.js";
import { pageHooks } from "./hooks.js";
import { getLocalizedPathnameEndpoint } from "./localized-pathname.js";
import { pagePathnameFields } from "./pathname-field.js";
import { pageBrandField, pageTitleField } from "./sidebar-fields.js";
import { pageTabsField } from "./tabs.js";

type PagesOptions = {
  additionalContentBlocks?: Block[];
  additionalHeroBlocks?: Block[];
  livePreviewBaseUrl?: string;
};

export function Pages({
  additionalContentBlocks,
  additionalHeroBlocks,
  livePreviewBaseUrl,
}: PagesOptions): CollectionConfig {
  return {
    slug: "pages",
    access: {
      create: canManageContent,
      delete: canManageContent,
      update: canManageContent,
    },
    admin: {
      defaultColumns: ["pathname", "title", "brand", "updatedAt"],
      group: contentGroup,
      listSearchableFields: ["id", "pathname", "title", "brand.name"],
      livePreview: livePreviewBaseUrl
        ? {
            url: ({
              data,
              locale,
            }: {
              collectionConfig?: SanitizedCollectionConfig;
              data: Record<string, unknown>;
              locale: Locale;
              payload: Payload;
            }) =>
              getLivePreviewUrl(
                livePreviewBaseUrl,
                data.pathname as string,
                `pages/${data.id as string}`,
                locale.code,
              ),
          }
        : undefined,
      useAsTitle: "pathname",
    },
    defaultPopulate: {
      brand: true,
      pathname: true,
    },
    defaultSort: "pathname",
    endpoints: [getLocalizedPathnameEndpoint],
    fields: [
      pageTabsField({ additionalContentBlocks, additionalHeroBlocks }),
      pageBrandField(),
      ...pagePathnameFields(),
      pageTitleField(),
    ],
    hooks: pageHooks(),
    labels: {
      plural: {
        en: "Pages",
        es: "Páginas",
      },
      singular: {
        en: "Page",
        es: "Página",
      },
    },
  };
}
