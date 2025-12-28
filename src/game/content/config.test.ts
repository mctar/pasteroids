import { describe, expect, it } from "vitest";
import { CONFIG } from "./config";

describe("CONFIG", () => {
  it("is defined", () => {
    expect(CONFIG).toBeDefined();
  });
});
