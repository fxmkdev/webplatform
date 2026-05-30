import { describe, expect, it } from "vitest";

import { getRootPathsByLocale } from "../../../src/collections/brands/home-link.js";

describe("brand home link helpers", () => {
  it("collects root paths for all published locales", () => {
    expect(
      getRootPathsByLocale(
        {
          en: "/brand",
          es: "/marca",
        },
        ["en", "es"],
      ),
    ).toEqual([
      { localeId: "en", rootPath: "/brand" },
      { localeId: "es", rootPath: "/marca" },
    ]);
  });

  it("ignores unpublished and missing localized root paths", () => {
    expect(
      getRootPathsByLocale(
        {
          en: "/brand",
          fr: "/marque",
        },
        ["en", "es"],
      ),
    ).toEqual([{ localeId: "en", rootPath: "/brand" }]);
  });
});
