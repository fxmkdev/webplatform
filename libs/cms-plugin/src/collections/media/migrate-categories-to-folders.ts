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
  disableTransaction?: boolean;
  dryRun?: boolean;
  folderCollectionSlug?: string;
  folderFieldName?: string;
  folderType?: false | string;
  mediaCollectionSlug?: string;
  parentFolderID?: ID;
  payload: Payload;
  req?: PayloadRequest;
  retry?: false | MigrateMediaCategoriesToFoldersRetryOptions;
};

export type MigrateMediaCategoriesToFoldersRetryOptions = {
  attempts?: number;
  backoffFactor?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
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
  disableTransaction?: boolean;
  req?: PayloadRequest;
};

type CategoryMigrationResult = Pick<
  MigrateMediaCategoriesToFoldersResult,
  "foldersCreated" | "foldersReused" | "mediaSkipped" | "mediaUpdated"
>;

type MediaAssignmentResult = Pick<
  MigrateMediaCategoriesToFoldersResult,
  "mediaSkipped" | "mediaUpdated"
>;

type FolderResolutionResult = {
  folderID: ID;
} & Pick<
  MigrateMediaCategoriesToFoldersResult,
  "foldersCreated" | "foldersReused"
>;

type RetryOptions = Required<MigrateMediaCategoriesToFoldersRetryOptions>;

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  attempts: 4,
  backoffFactor: 2,
  initialDelayMs: 100,
  maxDelayMs: 1_000,
};

const RETRYABLE_ERROR_LABELS = new Set([
  "TransientTransactionError",
  "UnknownTransactionCommitResult",
]);

function finiteNumberOrDefault(
  value: number | undefined,
  defaultValue: number,
) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : defaultValue;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeRetryOptions(
  retry: false | MigrateMediaCategoriesToFoldersRetryOptions | undefined,
) {
  if (retry === false) {
    return false;
  }

  return {
    attempts: Math.max(
      1,
      Math.floor(
        finiteNumberOrDefault(retry?.attempts, DEFAULT_RETRY_OPTIONS.attempts),
      ),
    ),
    backoffFactor: Math.max(
      1,
      finiteNumberOrDefault(
        retry?.backoffFactor,
        DEFAULT_RETRY_OPTIONS.backoffFactor,
      ),
    ),
    initialDelayMs: Math.max(
      0,
      finiteNumberOrDefault(
        retry?.initialDelayMs,
        DEFAULT_RETRY_OPTIONS.initialDelayMs,
      ),
    ),
    maxDelayMs: Math.max(
      0,
      finiteNumberOrDefault(
        retry?.maxDelayMs,
        DEFAULT_RETRY_OPTIONS.maxDelayMs,
      ),
    ),
  };
}

function retryDelayMs(retryOptions: RetryOptions, attempt: number) {
  const delay =
    retryOptions.initialDelayMs *
    retryOptions.backoffFactor ** Math.max(0, attempt - 1);

  return Math.min(delay, retryOptions.maxDelayMs);
}

async function wait(ms: number) {
  if (ms === 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

function hasRetryableErrorLabel(error: Record<string, unknown>) {
  if (
    "hasErrorLabel" in error &&
    typeof error.hasErrorLabel === "function" &&
    [...RETRYABLE_ERROR_LABELS].some((label) =>
      (error.hasErrorLabel as (label: string) => boolean)(label),
    )
  ) {
    return true;
  }

  if (!Array.isArray(error.errorLabels)) {
    return false;
  }

  return error.errorLabels.some(
    (label) => typeof label === "string" && RETRYABLE_ERROR_LABELS.has(label),
  );
}

function isRetryableMongoMigrationError(
  error: unknown,
  seen = new Set<unknown>(),
): boolean {
  if (!isPlainObject(error) || seen.has(error)) {
    return false;
  }
  seen.add(error);

  if (hasRetryableErrorLabel(error)) {
    return true;
  }

  if (error.codeName === "WriteConflict" || error.code === 112) {
    return true;
  }

  if (
    typeof error.message === "string" &&
    /catalog changes.*retry|please retry.*transaction/i.test(error.message)
  ) {
    return true;
  }

  if (isRetryableMongoMigrationError(error.cause, seen)) {
    return true;
  }

  if (Array.isArray(error.errors)) {
    return error.errors.some((nestedError) =>
      isRetryableMongoMigrationError(nestedError, seen),
    );
  }

  return false;
}

async function retryTransientMongoError<T>({
  operation,
  retryOptions,
}: {
  operation: () => Promise<T>;
  retryOptions: false | RetryOptions;
}) {
  if (retryOptions === false) {
    return operation();
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= retryOptions.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (
        attempt === retryOptions.attempts ||
        !isRetryableMongoMigrationError(error)
      ) {
        throw error;
      }

      await wait(retryDelayMs(retryOptions, attempt));
    }
  }

  throw lastError;
}

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

async function assignMediaToFolder({
  dryRun,
  folderFieldName,
  folderID,
  media,
  mediaCollectionSlug,
  requestOptions,
  update,
}: {
  dryRun: boolean;
  folderFieldName: string;
  folderID: ID;
  media: MediaWithLegacyCategory[];
  mediaCollectionSlug: string;
  requestOptions: RequestOptions;
  update: PayloadUpdate;
}): Promise<MediaAssignmentResult> {
  const result: MediaAssignmentResult = {
    mediaSkipped: 0,
    mediaUpdated: 0,
  };

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

  return result;
}

async function folderForCategory({
  category,
  categoryNameCounts,
  create,
  dryRun,
  find,
  folderCollectionSlug,
  folderFieldName,
  folderType,
  parentFolderID,
  requestOptions,
}: {
  category: LegacyMediaCategory;
  categoryNameCounts: Map<string, number>;
  create: PayloadCreate;
  dryRun: boolean;
  find: PayloadFind;
  folderCollectionSlug: string;
  folderFieldName: string;
  folderType: false | string;
  parentFolderID?: ID;
  requestOptions: RequestOptions;
}): Promise<FolderResolutionResult> {
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
    throw new Error(`Failed to create folder for category "${category.name}"`);
  }

  return {
    folderID,
    foldersCreated: folder ? 0 : 1,
    foldersReused: folder ? 1 : 0,
  };
}

async function migrateCategoryToFolder({
  category,
  categoryNameCounts,
  create,
  dryRun,
  find,
  folderCollectionSlug,
  folderFieldName,
  folderType,
  mediaCollectionSlug,
  parentFolderID,
  requestOptions,
  update,
}: {
  category: LegacyMediaCategory;
  categoryNameCounts: Map<string, number>;
  create: PayloadCreate;
  dryRun: boolean;
  find: PayloadFind;
  folderCollectionSlug: string;
  folderFieldName: string;
  folderType: false | string;
  mediaCollectionSlug: string;
  parentFolderID?: ID;
  requestOptions: RequestOptions;
  update: PayloadUpdate;
}): Promise<CategoryMigrationResult> {
  const result: CategoryMigrationResult = {
    foldersCreated: 0,
    foldersReused: 0,
    mediaSkipped: 0,
    mediaUpdated: 0,
  };

  const folderResult = await folderForCategory({
    category,
    categoryNameCounts,
    create,
    dryRun,
    find,
    folderCollectionSlug,
    folderFieldName,
    folderType,
    parentFolderID,
    requestOptions,
  });
  result.foldersCreated += folderResult.foldersCreated;
  result.foldersReused += folderResult.foldersReused;

  const media = await findMediaForCategory({
    categoryID: category.id,
    find,
    mediaCollectionSlug,
    requestOptions,
  });

  const mediaAssignmentResult = await assignMediaToFolder({
    dryRun,
    folderFieldName,
    folderID: folderResult.folderID,
    media,
    mediaCollectionSlug,
    requestOptions,
    update,
  });
  result.mediaSkipped += mediaAssignmentResult.mediaSkipped;
  result.mediaUpdated += mediaAssignmentResult.mediaUpdated;

  return result;
}

export async function migrateMediaCategoriesToFolders({
  categoryCollectionSlug = "mediaCategory",
  disableTransaction = true,
  dryRun = false,
  folderCollectionSlug = "payload-folders",
  folderFieldName = "folder",
  folderType = "media",
  mediaCollectionSlug = "media",
  parentFolderID,
  payload,
  req,
  retry,
}: MigrateMediaCategoriesToFoldersOptions): Promise<MigrateMediaCategoriesToFoldersResult> {
  const result: MigrateMediaCategoriesToFoldersResult = {
    categoriesProcessed: 0,
    dryRun,
    foldersCreated: 0,
    foldersReused: 0,
    mediaSkipped: 0,
    mediaUpdated: 0,
  };

  const requestOptions = { disableTransaction, ...(req ? { req } : {}) };
  const retryOptions = normalizeRetryOptions(retry);
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
    const categoryResult = await retryTransientMongoError({
      operation: () =>
        migrateCategoryToFolder({
          category,
          categoryNameCounts,
          create,
          dryRun,
          find,
          folderCollectionSlug,
          folderFieldName,
          folderType,
          mediaCollectionSlug,
          parentFolderID,
          requestOptions,
          update,
        }),
      retryOptions,
    });

    result.categoriesProcessed += 1;
    result.foldersCreated += categoryResult.foldersCreated;
    result.foldersReused += categoryResult.foldersReused;
    result.mediaSkipped += categoryResult.mediaSkipped;
    result.mediaUpdated += categoryResult.mediaUpdated;
  }

  return result;
}
