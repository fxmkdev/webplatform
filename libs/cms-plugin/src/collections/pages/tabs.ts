import type { Block, Field } from "payload";

import { contentField } from "../../fields/content.js";
import { descriptionField } from "../../fields/description.js";
import { heroField } from "../../fields/hero.js";
import { textareaField } from "../../fields/textarea.js";
import { pageUsagesField } from "./usages.js";

type PageTabsFieldOptions = {
  additionalContentBlocks?: Block[];
  additionalHeroBlocks?: Block[];
};

export function pageTabsField({
  additionalContentBlocks,
  additionalHeroBlocks,
}: PageTabsFieldOptions): Field {
  return {
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
        fields: [contentField({ additionalBlocks: additionalContentBlocks })],
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
  };
}
