import type { CollectionConfig, Field } from "payload";

import { describe, expect, it } from "vitest";

import { Brands } from "../../../src/collections/brands/config.js";

type BrandConfigWithPopulate = CollectionConfig & {
  defaultPopulate?: Record<string, unknown>;
};

type TabsFieldConfig = {
  tabs: { fields: Field[] }[];
  type: "tabs";
};

function getBrandThemeColorField(config = Brands({})) {
  const tabsField = config.fields.find(
    (field): field is TabsFieldConfig => field.type === "tabs",
  );

  return tabsField?.tabs
    .flatMap((tab) => tab.fields)
    .find((field) => "name" in field && field.name === "themeColor");
}

describe("brand config", () => {
  it("adds a required theme color select using configured options", () => {
    const themeColors = [
      { label: "Aqua", value: "aqua" },
      { label: "Azul", value: "azul" },
    ];

    const field = getBrandThemeColorField(Brands({ themeColors }));

    expect(field).toMatchObject({
      defaultValue: "aqua",
      name: "themeColor",
      options: themeColors,
      required: true,
      type: "select",
    });
  });

  it("falls back to a default theme color option", () => {
    const field = getBrandThemeColorField();

    expect(field).toMatchObject({
      defaultValue: "default",
      options: [{ label: "Default", value: "default" }],
    });
  });

  it("populates the theme color by default", () => {
    const config = Brands({}) as BrandConfigWithPopulate;

    expect(config.defaultPopulate?.themeColor).toBe(true);
  });
});
