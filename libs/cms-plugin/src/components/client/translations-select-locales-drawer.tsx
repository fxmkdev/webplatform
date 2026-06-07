"use client";

import type { CollectionSlug, GlobalSlug, Locale } from "payload";

import {
  Button,
  Drawer,
  toast,
  Translation,
  useModal,
  useTranslation,
} from "@payloadcms/ui";
import { useState } from "react";

import type {
  TranslationsKey,
  TranslationsObject,
} from "../../translations/types.js";

import { getLabelText } from "../../common/labels.js";
import { Label } from "./labels.js";
import { CheckboxInput } from "./translation-checkbox-input.js";
import styles from "./translations-select-locales-drawer.module.css";

type SelectLocalesDrawerProps = {
  collectionSlug?: CollectionSlug;
  currentLocale: Locale;
  fieldPath: string;
  globalSlug?: GlobalSlug;
  id?: string;
  isTranslating: boolean;
  locales: Locale[];
  modalSlug: string;
  setIsTranslating: (isTranslating: boolean) => void;
  updateData: () => Promise<void>;
};

export function SelectLocalesDrawer({
  id,
  collectionSlug,
  currentLocale,
  fieldPath,
  globalSlug,
  isTranslating,
  locales,
  modalSlug,
  setIsTranslating,
  updateData,
}: SelectLocalesDrawerProps) {
  const { closeModal } = useModal();
  const { i18n, t } = useTranslation<TranslationsObject, TranslationsKey>();
  const otherLocales = locales.filter(
    (locale) => locale.code !== currentLocale.code,
  );
  const [selectedLocaleCodes, setSelectedLocaleCodes] = useState(
    otherLocales.map((locale) => locale.code),
  );

  return (
    <Drawer slug={modalSlug} title={t("cmsPlugin:translations:selectLocales")}>
      <div className={styles.selectLocalesText}>
        <p>
          <Translation
            elements={{
              a: ({ children }) => (
                <a
                  href="https://www.deepl.com"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {children}
                </a>
              ),
            }}
            // @ts-expect-error types don't match
            i18nKey="cmsPlugin:translations:selectLocalesDescription"
            t={t}
            variables={{
              sourceLocale: getLabelText(currentLocale.label, i18n),
            }}
          />
        </p>
      </div>
      <div className={styles.selectLocalesList}>
        {otherLocales.map((locale) => (
          <div key={locale.code}>
            <CheckboxInput
              checked={selectedLocaleCodes.includes(locale.code)}
              label={<Label>{locale.label}</Label>}
              name={`locale-${locale.code}`}
              setChecked={(checked) =>
                setSelectedLocaleCodes((slc) =>
                  checked
                    ? [...slc, locale.code]
                    : slc.filter((lc) => lc !== locale.code),
                )
              }
            />
          </div>
        ))}
      </div>

      <p className={styles.selectLocalesNote}>
        <Translation
          elements={{ s: ({ children }) => <strong>{children}</strong> }}
          // @ts-expect-error types don't match
          i18nKey="cmsPlugin:translations:selectLocalesNote"
          t={t}
        />
      </p>
      <div className={styles.selectLocalesFooter}>
        <Button
          disabled={isTranslating || selectedLocaleCodes.length === 0}
          onClick={async () => {
            setIsTranslating(true);
            try {
              const searchParams = new URLSearchParams();
              if (collectionSlug) {
                searchParams.set("collection", collectionSlug);
              }
              if (id) {
                searchParams.set("id", id);
              }
              if (globalSlug) {
                searchParams.set("global", globalSlug);
              }
              searchParams.set("fieldPath", fieldPath);
              searchParams.set("locale", currentLocale.code);
              const response = await fetch(
                `/api/auto-translate?${searchParams.toString()}`,
                {
                  body: JSON.stringify({
                    targetLocaleCodes: selectedLocaleCodes,
                  }),
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  method: "POST",
                },
              );
              if (response.ok) {
                await updateData();
                closeModal(modalSlug);
                toast.success(
                  t("cmsPlugin:translations:autoTranslatedSuccessfully"),
                  {
                    duration: 3000,
                  },
                );
              } else {
                toast.error(t("cmsPlugin:translations:failedToAutoTranslate"), {
                  duration: 3000,
                });
              }
            } finally {
              setIsTranslating(false);
            }
          }}
          size="large"
          type="submit"
        >
          {isTranslating
            ? t("cmsPlugin:translations:translating")
            : t("cmsPlugin:translations:translateToSelectedLocales")}
        </Button>
      </div>
    </Drawer>
  );
}
