import type { Payload } from "payload";

import { describe, expect, it, vi } from "vitest";

import { migrateBrandThemeColors } from "../../../src/collections/brands/migrate-theme-colors.js";

describe("migrateBrandThemeColors", () => {
  it("backfills missing brand theme colors from brand ID mappings", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          { id: "puerta" },
          { id: "aqua" },
          { id: "azul" },
          { id: "unmapped" },
        ],
      })),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    const result = await migrateBrandThemeColors({
      defaultThemeColor: "puerta",
      payload,
      themeColorByBrandId: {
        aqua: "aqua",
        azul: "azul",
        puerta: "puerta",
      },
    });

    expect(result).toEqual({
      brandsAlreadyMigrated: 0,
      brandsProcessed: 4,
      brandsSkipped: 0,
      brandsUpdated: 4,
      brandsUsingDefaultThemeColor: 1,
      dryRun: false,
    });
    expect(payload.find).toHaveBeenCalledWith({
      collection: "brands",
      depth: 0,
      pagination: false,
      select: {
        themeColor: true,
      },
      showHiddenFields: true,
    });
    expect(payload.update).toHaveBeenCalledTimes(4);
    expect(payload.update).toHaveBeenCalledWith({
      collection: "brands",
      data: {
        themeColor: "aqua",
      },
      id: "aqua",
      overrideAccess: true,
    });
    expect(payload.update).toHaveBeenCalledWith({
      collection: "brands",
      data: {
        themeColor: "puerta",
      },
      id: "unmapped",
      overrideAccess: true,
    });
  });

  it("skips brands that already have theme colors", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [
          { id: "puerta", themeColor: "puerta" },
          { id: "aqua", themeColor: "aqua" },
        ],
      })),
      update: vi.fn(),
    } as unknown as Payload;

    const result = await migrateBrandThemeColors({ payload });

    expect(result).toMatchObject({
      brandsAlreadyMigrated: 2,
      brandsProcessed: 2,
      brandsSkipped: 2,
      brandsUpdated: 0,
    });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("supports dry runs without updating brands", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [{ id: "aqua" }],
      })),
      update: vi.fn(),
    } as unknown as Payload;

    const result = await migrateBrandThemeColors({
      dryRun: true,
      payload,
      themeColorByBrandId: { aqua: "aqua" },
    });

    expect(result).toMatchObject({
      brandsProcessed: 1,
      brandsSkipped: 0,
      brandsUpdated: 1,
      dryRun: true,
    });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it("can overwrite existing theme colors", async () => {
    const payload = {
      find: vi.fn(async () => ({
        docs: [{ id: "aqua", themeColor: "puerta" }],
      })),
      update: vi.fn(async () => ({})),
    } as unknown as Payload;

    const result = await migrateBrandThemeColors({
      overwriteExisting: true,
      payload,
      themeColorByBrandId: { aqua: "aqua" },
    });

    expect(result).toMatchObject({
      brandsAlreadyMigrated: 0,
      brandsProcessed: 1,
      brandsSkipped: 0,
      brandsUpdated: 1,
    });
    expect(payload.update).toHaveBeenCalledWith({
      collection: "brands",
      data: {
        themeColor: "aqua",
      },
      id: "aqua",
      overrideAccess: true,
    });
  });
});
