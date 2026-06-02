import type { Block, CollectionConfig, Config, Field, Plugin } from "payload";

import { s3Storage } from "@payloadcms/storage-s3";

import { ApiKeys } from "./collections/api-keys/config.js";
import { Banners } from "./collections/banners/config.js";
import { Brands } from "./collections/brands/config.js";
import { LocaleConfigs } from "./collections/locale-configs/config.js";
import { Media } from "./collections/media/config.js";
import { MediaCategories } from "./collections/media-categories/config.js";
import { Pages } from "./collections/pages/config.js";
import { Redirects } from "./collections/redirects/config.js";
import { Users } from "./collections/users/config.js";
import { editor } from "./common/editor.js";
import { localization } from "./common/localization.js";
import { initializeOpenAI } from "./common/openai.js";
import { initializeTranslator } from "./common/translation.js";
import { autoTranslateEndpoint } from "./endpoints/auto-translate.js";
import { translationsEndpoint } from "./endpoints/translations.js";
import { Common } from "./globals/common/config.js";
import { Settings } from "./globals/settings/config.js";
import { translations } from "./translations/translations.js";

export * from "./collections/brands/migrate-home-links-to-root-paths.js";
export * from "./collections/media/migrate-categories-to-folders.js";
export * from "./common/index.js";
export * from "./fields/index.js";
export * from "./groups.js";

export type CmsPluginMediaOrganization = "categories" | "folders" | "none";

type CmsPluginFolderCollection = Omit<CollectionConfig, "trash">;

export type CmsPluginMediaFoldersOptions = {
  browseByFolder?: boolean;
  collectionOverrides?: (({
    collection,
  }: {
    collection: CmsPluginFolderCollection;
  }) => CmsPluginFolderCollection | Promise<CmsPluginFolderCollection>)[];
  collectionSpecific?: boolean;
  debug?: boolean;
  fieldName?: string;
  slug?: string;
};

export type CmsPluginMediaOptions = {
  folders?: CmsPluginMediaFoldersOptions;
  organization?: CmsPluginMediaOrganization;
  retainLegacyCategories?: boolean;
};

export type CmsPluginOptions = {
  additionalContentBlocks?: Block[];
  additionalHeroBlocks?: Block[];
  additionalUiLabelFields?: Field[];
  deeplApiKey?: string;
  e2eTestsApiKey?: string;
  livePreviewBaseUrl?: string;
  media?: CmsPluginMediaOptions;
  mediaS3Storage: {
    accessKeyId: string;
    bucket: string;
    region: string;
    secretAccessKey: string;
  };
  openaiApiKey?: string;
  publicMediaBaseUrl?: string;
  serverUrl?: string;
};

export const cmsPlugin =
  ({
    additionalContentBlocks,
    additionalHeroBlocks,
    additionalUiLabelFields,
    deeplApiKey,
    e2eTestsApiKey,
    livePreviewBaseUrl,
    media,
    mediaS3Storage,
    openaiApiKey,
    publicMediaBaseUrl,
    serverUrl,
  }: CmsPluginOptions): Plugin =>
  (config: Config) => {
    if (!config.collections) {
      config.collections = [];
    }

    if (deeplApiKey) {
      initializeTranslator({ apiKey: deeplApiKey });
    }

    if (openaiApiKey) {
      initializeOpenAI({ apiKey: openaiApiKey });
    }

    const mediaOrganization = media?.organization ?? "categories";
    const retainLegacyCategories =
      mediaOrganization === "folders" && media?.retainLegacyCategories === true;

    if (mediaOrganization === "folders") {
      const currentFolders =
        config.folders === false ? undefined : config.folders;

      config.folders = {
        ...currentFolders,
        ...media?.folders,
        browseByFolder:
          media?.folders?.browseByFolder ??
          currentFolders?.browseByFolder ??
          true,
      };
    }

    config.collections.push(
      Media({
        generateAltTextOptions: publicMediaBaseUrl
          ? { publicMediaBaseUrl }
          : undefined,
        organization: mediaOrganization,
        retainLegacyCategories,
      }),
    );
    if (mediaOrganization === "categories" || retainLegacyCategories) {
      config.collections.push(MediaCategories);
    }
    config.collections.push(Users);
    config.collections.push(ApiKeys);
    config.collections.push(LocaleConfigs);
    config.collections.push(Banners);
    config.collections.push(
      Pages({
        additionalContentBlocks,
        additionalHeroBlocks,
        livePreviewBaseUrl,
      }),
    );
    config.collections.push(Redirects);
    config.collections.push(Brands({ livePreviewBaseUrl }));

    if (!config.globals) {
      config.globals = [];
    }

    config.globals.push(Settings);
    config.globals.push(Common({ additionalUiLabelFields }));

    if (!config.admin) {
      config.admin = {};
    }

    config.admin.user = Users.slug;

    if (!config.admin.components) {
      config.admin.components = {};
    }

    config.admin.components.beforeNavLinks = [
      "@fxmk/cms-plugin/rsc#VersionInfo",
    ];

    if (!config.admin.livePreview) {
      config.admin.livePreview = {};
    }

    config.admin.livePreview.breakpoints = [
      {
        name: "mobile",
        height: 844,
        label: "Mobile",
        width: 390,
      },
      {
        name: "tablet-portrait",
        height: 1180,
        label: "Tablet (Portrait)",
        width: 820,
      },
      {
        name: "tablet-landscape",
        height: 820,
        label: "Tablet (Landscape)",
        width: 1180,
      },
      {
        name: "desktop",
        height: 900,
        label: "Desktop",
        width: 1440,
      },
    ];

    config.serverURL = serverUrl;
    config.cors = livePreviewBaseUrl ? [livePreviewBaseUrl] : undefined;
    config.csrf = livePreviewBaseUrl ? [livePreviewBaseUrl] : [];

    config.editor = editor();

    if (!config.endpoints) {
      config.endpoints = [];
    }

    config.endpoints.push(translationsEndpoint);
    config.endpoints.push(autoTranslateEndpoint);

    config.localization = localization;

    config.graphQL = { disable: false };

    const incomingOnInit = config.onInit;

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload);
      }

      // TODO extend this to allow for configurable default locale
      const localeConfigs = await payload.find({
        collection: "locale-configs",
        limit: 1,
        where: {
          id: {
            equals: "en",
          },
        },
      });

      if (localeConfigs.totalDocs === 0) {
        await payload.create({
          collection: "locale-configs",
          data: {
            displayLabel: "English",
            locale: "en",
          },
        });
      }

      const settings = await payload.findGlobal({ slug: "settings" });
      if (
        !settings?.publishedLocales?.publishedLocales ||
        settings.publishedLocales.publishedLocales.length === 0 ||
        !settings.publishedLocales.fallbackLocale
      ) {
        await payload.updateGlobal({
          slug: "settings",
          data: {
            publishedLocales: {
              fallbackLocale: "en",
              publishedLocales: ["en"],
            },
          },
        });
      }

      if (e2eTestsApiKey) {
        const e2eTestsApiKeysInDb = await payload.find({
          collection: "api-keys",
          where: { role: { equals: "e2e-tests" } },
        });

        if (e2eTestsApiKeysInDb.totalDocs === 0) {
          await payload.create({
            collection: "api-keys",
            data: {
              apiKey: e2eTestsApiKey,
              enableAPIKey: true,
              role: "e2e-tests",
            },
          });
        }
      }
    };

    if (!config.i18n?.translations) {
      config.i18n = { ...config.i18n, translations: {} };
    }

    const supportedLanguages = config.i18n.supportedLanguages
      ? Object.keys(config.i18n.supportedLanguages)
      : ["en"];

    for (const language of supportedLanguages) {
      const key = language as keyof typeof translations;
      config.i18n.translations![key] = {
        ...config.i18n.translations![key],
        ...translations[key],
      };
    }

    return s3Storage({
      bucket: mediaS3Storage.bucket,
      collections: {
        media: true,
      },
      config: {
        credentials: {
          accessKeyId: mediaS3Storage.accessKeyId,
          secretAccessKey: mediaS3Storage.secretAccessKey,
        },
        region: mediaS3Storage.region,
      },
    })(config);
  };
