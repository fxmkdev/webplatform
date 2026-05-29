import type { PayloadRequest } from "payload";

function getRelationshipId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }

  return undefined;
}

export function getPageBrandId(page: Record<string, unknown>) {
  return getRelationshipId(page.brand);
}

export async function syncBrandHomeLink({
  brandId,
  req,
}: {
  brandId: string;
  req: PayloadRequest;
}) {
  const brand = await req.payload.findByID({
    id: brandId,
    collection: "brands",
    req,
    select: {
      rootPath: true,
    },
  });

  if (typeof brand.rootPath !== "string") {
    return;
  }

  const pathnameWhere = req.locale
    ? { [`pathname.${req.locale}`]: { equals: brand.rootPath } }
    : { pathname: { equals: brand.rootPath } };

  const homePages = await req.payload.find({
    collection: "pages",
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: {
      and: [{ brand: { equals: brandId } }, pathnameWhere],
    },
  });

  const homePage = homePages.docs[0];

  await req.payload.update({
    id: brandId,
    collection: "brands",
    data: {
      homeLink: homePage
        ? {
            doc: homePage.id,
            linkType: "internal",
          }
        : {},
    },
    overrideAccess: true,
    req,
  });
}
