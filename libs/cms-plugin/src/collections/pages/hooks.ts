import type { CollectionConfig } from "payload";

import { getPageBrandId, syncBrandHomeLink } from "../brands/home-link.js";

export function pageHooks(): CollectionConfig["hooks"] {
  return {
    afterChange: [
      async ({ doc, operation, previousDoc, req }) => {
        if (operation !== "create" && operation !== "update") {
          return;
        }

        const brandId = getPageBrandId(doc as Record<string, unknown>);
        const previousBrandId =
          previousDoc && getPageBrandId(previousDoc as Record<string, unknown>);

        if (brandId) {
          await syncBrandHomeLink({ brandId, req });
        }

        if (previousBrandId && previousBrandId !== brandId) {
          await syncBrandHomeLink({ brandId: previousBrandId, req });
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const brandId = getPageBrandId(doc as Record<string, unknown>);

        if (brandId) {
          await syncBrandHomeLink({ brandId, req });
        }
      },
    ],
  };
}
