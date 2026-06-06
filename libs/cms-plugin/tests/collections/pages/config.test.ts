import type { PayloadRequest, TextField } from "payload";

import { describe, expect, it } from "vitest";

import { Pages } from "../../../src/collections/pages/config.js";

function pathnameField() {
  return Pages({}).fields.find(
    (field): field is TextField => "name" in field && field.name === "pathname",
  )!;
}

describe("page pathname validation", () => {
  it("rejects pages assigned to a less specific brand root", async () => {
    const req = {
      payload: {
        config: {
          localization: {
            defaultLocale: "en",
          },
        },
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
          ],
        }),
        findByID: async () => ({
          rootPath: {
            en: "/",
          },
        }),
      },
      t: (key: string, params?: Record<string, string>) =>
        params?.prefix ? `${key}:${params.prefix}` : key,
    } as unknown as PayloadRequest;

    await expect(
      pathnameField().validate!("/aqua/about", {
        id: "page",
        req,
        required: true,
        siblingData: {
          brand: "root",
        },
      } as never),
    ).resolves.toBe(
      "cmsPlugin:pages:pathname:pathnameBelongsToMoreSpecificBrand:/aqua",
    );
  });
});
