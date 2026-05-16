import type { Block } from "payload";

import { imageField } from "../../fields/image.js";
import { overlayTitleField } from "../../fields/overlay-title.js";

export const HeroVideoBlock: Block = {
  slug: "HeroVideo",
  fields: [
    {
      name: "video",
      type: "upload",
      admin: {
        description: {
          en: "The video should be optimized for web pages before uploading it.",
          es: "El video debe estar optimizado para páginas web antes de subirlo.",
        },
      },
      filterOptions: {
        mimeType: { contains: "video/" },
      },
      label: {
        en: "Video",
        es: "Video",
      },
      relationTo: "media",
      required: true,
    },
    imageField({
      name: "previewImage",
      admin: {
        description: {
          en: "The preview image is shown while the video is still loading. It should be the first frame of the video to provide a seamless transition.",
          es: "La imagen de vista previa se muestra mientras el video aún se está cargando. Debe ser el primer fotograma del video para proporcionar una transición sin interrupciones.",
        },
        position: "sidebar",
      },
      label: {
        en: "Preview Image",
        es: "Imagen de vista previa",
      },
      required: false,
    }),
    overlayTitleField({ optional: true }),
  ],
  interfaceName: "HeroVideo",
  labels: {
    plural: {
      en: "Hero Videos",
      es: "Videos de héroe",
    },
    singular: {
      en: "Hero Video",
      es: "Video de héroe",
    },
  },
};
