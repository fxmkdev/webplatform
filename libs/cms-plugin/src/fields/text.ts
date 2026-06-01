import type { TextField } from "payload";

import { translated } from "../translations/translations.js";

type TextFieldConfig = Partial<TextField> & {
  enableTranslationTools?: boolean;
};

export function optionalTextField(config: TextFieldConfig = {}): TextField {
  return textField({ ...config, required: false });
}

export function textField(config: TextFieldConfig = {}): TextField {
  const { enableTranslationTools = true, ...fieldConfig } = config;

  return {
    name: "text",
    type: "text",
    label: translated("cmsPlugin:fields:text:label"),
    localized: true,
    required: true,
    ...fieldConfig,
    admin: {
      ...fieldConfig.admin,
      components: {
        ...(enableTranslationTools
          ? { Label: "@fxmk/cms-plugin/client#TranslationsFieldLabel" }
          : {}),
        ...fieldConfig.admin?.components,
      },
    },
  } as TextField;
}
