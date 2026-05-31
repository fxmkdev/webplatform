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

function folderNameForCategory(
  category: LegacyMediaCategory,
  categoryNameCounts: Map<string, number>,
) {
  const categoryNameCount = categoryNameCounts.get(category.name) ?? 0;
  return categoryNameCount > 1
    ? `${category.name} (${category.id})`
    : category.name;
}

export async function migrateMediaCategoriesToFolders({
  categoryCollectionSlug = "mediaCategory",
  dryRun = false,
  folderCollectionSlug = "payload-folders",
  folderFieldName = "folder",
  folderType = "media",
  mediaCollectionSlug = "media",
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
  const find = payload.find.bind(payload) as unknown as (
    options: Record<string, unknown>,
  ) => Promise<FindResult<unknown>>;
  const create = payload.create.bind(payload) as unknown as (
    options: Record<string, unknown>,
  ) => Promise<unknown>;
  const update = payload.update.bind(payload) as unknown as (
    options: Record<string, unknown>,
  ) => Promise<unknown>;

  const categories = (
    await find({
      collection: categoryCollectionSlug,
      depth: 0,
      pagination: false,
      ...requestOptions,
    })
  ).docs as LegacyMediaCategory[];

  const categoryNameCounts = categories.reduce((counts, category) => {
    counts.set(category.name, (counts.get(category.name) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  for (const category of categories) {
    result.categoriesProcessed += 1;

    const folderName = folderNameForCategory(category, categoryNameCounts);
    const existingFolders = (
      await find({
        collection: folderCollectionSlug,
        depth: 0,
        limit: 100,
        where: {
          name: {
            equals: folderName,
          },
        },
        ...requestOptions,
      })
    ).docs as FolderDocument[];
    const folder = existingFolders.find(
      (existingFolder) =>
        !folderType ||
        !existingFolder.folderType ||
        existingFolder.folderType.length === 0 ||
        existingFolder.folderType.includes(folderType),
    );

    const folderID =
      folder?.id ??
      (dryRun
        ? `dry-run:${category.id}`
        : relationshipID(
            await create({
              collection: folderCollectionSlug,
              data: {
                name: folderName,
                ...(folderType ? { folderType: [folderType] } : {}),
              },
              ...requestOptions,
            }),
          ));

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

    const media = (
      await find({
        collection: mediaCollectionSlug,
        depth: 0,
        pagination: false,
        where: {
          category: {
            equals: category.id,
          },
        },
        ...requestOptions,
      })
    ).docs as MediaWithLegacyCategory[];

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
