import type {
  CollectionConfig,
  Locale,
  SanitizedCollectionConfig,
} from "payload";

import type { RowLabelProps } from "../../components/client/row-label.js";

import { canManageContent, isAdmin } from "../../common/access-control.js";
import { getLivePreviewUrl } from "../../common/live-preview.js";
import { imageField } from "../../fields/image.js";
import { linkField } from "../../fields/link.js";
import { showField } from "../../fields/show.js";
import { textField } from "../../fields/text.js";
import { contentGroup } from "../../groups.js";
import { syncBrandHomeLink } from "./home-link.js";
import { rootPathField } from "./root-path.js";
import { brandUsagesField } from "./usages.js";

type BrandsOptions = {
  livePreviewBaseUrl?: string;
};

export function Brands({
  livePreviewBaseUrl,
}: BrandsOptions): CollectionConfig {
  return {
    slug: "brands",
    access: {
      create: ({ req }) => isAdmin(req),
      delete: ({ req }) => isAdmin(req),
      update: canManageContent,
    },
    admin: {
      defaultColumns: ["name", "rootPath", "logo", "updatedAt"],
      group: contentGroup,
      listSearchableFields: ["id", "name"],
      livePreview: livePreviewBaseUrl
        ? {
            url: ({
              data,
              locale,
            }: {
              collectionConfig?: SanitizedCollectionConfig;
              data: Record<string, unknown>;
              locale: Locale;
            }) => {
              return getLivePreviewUrl(
                livePreviewBaseUrl,
                typeof data.rootPath === "string" ? data.rootPath : "/",
                `brands/${data.id as string}`,
                locale.code,
              );
            },
          }
        : undefined,
      useAsTitle: "name",
    },
    defaultPopulate: {
      id: true,
      name: true,
      baseTitle: true,
      homeLink: true,
      rootPath: true,
    },
    defaultSort: "name",
    fields: [
      {
        name: "id",
        type: "text",
        access: {
          update: () => false,
        },
        admin: {
          position: "sidebar",
        },
        label: {
          en: "ID",
          es: "ID",
        },
        required: true,
      },
      {
        name: "name",
        type: "text",
        admin: {
          position: "sidebar",
        },
        label: {
          en: "Name",
          es: "Nombre",
        },
        required: true,
      },

      {
        type: "tabs",
        tabs: [
          {
            fields: [
              linkField({
                allowedLinkTypes: ["internal"],
                fieldConfig: {
                  name: "homeLink",
                  access: {
                    create: () => false,
                    update: () => false,
                  },
                  admin: {
                    hidden: true,
                  },
                  label: {
                    en: "Home Link",
                    es: "Enlace de inicio",
                  },
                },
                required: false,
              }),
              rootPathField(),
              textField({
                name: "baseTitle",
                admin: {
                  description: {
                    en: "The base title is appended to the titles of the brand’s pages. If the page does not have a title, the base title will be used as the title. Include important keywords in the title for SEO.",
                    es: "El título base se añade a los títulos de las páginas de la marca. Si la página no tiene un título, se usará el título base como título. Incluye palabras clave importantes en el título para SEO.",
                  },
                },
                label: {
                  en: "Base Title",
                  es: "Título Base",
                },
                required: false,
              }),
              imageField({
                name: "logo",
                label: {
                  en: "Logo",
                  es: "Logo",
                },
              }),
            ],
            label: {
              en: "General",
              es: "General",
            },
          },
          {
            fields: [
              {
                name: "banner",
                type: "relationship",
                admin: {
                  description: {
                    en: "A banner is useful to announce promotions or important news and can have a call to action. It will be shown on all pages of the brand.",
                    es: "Un banner es útil para anunciar promociones o noticias importantes y puede tener un call to action. Se mostrará en todas las páginas de la marca.",
                  },
                },
                label: {
                  en: "Banner",
                  es: "Banner",
                },
                relationTo: "banners",
              },
              {
                name: "navLinks",
                type: "array",
                admin: {
                  components: {
                    RowLabel: {
                      clientProps: {
                        fallbackLabelKey: "cmsPlugin:brands:navLinkRowLabel",
                        textProp: "label",
                      } as RowLabelProps,
                      exportName: "RowLabel",
                      path: "@fxmk/cms-plugin/client",
                    },
                  },
                },
                fields: [
                  textField({
                    name: "label",
                    label: { en: "Label", es: "Etiqueta" },
                  }),
                  linkField(),
                ],
                label: {
                  en: "Navigation Links",
                  es: "Enlaces de navegación",
                },
                labels: {
                  plural: {
                    en: "Navigation Links",
                    es: "Enlaces de navegación",
                  },
                  singular: {
                    en: "Navigation Link",
                    es: "Enlace de navegación",
                  },
                },
              },
              {
                name: "bookCta",
                type: "group",
                fields: [
                  showField(),
                  textField({
                    name: "label",
                    admin: {
                      condition: (_, siblingData) => siblingData?.show,
                    },
                    label: { en: "Label", es: "Etiqueta" },
                  }),
                  linkField({
                    fieldConfig: {
                      admin: {
                        condition: (_, siblingData) => siblingData?.show,
                      },
                    },
                  }),
                ],
                label: {
                  en: "Book CTA",
                  es: "CTA de reserva",
                },
              },
            ],
            label: {
              en: "Header",
              es: "Encabezado",
            },
          },
          {
            name: "footer",
            fields: [
              {
                name: "linkGroups",
                type: "array",
                admin: {
                  components: {
                    RowLabel: {
                      clientProps: {
                        fallbackLabelKey: "cmsPlugin:rowLabel:linkGroup",
                        textProp: "title",
                      } as RowLabelProps,
                      exportName: "RowLabel",
                      path: "@fxmk/cms-plugin/client",
                    },
                  },
                },
                fields: [
                  textField({
                    name: "title",
                    label: { en: "Title", es: "Título" },
                  }),
                  {
                    name: "links",
                    type: "array",
                    admin: {
                      components: {
                        RowLabel: {
                          clientProps: {
                            fallbackLabelKey: "cmsPlugin:rowLabel:link",
                            textProp: "label",
                          } as RowLabelProps,
                          exportName: "RowLabel",
                          path: "@fxmk/cms-plugin/client",
                        },
                      },
                    },
                    fields: [
                      textField({
                        name: "label",
                        label: { en: "Label", es: "Etiqueta" },
                      }),
                      linkField(),
                    ],
                    label: {
                      en: "Links",
                      es: "Enlaces",
                    },
                    labels: {
                      plural: {
                        en: "Links",
                        es: "Enlaces",
                      },
                      singular: {
                        en: "Link",
                        es: "Enlace",
                      },
                    },
                  },
                ],
                label: {
                  en: "Link Groups",
                  es: "Grupos de enlaces",
                },
                labels: {
                  plural: {
                    en: "Link Groups",
                    es: "Grupos de enlaces",
                  },
                  singular: {
                    en: "Link Group",
                    es: "Grupo de enlaces",
                  },
                },
              },
            ],
            label: {
              en: "Footer",
              es: "Pie de página",
            },
          },
          {
            fields: [brandUsagesField()],
            label: {
              en: "Usages",
              es: "Usos",
            },
          },
        ],
      },
    ],
    hooks: {
      afterChange: [
        async ({ doc, operation, previousDoc, req }) => {
          if (operation !== "update") {
            return;
          }

          if (
            JSON.stringify(doc.rootPath) ===
            JSON.stringify(previousDoc?.rootPath)
          ) {
            return;
          }

          await syncBrandHomeLink({ brandId: doc.id as string, req });
        },
      ],
    },
    labels: {
      plural: {
        en: "Brands",
        es: "Marcas",
      },
      singular: {
        en: "Brand",
        es: "Marca",
      },
    },
  };
}
