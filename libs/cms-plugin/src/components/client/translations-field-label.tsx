"use client";

import type {
  FieldLabelClientProps,
  RichTextFieldClient,
  TextareaFieldClient,
  TextFieldClient,
} from "payload";

import {
  Drawer,
  FieldLabel,
  useConfig,
  useDocumentInfo,
  useFormModified,
  useLocale,
  useModal,
  useTranslation,
} from "@payloadcms/ui";
import {
  formatDrawerSlug,
  useDrawerDepth,
} from "@payloadcms/ui/elements/Drawer";

import type {
  TranslationsKey,
  TranslationsObject,
} from "../../translations/types.js";

import { getLabelText } from "../../common/labels.js";
import { DrawerContent } from "./translations-drawer-content.js";
import styles from "./translations-field-label.module.css";

export { CheckboxInput } from "./translation-checkbox-input.js";

export function TranslationsFieldLabel({
  field,
  path,
}: FieldLabelClientProps<
  RichTextFieldClient | TextareaFieldClient | TextFieldClient
>) {
  const { closeModal, isModalOpen, openModal } = useModal();

  const { id, collectionSlug, globalSlug } = useDocumentInfo();
  const locale = useLocale();
  const isModified = useFormModified();

  const { i18n, t } = useTranslation<TranslationsObject, TranslationsKey>();
  const depth = useDrawerDepth();
  const modalSlug = formatDrawerSlug({
    slug: `translations-${path}`,
    depth,
  });

  const { config } = useConfig();

  if (!config.localization) {
    throw new Error("Localization must be enabled");
  }
  if (typeof id === "number") {
    throw new Error("number ids are not supported");
  }

  const translationsDisabled = (collectionSlug && !id) || isModified;

  const label = field?.label ? getLabelText(field.label, i18n) : undefined;
  //  The Label is also rendered in the List view, here without path, see https://payloadcms.com/docs/fields/overview#label
  if (!path) {
    return <FieldLabel label={label} unstyled={true} />;
  }

  return (
    <div className={styles.container}>
      <FieldLabel
        label={label}
        localized={true}
        path={path}
        required={field?.required}
      />
      {path && (
        <>
          <div
            title={
              translationsDisabled
                ? t(
                    "cmsPlugin:translations:pleaseSaveYourChangesToEnableAutoTranslate",
                  )
                : undefined
            }
          >
            <button
              className={styles.translationsButton}
              disabled={translationsDisabled}
              onClick={() => openModal(modalSlug)}
              type="button"
            >
              {i18n.t("cmsPlugin:translations:translationsButtonLabel")}
            </button>
          </div>
          <Drawer
            slug={modalSlug}
            title={t("cmsPlugin:translations:translationsTitle")}
          >
            {isModalOpen(modalSlug) && (
              <DrawerContent
                collectionSlug={collectionSlug}
                currentLocale={locale}
                fieldPath={path}
                globalSlug={globalSlug}
                id={id}
                locales={config.localization.locales}
                onClose={() => closeModal(modalSlug)}
              />
            )}
          </Drawer>
        </>
      )}
    </div>
  );
}
