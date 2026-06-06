import type { PayloadRequest } from "payload";

import { describe, expect, it } from "vitest";

import {
  getBrandsWithDuplicateRootPath,
  getMostSpecificBrandForPathname,
  normalizeRootPathValue,
  resolveRootPathForLocale,
  rootPathField,
  rootPathsAreEqual,
} from "../../../src/collections/brands/root-path.js";

function createValidateOptions({
  docs = [],
  id = "current-brand",
}: {
  docs?: { id: string; rootPath: unknown }[];
  id?: string;
} = {}) {
  return {
    id,
    required: true,
    req: {
      payload: {
        config: {},
        find: async () => ({ docs }),
        findGlobal: async () => ({
          publishedLocales: {
            publishedLocales: ["en", "es"],
          },
        }),
      },
      t: (key: string) => key,
    },
  } as never;
}

async function validateRootPath(
  value: unknown,
  options = createValidateOptions(),
) {
  const field = rootPathField();

  return field.validate!(value as never, options);
}

describe("brand root path helpers", () => {
  it("keeps localization without enabling translation tools", () => {
    const field = rootPathField();

    expect(field.localized).toBe(true);
    expect(field.admin?.components?.Label).toBeUndefined();
  });

  it("detects equal root paths as duplicates", () => {
    expect(rootPathsAreEqual("/brand", "/brand")).toBe(true);
  });

  it("allows parent and child root paths", () => {
    expect(rootPathsAreEqual("/brand", "/brand/sub")).toBe(false);
    expect(rootPathsAreEqual("/brand/sub", "/brand")).toBe(false);
  });

  it("allows the site root with child paths", () => {
    expect(rootPathsAreEqual("/", "/brand")).toBe(false);
  });

  it("does not treat sibling path prefixes as duplicates", () => {
    expect(rootPathsAreEqual("/brand", "/brandish")).toBe(false);
  });

  it("normalizes active-locale root path strings", () => {
    expect(normalizeRootPathValue(" /brand ")).toBe("/brand");
  });

  it("normalizes localized root path values", () => {
    expect(
      normalizeRootPathValue({
        en: " /brand ",
        es: " /marca ",
      }),
    ).toEqual({
      en: "/brand",
      es: "/marca",
    });
  });

  it("resolves root paths for the requested locale", () => {
    expect(
      resolveRootPathForLocale(
        {
          en: "/brand",
          es: "/marca",
        },
        "es",
      ),
    ).toBe("/marca");
  });

  it("supports active-locale string root path validation", async () => {
    await expect(validateRootPath("/brand")).resolves.toBe(true);
  });

  it("supports localized root path validation", async () => {
    await expect(
      validateRootPath({
        en: "/brand",
        es: "/marca",
      }),
    ).resolves.toBe(true);
  });

  it("rejects malformed localized root path values", async () => {
    await expect(
      validateRootPath({
        en: "/brand",
        es: "marca",
      }),
    ).resolves.toBe("cmsPlugin:brands:rootPath:mustStartWithSlash");
  });

  it("rejects exact duplicate root paths from another brand", async () => {
    await expect(
      validateRootPath(
        {
          en: "/brand",
          es: "/marca",
        },
        createValidateOptions({
          docs: [
            {
              id: "other-brand",
              rootPath: {
                en: "/brand",
              },
            },
          ],
        }),
      ),
    ).resolves.toBe("cmsPlugin:brands:rootPath:alreadyExists");
  });

  it("allows nested root paths from another brand", async () => {
    await expect(
      validateRootPath(
        {
          en: "/",
          es: "/",
        },
        createValidateOptions({
          docs: [
            {
              id: "aqua",
              rootPath: {
                en: "/aqua",
                es: "/aqua",
              },
            },
          ],
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      validateRootPath(
        {
          en: "/brand/sub",
          es: "/marca/sub",
        },
        createValidateOptions({
          docs: [
            {
              id: "parent-brand",
              rootPath: {
                en: "/brand",
                es: "/marca",
              },
            },
          ],
        }),
      ),
    ).resolves.toBe(true);
  });

  it("rejects malformed localized root path objects", async () => {
    await expect(
      validateRootPath({
        en: "/brand",
        es: null,
      }),
    ).resolves.toBe("validation:required");
  });

  it("preserves the request locale while checking all localized root paths", async () => {
    let localAPIReq: PayloadRequest | undefined;
    const req = {
      locale: "en",
      payload: {
        findGlobal: async () => ({
          publishedLocales: {
            publishedLocales: ["en", "es"],
          },
        }),
        find: async (options: { req: PayloadRequest }) => {
          localAPIReq = options.req;
          options.req.locale = "all";

          return {
            docs: [
              {
                id: "brand",
                rootPath: {
                  en: "/existing",
                  es: "/existente",
                },
              },
            ],
          };
        },
      },
    } as unknown as PayloadRequest;

    await getBrandsWithDuplicateRootPath(req, "/new");

    expect(localAPIReq).toBeDefined();
    if (!localAPIReq) {
      throw new Error("Expected the nested brand lookup to run");
    }

    expect(localAPIReq).not.toBe(req);
    expect(Object.getPrototypeOf(localAPIReq)).toBe(req);
    expect(localAPIReq.locale).toBe("all");
    expect(req.locale).toBe("en");
  });

  it("finds the most specific brand for a nested pathname", async () => {
    const req = {
      payload: {
        find: async () => ({
          docs: [
            {
              id: "root",
              rootPath: {
                en: "/",
              },
            },
            {
              id: "aqua",
              rootPath: {
                en: "/aqua",
              },
            },
            {
              id: "azul",
              rootPath: {
                en: "/azul",
              },
            },
          ],
        }),
      },
    } as unknown as PayloadRequest;

    await expect(
      getMostSpecificBrandForPathname({
        localeId: "en",
        pathname: "/aqua/page",
        req,
      }),
    ).resolves.toEqual({
      id: "aqua",
      rootPath: "/aqua",
    });

    await expect(
      getMostSpecificBrandForPathname({
        localeId: "en",
        pathname: "/azul",
        req,
      }),
    ).resolves.toEqual({
      id: "azul",
      rootPath: "/azul",
    });

    await expect(
      getMostSpecificBrandForPathname({
        localeId: "en",
        pathname: "/aquaish",
        req,
      }),
    ).resolves.toEqual({
      id: "root",
      rootPath: "/",
    });
  });
});
