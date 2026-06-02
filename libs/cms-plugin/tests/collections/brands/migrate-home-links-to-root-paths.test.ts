import type { Payload } from "payload";

import { describe, expect, it, vi } from "vitest";

import { migrateBrandHomeLinksToRootPaths } from "../../../src/collections/brands/migrate-home-links-to-root-paths.js";

describe("migrateBrandHomeLinksToRootPaths", () => {
  it("migrates legacy home links to localized root paths", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            homeLink: { doc: "page-1" },
            id: "brand-1",
          },
        ],
      })),
      findByID: vi.fn(async () => ({
        id: "page-1",
        pathname: {
          en: " /brand ",
          es: " /marca ",
        },
      })),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    const result = await migrateBrandHomeLinksToRootPaths({ payload });

    expect(result).toEqual({
      brandsAlreadyMigrated: 0,
      brandsProcessed: 1,
      brandsSkipped: 0,
      brandsUpdated: 1,
      dryRun: false,
      missingHomeLinks: 0,
      missingPages: 0,
    });
    expect(payload.find).toHaveBeenCalledWith({
      collection: "brands",
      depth: 0,
      locale: "all",
      pagination: false,
      select: {
        homeLink: true,
        rootPath: true,
      },
      showHiddenFields: true,
    });
    expect(payload.findByID).toHaveBeenCalledWith({
      collection: "pages",
      depth: 0,
      disableErrors: true,
      id: "page-1",
      locale: "all",
      select: {
        pathname: true,
      },
    });
    expect(payload.update).toHaveBeenCalledTimes(2);
    expect(payload.update).toHaveBeenNthCalledWith(1, {
      collection: "brands",
      data: {
        rootPath: "/brand",
      },
      id: "brand-1",
      locale: "en",
      overrideAccess: true,
    });
    expect(payload.update).toHaveBeenNthCalledWith(2, {
      collection: "brands",
      data: {
        rootPath: "/marca",
      },
      id: "brand-1",
      locale: "es",
      overrideAccess: true,
    });
  });

  it("skips brands that already have root paths", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            homeLink: { doc: "page-1" },
            id: "brand-1",
            rootPath: {
              en: "/brand",
            },
          },
        ],
      })),
      findByID: vi.fn(),
      update: vi.fn(),
    } as unknown as Payload;

    const result = await migrateBrandHomeLinksToRootPaths({ payload });

    expect(result).toMatchObject({
      brandsAlreadyMigrated: 1,
      brandsProcessed: 1,
      brandsSkipped: 1,
      brandsUpdated: 0,
    });
    expect(payload.findByID).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("supports dry runs without updating brands", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            homeLink: { doc: { id: "page-1" } },
            id: "brand-1",
          },
        ],
      })),
      findByID: vi.fn(async () => ({
        id: "page-1",
        pathname: "/brand",
      })),
      update: vi.fn(),
    } as unknown as Payload;

    const result = await migrateBrandHomeLinksToRootPaths({
      dryRun: true,
      payload,
    });

    expect(result).toMatchObject({
      brandsProcessed: 1,
      brandsSkipped: 0,
      brandsUpdated: 1,
      dryRun: true,
    });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("reports missing home links without throwing", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [{ id: "brand-1" }],
      })),
      findByID: vi.fn(),
      update: vi.fn(),
    } as unknown as Payload;

    const result = await migrateBrandHomeLinksToRootPaths({ payload });

    expect(result).toMatchObject({
      brandsProcessed: 1,
      brandsSkipped: 1,
      brandsUpdated: 0,
      missingHomeLinks: 1,
    });
    expect(payload.findByID).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("reports missing linked pages without throwing", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          {
            homeLink: { doc: "missing-page" },
            id: "brand-1",
          },
        ],
      })),
      findByID: vi.fn(async () => null),
      update: vi.fn(),
    } as unknown as Payload;

    const result = await migrateBrandHomeLinksToRootPaths({ payload });

    expect(result).toMatchObject({
      brandsProcessed: 1,
      brandsSkipped: 1,
      brandsUpdated: 0,
      missingPages: 1,
    });
    expect(payload.update).not.toHaveBeenCalled();
  });
});
