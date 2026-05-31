import type { Config, Payload } from "payload";
import { describe, expect, it, vi } from "vitest";

import { Media } from "../src/collections/media/config.js";
import { migrateMediaCategoriesToFolders } from "../src/collections/media/migrate-categories-to-folders.js";
import { cmsPlugin } from "../src/index.js";

vi.mock("@payloadcms/storage-s3", () => ({
  s3Storage: vi.fn(() => (config: Config) => config),
}));

function mediaS3Storage() {
  return {
    accessKeyId: "access-key-id",
    bucket: "bucket",
    region: "region",
    secretAccessKey: "secret-access-key",
  };
}

function fieldNames(config = Media()) {
  return config.fields.flatMap((field) =>
    "name" in field && typeof field.name === "string" ? [field.name] : [],
  );
}

describe("media organization config", () => {
  it("keeps legacy categories by default", () => {
    const media = Media();

    expect(fieldNames(media)).toContain("category");
    expect(media.admin?.defaultColumns).toContain("category");
    expect(media.folders).toBeUndefined();
  });

  it("enables Payload folders without categories", () => {
    const media = Media({ organization: "folders" });

    expect(fieldNames(media)).not.toContain("category");
    expect(media.admin?.defaultColumns).not.toContain("category");
    expect(media.folders).toBe(true);
  });

  it("can retain a hidden category field during folder migration", () => {
    const media = Media({
      organization: "folders",
      retainLegacyCategories: true,
    });
    const categoryField = media.fields.find(
      (field) => "name" in field && field.name === "category",
    );

    expect(categoryField).toMatchObject({
      admin: { hidden: true },
      relationTo: "mediaCategory",
    });
    expect(media.admin?.defaultColumns).not.toContain("category");
    expect(media.folders).toBe(true);
  });

  it("registers media categories only when configured", () => {
    const config = cmsPlugin({ mediaS3Storage: mediaS3Storage() })({});

    expect(config.collections?.map((collection) => collection.slug)).toContain(
      "mediaCategory",
    );

    const foldersConfig = cmsPlugin({
      media: { organization: "folders" },
      mediaS3Storage: mediaS3Storage(),
    })({});

    expect(
      foldersConfig.collections?.map((collection) => collection.slug),
    ).not.toContain("mediaCategory");
    expect(foldersConfig.folders).toMatchObject({ browseByFolder: true });

    const transitionalConfig = cmsPlugin({
      media: { organization: "folders", retainLegacyCategories: true },
      mediaS3Storage: mediaS3Storage(),
    })({});

    expect(
      transitionalConfig.collections?.map((collection) => collection.slug),
    ).toContain("mediaCategory");
  });
});

describe("migrateMediaCategoriesToFolders", () => {
  it("creates folders and assigns media that do not already have a folder", async () => {
    const payload = {
      create: vi.fn(async () => ({ id: "folder-1" })),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return { docs: [] };
        }

        return {
          docs: [
            { id: "media-1" },
            { folder: "existing-folder", id: "media-2" },
          ],
        };
      }),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    const result = await migrateMediaCategoriesToFolders({ payload });

    expect(result).toEqual({
      categoriesProcessed: 1,
      dryRun: false,
      foldersCreated: 1,
      foldersReused: 0,
      mediaSkipped: 1,
      mediaUpdated: 1,
    });
    expect(payload.create).toHaveBeenCalledWith({
      collection: "payload-folders",
      data: {
        folderType: ["media"],
        name: "Rooms",
      },
    });
    expect(payload.update).toHaveBeenCalledWith({
      collection: "media",
      data: { folder: "folder-1" },
      id: "media-1",
    });
  });

  it("reuses existing folders and supports dry runs", async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return {
            docs: [{ folderType: ["media"], id: "folder-1", name: "Rooms" }],
          };
        }

        return { docs: [{ id: "media-1" }] };
      }),
      update: vi.fn(),
    } as unknown as Payload;

    const result = await migrateMediaCategoriesToFolders({
      dryRun: true,
      payload,
    });

    expect(result).toEqual({
      categoriesProcessed: 1,
      dryRun: true,
      foldersCreated: 0,
      foldersReused: 1,
      mediaSkipped: 0,
      mediaUpdated: 1,
    });
    expect(payload.create).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
  });
});
