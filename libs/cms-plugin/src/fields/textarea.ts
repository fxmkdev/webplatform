import type { TextareaField } from "payload";

import { translated } from "../translations/translations.js";

export function optionalTextareaField(
  config: Partial<TextareaField> = {},
): TextareaField {
  return textareaField({ ...config, required: false });
}
export function textareaField(
  config: Partial<TextareaField> = {},
): TextareaField {
  return {
    name: "text",
    type: "textarea",
    label: translated("cmsPlugin:fields:textarea:label"),
    localized: true,
    required: true,
    ...config,
    admin: {
      ...config.admin,
      components: {
        Label: "@fxmk/cms-plugin/client#TranslationsFieldLabel",
        ...config.admin?.components,
      },
    },
  };
}
