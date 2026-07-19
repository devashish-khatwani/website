import { describe, expect, it } from "vitest";
import { siteStatus } from "../../src/lib/site";

describe("site bootstrap contract", () => {
  it("keeps the placeholder scoped to W-02 guardrails", () => {
    expect(siteStatus.name).toBe("Glaux");
    expect(siteStatus.title).toContain("bootstrap");
    expect(siteStatus.guardrails).toContain("No analytics yet");
    expect(siteStatus.guardrails).toContain("No auth logic");
    expect(siteStatus.guardrails.join(" ")).not.toMatch(/powered by hermes/i);
  });
});
