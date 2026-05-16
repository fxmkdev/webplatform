import { describe, expect, it } from "vitest";

import { cn } from "../../src/common/cn.js";

describe("cn", () => {
  it("joins string class names in order", () => {
    expect(cn("button", "button--primary")).toBe("button button--primary");
  });

  it("omits falsy and boolean-only values", () => {
    expect(cn("button", false, null, undefined, true, "")).toBe("button");
  });

  it("includes object keys with truthy values", () => {
    expect(
      cn("button", {
        "button--disabled": false,
        "button--loading": true,
        "button--primary": 1,
      }),
    ).toBe("button button--loading button--primary");
  });
});
