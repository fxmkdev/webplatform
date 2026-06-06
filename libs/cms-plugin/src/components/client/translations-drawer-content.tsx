"use client";

import type { CollectionSlug, GlobalSlug, Locale } from "payload";

import { Button, useModal, useTranslation } from "@payloadcms/ui";
import {
  formatDrawerSlug,
  useDrawerDepth,
} from "@payloadcms/ui/elements/Drawer";
import { useCallback, useEffect, useState } from "react";

import type {
  TranslationsKey,
  TranslationsObject,
} from "../../translations/types.js";
import type { AllLocalesText } from "./translations-field-label-types.js";

import styles from "./translations-field-label.module.css";
import { SelectLocalesDrawer } from "./translations-select-locales-drawer.js";
import { TranslationsTable } from "./translations-table.js";

type DrawerContentProps = {
  collectionSlug?: CollectionSlug;
  currentLocale: Locale;
  fieldPath: string;
  globalSlug?: GlobalSlug;
  id?: string;
  locales: Locale[];
  onClose: () => void;
};

export function DrawerContent({
  id,
  collectionSlug,
  currentLocale,
  fieldPath,
  globalSlug,
  locales,
  onClose,
}: DrawerContentProps) {
  const [data, setData] = useState<AllLocalesText | null | undefined>();
  const [isTranslating, setIsTranslating] = useState(false);

  const updateData = useCallback(
    async function updateData() {
      setData(undefined);
      const searchParams = new URLSearchParams();
      if (collectionSlug) {
        searchParams.set("collection", collectionSlug);
      }
      if (globalSlug) {
        searchParams.set("global", globalSlug);
      }
      if (id) {
        searchParams.set("id", id);
      }
      searchParams.set("fieldPath", fieldPath);
      try {
        const result = await fetch(
          `/api/translations?${searchParams.toString()}`,
          {
            credentials: "include",
          },
        );

        if (result.ok) {
          setData(await result.json());
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      }
    },
    [id, collectionSlug, fieldPath, globalSlug],
  );

  const { openModal } = useModal();
  const drawerDepth = useDrawerDepth();
  const { t } = useTranslation<TranslationsObject, TranslationsKey>();

  useEffect(() => {
    void (async function () {
      await updateData();
    })();
  }, [updateData]);

  if (data === undefined) {
    return (
      <div className={styles.loadingIndicator}>
        {t("cmsPlugin:common:loading")}
      </div>
    );
  }

  if (data === null) {
    return (
      <div className={styles.loadingIndicator}>
        <div className={styles.errorContent}>
          <p>{t("cmsPlugin:translations:failedToLoadTranslations")}</p>
          <Button onClick={() => void updateData()} size="medium">
            {t("cmsPlugin:translations:retryLoadingTranslations")}
          </Button>
        </div>
      </div>
    );
  }

  const otherLocales = locales.filter(
    (locale) => locale.code !== currentLocale.code,
  );
  const selectLocalesModalSlug = formatDrawerSlug({
    slug: `auto-translate-confirmation`,
    depth: drawerDepth,
  });

  return (
    <>
      <SelectLocalesDrawer
        collectionSlug={collectionSlug}
        currentLocale={currentLocale}
        fieldPath={fieldPath}
        globalSlug={globalSlug}
        id={id}
        isTranslating={isTranslating}
        locales={locales}
        modalSlug={selectLocalesModalSlug}
        setIsTranslating={setIsTranslating}
        updateData={updateData}
      />
      <TranslationsTable
        currentLocale={currentLocale}
        data={data}
        isTranslating={isTranslating}
        onAutoTranslateClick={() => openModal(selectLocalesModalSlug)}
        onClose={onClose}
        otherLocales={otherLocales}
      />
    </>
  );
}
