import { describe, expect, it } from "vitest";

import { rootPathsOverlap } from "../../../src/collections/brands/root-path.js";

describe("brand root path helpers", () => {
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
});
