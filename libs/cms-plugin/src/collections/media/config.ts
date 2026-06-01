import type { CollectionConfig, CollectionSlug, Field } from "payload";

import { canManageContent } from "../../common/access-control.js";
import { textareaField } from "../../fields/textarea.js";
import { contentGroup } from "../../groups.js";
import { translated } from "../../translations/translations.js";
import { generateAltTextEndpoint } from "./generate-alt-text-endpoint.js";
import { mediaUsagesField } from "./usages.js";

function categoryField({ hidden }: { hidden: boolean }): Field {
  const relationTo = "mediaCategory" as unknown as CollectionSlug;

  return {
    name: "category",
    type: "relationship",
    admin: {
      description: translated("cmsPlugin:media:category:description"),
      hidden,
      position: "sidebar",
    },
    label: translated("cmsPlugin:media:category:label"),
    relationTo,
  };
}

export function Media({
  generateAltTextOptions,
  organization = "categories",
  retainLegacyCategories = false,
}: {
  generateAltTextOptions?: { publicMediaBaseUrl: string };
  organization?: "categories" | "folders" | "none";
  retainLegacyCategories?: boolean;
} = {}): CollectionConfig {
  const includeCategoryField =
    organization === "categories" || retainLegacyCategories;
  const fields: Field[] = [
    ...(includeCategoryField
      ? [categoryField({ hidden: organization !== "categories" })]
      : []),

    {
      name: "comment",
      type: "textarea",
      admin: {
        description: translated("cmsPlugin:media:comment:description"),
        position: "sidebar",
      },
      label: translated("cmsPlugin:media:comment:label"),
    },

    {
      type: "tabs",
      tabs: [
        {
          fields: [
            textareaField({
              name: "alt",
              admin: {
                components: {
                  afterInput: ["@fxmk/cms-plugin/client#GenerateAltTextButton"],
                },
                description: translated("cmsPlugin:media:alt:description"),
              },
              label: translated("cmsPlugin:media:alt:label"),
              required: false,
            }),
          ],
          label: translated("cmsPlugin:media:alt:label"),
        },
        {
          fields: [mediaUsagesField()],
          label: translated("cmsPlugin:common:usages:label"),
        },
      ],
    },
  ];

  return {
    slug: "media",
    access: {
      create: canManageContent,
      delete: canManageContent,
      update: canManageContent,
    },
    admin: {
      defaultColumns:
        organization === "categories"
          ? ["filename", "category", "comment", "updatedAt"]
          : ["filename", "comment", "updatedAt"],
      group: contentGroup,
      listSearchableFields: ["id", "filename", "comment", "alt"],
    },
    defaultPopulate: {
      alt: true,
      filename: true,
      height: true,
      mimeType: true,
      width: true,
    },
    defaultSort: "filename",
    endpoints: generateAltTextOptions
      ? [generateAltTextEndpoint(generateAltTextOptions)]
      : [],
    fields,
    folders: organization === "folders" ? true : undefined,
    labels: {
      plural: translated("cmsPlugin:media:labels:plural"),
      singular: translated("cmsPlugin:media:labels:singular"),
    },
    upload: {
      crop: false,
      disableLocalStorage: true,
      displayPreview: true,
      focalPoint: false,
      imageSizes: [
        {
          name: "thumbnail",
          width: 400,
        },
      ],
      mimeTypes: ["image/*", "video/*"],
    },
  };
}
