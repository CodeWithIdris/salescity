import { describe, expect, it } from "vitest";

import { quantityAfterSale } from "@/lib/shop-rules";

describe("shop sale inventory rules", () => {
  it("reduces available stock by the quantity sold", () => {
    expect(quantityAfterSale(7, 2)).toBe(5);
  });

  it("does not allow a sale that would take stock below zero", () => {
    expect(quantityAfterSale(1, 2)).toBeNull();
  });
});