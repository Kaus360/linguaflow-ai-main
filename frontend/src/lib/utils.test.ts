import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges conditional class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2", false && "hidden", "px-4", ["text-sm", "font-medium"])).toBe(
      "px-4 text-sm font-medium"
    );
  });
});
