import { describe, expect, it } from "vitest";

import {
  normalizeRootPathValue,
  resolveRootPathForLocale,
  rootPathField,
  rootPathsOverlap,
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

  it("detects equal root paths as overlapping", () => {
    expect(rootPathsOverlap("/brand", "/brand")).toBe(true);
  });

  it("detects parent and child root paths as overlapping", () => {
    expect(rootPathsOverlap("/brand", "/brand/sub")).toBe(true);
    expect(rootPathsOverlap("/brand/sub", "/brand")).toBe(true);
  });

  it("treats the site root as overlapping every child path", () => {
    expect(rootPathsOverlap("/", "/brand")).toBe(true);
  });

  it("does not treat sibling path prefixes as overlapping", () => {
    expect(rootPathsOverlap("/brand", "/brandish")).toBe(false);
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

  it("rejects malformed localized root path objects", async () => {
    await expect(
      validateRootPath({
        en: "/brand",
        es: null,
      }),
    ).resolves.toBe("validation:required");
  });
});
