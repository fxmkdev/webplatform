import { InitOptions } from "i18next";
import { adminResources } from "./i18n.admin-resources";

export default {
  // The default namespace of i18next is "translation", but you can customize it here
  defaultNS: "ui-labels",
  // Disabling suspense is recommended
  react: { useSuspense: false },
  partialBundledLanguages: true,
  resources: adminResources,
} as InitOptions;
