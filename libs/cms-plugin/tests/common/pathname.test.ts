import { describe, expect, it } from "vitest";

import {
  normalizePathnameInput,
  pathnameBelongsToRootPath,
  validateRootPathFormat,
} from "../../src/common/pathname.js";

describe("pathname helpers", () => {
  it("normalizes pathname input whitespace", () => {
    expect(normalizePathnameInput("  /brand  ")).toBe("/brand");
  });

  it("validates root path format", () => {
    expect(validateRootPathFormat("brand")).toBe("mustStartWithSlash");
    expect(validateRootPathFormat("/brand/")).toBe("mustNotEndWithSlash");
    expect(validateRootPathFormat("/brand")).toBe(true);
  });

  it("matches a page pathname equal to the brand root path", () => {
    expect(pathnameBelongsToRootPath("/brand", "/brand")).toBe(true);
  });

  it("matches a page pathname below the brand root path", () => {
    expect(pathnameBelongsToRootPath("/brand/about", "/brand")).toBe(true);
  });

  it("rejects sibling path prefixes", () => {
    expect(pathnameBelongsToRootPath("/brandish", "/brand")).toBe(false);
  });
});
