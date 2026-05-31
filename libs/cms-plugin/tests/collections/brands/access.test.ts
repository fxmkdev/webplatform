import type { Access, PayloadRequest } from "payload";

import { describe, expect, it } from "vitest";

import { Brands } from "../../../src/collections/brands/config.js";

function brandCreateAccess() {
  return Brands({}).access?.create as Access;
}

function reqWithUser(user?: PayloadRequest["user"]): PayloadRequest {
  return { user } as PayloadRequest;
}

describe("brand access", () => {
  it("allows editors to create brands", () => {
    expect(
      brandCreateAccess()({
        req: reqWithUser({ collection: "users", role: "editor" }),
      }),
    ).toBe(true);
  });

  it("allows admins to create brands", () => {
    expect(
      brandCreateAccess()({
        req: reqWithUser({ collection: "users", role: "admin" }),
      }),
    ).toBe(true);
  });

  it("rejects anonymous brand creation", () => {
    expect(
      brandCreateAccess()({
        req: reqWithUser(),
      }),
    ).toBe(false);
  });

  it("rejects brand creation from non-user auth collections", () => {
    expect(
      brandCreateAccess()({
        req: reqWithUser({ collection: "api-keys", role: "frontend" }),
      }),
    ).toBe(false);
  });
});
