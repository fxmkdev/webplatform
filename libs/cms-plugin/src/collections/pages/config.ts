import type { TFunction } from "@payloadcms/translations";
import type {
  Block,
  CollectionConfig,
  Locale,
  Payload,
  SanitizedCollectionConfig,
  TextField,
  ValidateOptions,
} from "payload";

import { text } from "payload/shared";

import type { TranslationsKey } from "../../translations/types.js";

import { canManageContent } from "../../common/access-control.js";
import { getLivePreviewUrl } from "../../common/live-preview.js";
import { pathnameBelongsToRootPath } from "../../common/pathname.js";
import { contentField } from "../../fields/content.js";
import { descriptionField } from "../../fields/description.js";
import { heroField } from "../../fields/hero.js";
import { textField } from "../../fields/text.js";
import { textareaField } from "../../fields/textarea.js";
import { contentGroup } from "../../groups.js";
import { getPageBrandId, syncBrandHomeLink } from "../brands/home-link.js";
import {
  getLocalizedPathnameEndpoint,
  getPagesForPathname,
} from "./localized-pathname.js";
import { pageUsagesField } from "./usages.js";

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
      {
        type: "tabs",
        tabs: [
          {
            fields: [heroField({ additionalBlocks: additionalHeroBlocks })],
            label: {
              en: "Hero",
              es: "Héroe",
            },
          },
          {
            fields: [
              contentField({ additionalBlocks: additionalContentBlocks }),
            ],
            label: {
              en: "Content",
              es: "Contenido",
            },
          },
          {
            name: "seo",
            fields: [
              descriptionField({
                en: "The SEO fields are used to improve the page's visibility in search engine results and social media. The data should be unique and relevant to the page.",
                es: "Los campos SEO se utilizan para mejorar la visibilidad de la página en los resultados de los motores de búsqueda y en las redes sociales. Los datos deben ser únicos y relevantes para la página.",
              }),
              textareaField({
                name: "description",
                admin: {
                  description: {
                    en: "The description is shown in search engine results. It should be between 100 and 150 characters.",
                    es: "La descripción se muestra en los resultados de los motores de búsqueda. Debe tener entre 100 y 150 caracteres.",
                  },
                },
                label: {
                  en: "Description",
                  es: "Descripción",
                },
                required: false,
              }),
              {
                name: "image",
                type: "upload",
                admin: {
                  description: {
                    en: "The image is shown in search engine results and when the page is shared on social media. It will be automatically sized to 1200x630 pixels.",
                    es: "La imagen se muestra en los resultados de los motores de búsqueda y cuando se comparte la página en las redes sociales. Se redimensionará automáticamente a 1200x630 píxeles.",
                  },
                },
                filterOptions: {
                  mimeType: { contains: "image/" },
                },
                label: {
                  en: "Image",
                  es: "Imagen",
                },
                relationTo: "media",
              },
            ],
            label: {
              en: "SEO",
              es: "SEO",
            },
          },
          {
            fields: [pageUsagesField()],
            label: {
              en: "Usages",
              es: "Usos",
            },
          },
        ],
      },

      {
        name: "brand",
        type: "relationship",
        access: {
          update: () => false,
        },
        admin: {
          description: {
            en: "Choose the brand to which the page belongs. The brand determines the theme of the page.",
            es: "Elige la marca a la que pertenece la página. La marca determina el tema de la página.",
          },
          position: "sidebar",
        },
        label: {
          en: "Brand",
          es: "Marca",
        },
        relationTo: "brands",
        required: true,
      },
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
          afterChange: [
            async ({ operation, previousDoc, req, siblingData }) => {
              if (operation !== "update") {
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
                console.log(
                  `Redirect already exists for ${previousDoc.pathname}`,
                );
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
            },
          ],
        },
        index: true,
        label: {
          en: "Pathname",
          es: "Ruta",
        },
        localized: true,
        required: true,
        unique: true,
        validate: async (
          value: null | string | undefined,
          options: ValidateOptions<
            Record<string, unknown>,
            Record<string, unknown>,
            TextField,
            string
          >,
        ) => {
          const defaultValidationResult = text(value, options);
          if (defaultValidationResult !== true) {
            return defaultValidationResult;
          }

          const { id, req, siblingData } = options;
          const t = req.t as unknown as TFunction<TranslationsKey>;

          if (!siblingData.brand) {
            return t("cmsPlugin:pages:pathname:pleaseSelectABrandFirst");
          }

          if (!value) {
            return t("cmsPlugin:pages:pathname:pleaseEnterAPathname");
          }

          const brand = await req.payload.findByID({
            id: siblingData.brand as string,
            collection: "brands",
            depth: 2,
            req,
            select: {
              homeLink: true,
              rootPath: true,
            },
          });

          const brandRootPath =
            typeof brand.rootPath === "string" ? brand.rootPath : undefined;
          const pageRelationship = brand.homeLink as
            | Record<string, unknown>
            | undefined;
          const legacyHomeLinkPathname = pageRelationship?.doc
            ? ((pageRelationship.doc as Record<string, unknown>)
                .pathname as string)
            : undefined;
          const rootPath = brandRootPath ?? legacyHomeLinkPathname;

          if (rootPath) {
            if (!pathnameBelongsToRootPath(value, rootPath)) {
              return t("cmsPlugin:pages:pathname:pathnameMustStartWithPrefix", {
                prefix: rootPath,
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
        },
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
      textField({
        name: "title",
        admin: {
          description: {
            en: "The title is shown in the title bar of the browser and in search engine results. Include important keywords for SEO. The brand’s base title is appended to the title.",
            es: "El título se muestra en la barra de título del navegador y en los resultados de los motores de búsqueda. Incluye palabras clave importantes para el SEO. El título base de la marca se añade al título.",
          },
          position: "sidebar",
        },
        label: { en: "Title", es: "Título" },
        required: false,
      }),
    ],
    hooks: {
      afterChange: [
        async ({ doc, operation, previousDoc, req }) => {
          if (operation !== "create" && operation !== "update") {
            return;
          }

          const brandId = getPageBrandId(doc as Record<string, unknown>);
          const previousBrandId =
            previousDoc &&
            getPageBrandId(previousDoc as Record<string, unknown>);

          if (brandId) {
            await syncBrandHomeLink({ brandId, req });
          }

          if (previousBrandId && previousBrandId !== brandId) {
            await syncBrandHomeLink({ brandId: previousBrandId, req });
          }
        },
      ],
    },
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
