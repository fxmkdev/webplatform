import type { Field } from "payload";

import { textField } from "../../fields/text.js";

export function pageBrandField(): Field {
  return {
    name: "brand",
    type: "relationship",
    access: {
      update: () => false,
    },
    admin: {
      description: {
        en: "Choose the brand to which the page belongs. The page pathname must live within the brand's root path.",
        es: "Elige la marca a la que pertenece la página. La ruta de la página debe estar dentro de la ruta raíz de la marca.",
      },
      position: "sidebar",
    },
    label: {
      en: "Brand",
      es: "Marca",
    },
    relationTo: "brands",
    required: true,
  };
}

export function pageTitleField(): Field {
  return textField({
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
  });
}
