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

  it("populates upload thumbnail fields for folder media cards", () => {
    const media = Media({ organization: "folders" });

    expect(media.defaultPopulate).toMatchObject({
      sizes: {
        thumbnail: {
          filename: true,
          height: true,
          url: true,
          width: true,
        },
      },
      thumbnailURL: true,
      url: true,
    });
    expect(media.upload).toMatchObject({
      adminThumbnail: "thumbnail",
    });
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

  it("passes folder collection overrides through to Payload folders config", () => {
    const collectionOverride = vi.fn(({ collection }) => collection);
    const config = cmsPlugin({
      media: {
        folders: {
          collectionOverrides: [collectionOverride],
        },
        organization: "folders",
      },
      mediaS3Storage: mediaS3Storage(),
    })({});

    expect(config.folders).toMatchObject({
      browseByFolder: true,
      collectionOverrides: [collectionOverride],
    });
  });
});

describe("migrateMediaCategoriesToFolders", () => {
  const retryWithoutDelay = {
    initialDelayMs: 0,
  };

  function transientTransactionError() {
    return Object.assign(new Error("Unable to write due to catalog changes"), {
      code: 112,
      codeName: "WriteConflict",
      errorLabels: ["TransientTransactionError"],
    });
  }

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
      disableTransaction: true,
    });
    expect(payload.update).toHaveBeenCalledWith({
      collection: "media",
      data: { folder: "folder-1" },
      disableTransaction: true,
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

  it("reuses top-level folders with an explicit null parent", async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return {
            docs: [
              {
                folder: null,
                folderType: ["media"],
                id: "folder-1",
                name: "Rooms",
              },
            ],
          };
        }

        return { docs: [{ id: "media-1" }] };
      }),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    await migrateMediaCategoriesToFolders({ payload });

    expect(payload.create).not.toHaveBeenCalled();
    expect(payload.update).toHaveBeenCalledWith({
      collection: "media",
      data: { folder: "folder-1" },
      disableTransaction: true,
      id: "media-1",
    });
  });

  it("does not reuse nested folders when migrating to top-level folders", async () => {
    const payload = {
      create: vi.fn(async () => ({ id: "top-level-folder" })),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return {
            docs: [
              {
                folder: "parent-folder",
                folderType: ["media"],
                id: "nested-folder",
                name: "Rooms",
              },
            ],
          };
        }

        return { docs: [{ id: "media-1" }] };
      }),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    const result = await migrateMediaCategoriesToFolders({ payload });

    expect(result).toMatchObject({
      foldersCreated: 1,
      foldersReused: 0,
      mediaUpdated: 1,
    });
    expect(payload.create).toHaveBeenCalledWith({
      collection: "payload-folders",
      data: {
        folderType: ["media"],
        name: "Rooms",
      },
      disableTransaction: true,
    });
    expect(payload.update).toHaveBeenCalledWith({
      collection: "media",
      data: { folder: "top-level-folder" },
      disableTransaction: true,
      id: "media-1",
    });
  });

  it("can reuse folders under a caller-specified parent", async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return {
            docs: [
              {
                folder: "category-parent",
                folderType: ["media"],
                id: "nested-folder",
                name: "Rooms",
              },
            ],
          };
        }

        return { docs: [{ id: "media-1" }] };
      }),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    await migrateMediaCategoriesToFolders({
      parentFolderID: "category-parent",
      payload,
    });

    expect(payload.create).not.toHaveBeenCalled();
    expect(payload.update).toHaveBeenCalledWith({
      collection: "media",
      data: { folder: "nested-folder" },
      disableTransaction: true,
      id: "media-1",
    });
  });

  it("retries folder creation after transient Mongo transaction errors", async () => {
    const payload = {
      create: vi
        .fn()
        .mockRejectedValueOnce(transientTransactionError())
        .mockResolvedValueOnce({ id: "folder-1" }),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return { docs: [] };
        }

        return { docs: [{ id: "media-1" }] };
      }),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    const result = await migrateMediaCategoriesToFolders({
      payload,
      retry: retryWithoutDelay,
    });

    expect(result).toMatchObject({
      categoriesProcessed: 1,
      foldersCreated: 1,
      mediaUpdated: 1,
    });
    expect(payload.create).toHaveBeenCalledTimes(2);
    expect(payload.find).toHaveBeenCalledWith({
      collection: "payload-folders",
      depth: 0,
      disableTransaction: true,
      limit: 100,
      where: {
        name: {
          equals: "Rooms",
        },
        or: [
          {
            folder: {
              exists: false,
            },
          },
          {
            folder: {
              equals: null,
            },
          },
        ],
      },
    });
  });

  it("retries media updates without double-counting partial attempts", async () => {
    let folderFinds = 0;
    let mediaFinds = 0;
    const payload = {
      create: vi.fn(async () => ({ id: "folder-1" })),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          folderFinds += 1;

          return {
            docs:
              folderFinds === 1
                ? []
                : [
                    {
                      folderType: ["media"],
                      id: "folder-1",
                      name: "Rooms",
                    },
                  ],
          };
        }

        mediaFinds += 1;

        return {
          docs:
            mediaFinds === 1
              ? [{ id: "media-1" }, { id: "media-2" }]
              : [{ folder: "folder-1", id: "media-1" }, { id: "media-2" }],
        };
      }),
      update: vi
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(transientTransactionError())
        .mockResolvedValueOnce({}),
    } as unknown as Payload;

    const result = await migrateMediaCategoriesToFolders({
      payload,
      retry: retryWithoutDelay,
    });

    expect(result).toEqual({
      categoriesProcessed: 1,
      dryRun: false,
      foldersCreated: 0,
      foldersReused: 1,
      mediaSkipped: 1,
      mediaUpdated: 1,
    });
    expect(payload.create).toHaveBeenCalledOnce();
    expect(payload.update).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-retryable errors", async () => {
    const error = new Error("Validation failed");
    const payload = {
      create: vi.fn(async () => {
        throw error;
      }),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        return { docs: [] };
      }),
      update: vi.fn(),
    } as unknown as Payload;

    await expect(
      migrateMediaCategoriesToFolders({
        payload,
        retry: retryWithoutDelay,
      }),
    ).rejects.toThrow(error);
    expect(payload.create).toHaveBeenCalledOnce();
  });

  it("falls back to default retry options for non-finite values", async () => {
    const payload = {
      create: vi
        .fn()
        .mockRejectedValueOnce(transientTransactionError())
        .mockResolvedValueOnce({ id: "folder-1" }),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return { docs: [] };
        }

        return { docs: [{ id: "media-1" }] };
      }),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    const result = await migrateMediaCategoriesToFolders({
      payload,
      retry: {
        attempts: Number.NaN,
        backoffFactor: Number.NaN,
        initialDelayMs: 0,
        maxDelayMs: Number.NaN,
      },
    });

    expect(result).toMatchObject({
      foldersCreated: 1,
      mediaUpdated: 1,
    });
    expect(payload.create).toHaveBeenCalledTimes(2);
  });

  it("can disable retries", async () => {
    const payload = {
      create: vi.fn(async () => {
        throw transientTransactionError();
      }),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        return { docs: [] };
      }),
      update: vi.fn(),
    } as unknown as Payload;

    await expect(
      migrateMediaCategoriesToFolders({
        payload,
        retry: false,
      }),
    ).rejects.toThrow(/catalog changes/);
    expect(payload.create).toHaveBeenCalledOnce();
  });

  it("can preserve Payload migration transaction calls", async () => {
    const payload = {
      create: vi.fn(async () => ({ id: "folder-1" })),
      find: vi.fn(async (options) => {
        if (options.collection === "mediaCategory") {
          return { docs: [{ id: "category-1", name: "Rooms" }] };
        }

        if (options.collection === "payload-folders") {
          return { docs: [] };
        }

        return { docs: [{ id: "media-1" }] };
      }),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    await migrateMediaCategoriesToFolders({
      disableTransaction: false,
      payload,
    });

    expect(payload.create).toHaveBeenCalledWith({
      collection: "payload-folders",
      data: {
        folderType: ["media"],
        name: "Rooms",
      },
      disableTransaction: false,
    });
    expect(payload.update).toHaveBeenCalledWith({
      collection: "media",
      data: { folder: "folder-1" },
      disableTransaction: false,
      id: "media-1",
    });
  });
});
