import type { Payload, PayloadRequest } from "payload";

type ID = number | string;

type LegacyMediaCategory = {
  id: ID;
  name: string;
};

type MediaWithLegacyCategory = {
  [key: string]: unknown;
  id: ID;
};

type FolderDocument = {
  folder?: FolderDocument | ID | null;
  folderType?: string[];
  id: ID;
  name: string;
};

export type MigrateMediaCategoriesToFoldersOptions = {
  categoryCollectionSlug?: string;
  dryRun?: boolean;
  folderCollectionSlug?: string;
  folderFieldName?: string;
  folderType?: false | string;
  mediaCollectionSlug?: string;
  parentFolderID?: ID;
  payload: Payload;
  req?: PayloadRequest;
};

export type MigrateMediaCategoriesToFoldersResult = {
  categoriesProcessed: number;
  dryRun: boolean;
  foldersCreated: number;
  foldersReused: number;
  mediaSkipped: number;
  mediaUpdated: number;
};

type FindResult<T> = {
  docs: T[];
};

type PayloadCreate = (options: Record<string, unknown>) => Promise<unknown>;

type PayloadFind = (
  options: Record<string, unknown>,
) => Promise<FindResult<unknown>>;

type PayloadUpdate = (options: Record<string, unknown>) => Promise<unknown>;

type RequestOptions = {
  req?: PayloadRequest;
};

function relationshipID(value: unknown): ID | undefined {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = value.id;
    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return undefined;
}

function folderMatchesParent(
  folder: FolderDocument,
  parentFolderID: ID | null,
) {
  return (relationshipID(folder.folder) ?? null) === parentFolderID;
}

function folderNameForCategory(
  category: LegacyMediaCategory,
  categoryNameCounts: Map<string, number>,
) {
  const categoryNameCount = categoryNameCounts.get(category.name) ?? 0;
  return categoryNameCount > 1
    ? `${category.name} (${category.id})`
    : category.name;
}

async function createFolder({
  create,
  folderCollectionSlug,
  folderFieldName,
  folderName,
  folderType,
  parentFolder,
  requestOptions,
}: {
  create: PayloadCreate;
  folderCollectionSlug: string;
  folderFieldName: string;
  folderName: string;
  folderType: false | string;
  parentFolder: ID | null;
  requestOptions: RequestOptions;
}) {
  return relationshipID(
    await create({
      collection: folderCollectionSlug,
      data: {
        name: folderName,
        ...(parentFolder === null ? {} : { [folderFieldName]: parentFolder }),
        ...(folderType ? { folderType: [folderType] } : {}),
      },
      ...requestOptions,
    }),
  );
}

async function findCategories({
  categoryCollectionSlug,
  find,
  requestOptions,
}: {
  categoryCollectionSlug: string;
  find: PayloadFind;
  requestOptions: RequestOptions;
}) {
  return (
    await find({
      collection: categoryCollectionSlug,
      depth: 0,
      pagination: false,
      ...requestOptions,
    })
  ).docs as LegacyMediaCategory[];
}

async function findMediaForCategory({
  categoryID,
  find,
  mediaCollectionSlug,
  requestOptions,
}: {
  categoryID: ID;
  find: PayloadFind;
  mediaCollectionSlug: string;
  requestOptions: RequestOptions;
}) {
  return (
    await find({
      collection: mediaCollectionSlug,
      depth: 0,
      pagination: false,
      where: {
        category: {
          equals: categoryID,
        },
      },
      ...requestOptions,
    })
  ).docs as MediaWithLegacyCategory[];
}

async function findReusableFolder({
  find,
  folderCollectionSlug,
  folderFieldName,
  folderName,
  folderType,
  parentFolder,
  requestOptions,
}: {
  find: PayloadFind;
  folderCollectionSlug: string;
  folderFieldName: string;
  folderName: string;
  folderType: false | string;
  parentFolder: ID | null;
  requestOptions: RequestOptions;
}) {
  const existingFolders = (
    await find({
      collection: folderCollectionSlug,
      depth: 0,
      limit: 100,
      where: {
        name: {
          equals: folderName,
        },
        ...(parentFolder === null
          ? {
              or: [
                {
                  [folderFieldName]: {
                    exists: false,
                  },
                },
                {
                  [folderFieldName]: {
                    equals: null,
                  },
                },
              ],
            }
          : {
              [folderFieldName]: {
                equals: parentFolder,
              },
            }),
      },
      ...requestOptions,
    })
  ).docs as FolderDocument[];

  return existingFolders.find(
    (existingFolder) =>
      folderMatchesParent(existingFolder, parentFolder) &&
      (!folderType ||
        !existingFolder.folderType ||
        existingFolder.folderType.length === 0 ||
        existingFolder.folderType.includes(folderType)),
  );
}

export async function migrateMediaCategoriesToFolders({
  categoryCollectionSlug = "mediaCategory",
  dryRun = false,
  folderCollectionSlug = "payload-folders",
  folderFieldName = "folder",
  folderType = "media",
  mediaCollectionSlug = "media",
  parentFolderID,
  payload,
  req,
}: MigrateMediaCategoriesToFoldersOptions): Promise<MigrateMediaCategoriesToFoldersResult> {
  const result: MigrateMediaCategoriesToFoldersResult = {
    categoriesProcessed: 0,
    dryRun,
    foldersCreated: 0,
    foldersReused: 0,
    mediaSkipped: 0,
    mediaUpdated: 0,
  };

  const requestOptions = req ? { req } : {};
  const find = payload.find.bind(payload) as unknown as PayloadFind;
  const create = payload.create.bind(payload) as unknown as PayloadCreate;
  const update = payload.update.bind(payload) as unknown as PayloadUpdate;

  const categories = await findCategories({
    categoryCollectionSlug,
    find,
    requestOptions,
  });

  const categoryNameCounts = categories.reduce((counts, category) => {
    counts.set(category.name, (counts.get(category.name) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  for (const category of categories) {
    result.categoriesProcessed += 1;

    const folderName = folderNameForCategory(category, categoryNameCounts);
    const parentFolder = parentFolderID ?? null;
    const folder = await findReusableFolder({
      find,
      folderCollectionSlug,
      folderFieldName,
      folderName,
      folderType,
      parentFolder,
      requestOptions,
    });

    const folderID =
      folder?.id ??
      (dryRun
        ? `dry-run:${category.id}`
        : await createFolder({
            create,
            folderCollectionSlug,
            folderFieldName,
            folderName,
            folderType,
            parentFolder,
            requestOptions,
          }));

    if (!folderID) {
      throw new Error(
        `Failed to create folder for category "${category.name}"`,
      );
    }

    if (folder) {
      result.foldersReused += 1;
    } else {
      result.foldersCreated += 1;
    }

    const media = await findMediaForCategory({
      categoryID: category.id,
      find,
      mediaCollectionSlug,
      requestOptions,
    });

    for (const mediaItem of media) {
      if (relationshipID(mediaItem[folderFieldName])) {
        result.mediaSkipped += 1;
        continue;
      }

      result.mediaUpdated += 1;

      if (!dryRun) {
        await update({
          id: mediaItem.id,
          collection: mediaCollectionSlug,
          data: {
            [folderFieldName]: folderID,
          },
          ...requestOptions,
        });
      }
    }
  }

  return result;
}
