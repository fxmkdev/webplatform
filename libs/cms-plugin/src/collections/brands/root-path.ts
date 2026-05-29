import type { PayloadRequest } from "payload";

export async function getBrandsForRootPath(
  req: PayloadRequest,
  rootPath: string,
) {
  const settings = await req.payload.findGlobal({
    slug: "settings",
    req,
    select: {
      publishedLocales: {
        publishedLocales: true,
      },
    },
  });

  const result = await req.payload.find({
    collection: "brands",
    pagination: false,
    req,
    where: {
      or: (
        (settings.publishedLocales as Record<string, unknown>)
          .publishedLocales as { id: string }[]
      ).map((l) => ({
        [`rootPath.${l.id}`]: { equals: rootPath },
      })),
    },
  });

  return result.docs;
}
