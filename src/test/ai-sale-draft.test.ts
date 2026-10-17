import { describe, expect, it } from "vitest";

import { prepareAiSaleDraft, type SaleDraftCatalogItem } from "@/lib/ai-sale-draft";

const products: SaleDraftCatalogItem[] = [
  { id: "rice-1", name: "Rice 1kg", price: 1800, quantity: 4 },
  { id: "soap-1", name: "Laundry soap", price: 900, quantity: 2 },
];

describe("reviewable AI sale drafts", () => {
  it("keeps only a product from the owner's catalog and uses current product identity", () => {
    expect(prepareAiSaleDraft(products, {
      productId: "rice-1",
      quantity: 2,
      paymentMethod: "Transfer",
    })).toEqual({
      productId: "rice-1",
      quantity: 2,
      paymentMethod: "Transfer",
      reviewMessage: "",
    });
  });

  it("requires the owner to choose an item when the model has no exact catalog match", () => {
    expect(prepareAiSaleDraft(products, {
      productId: "unlisted-item",
      quantity: 1,
      paymentMethod: null,
    })).toEqual({
      productId: "",
      quantity: 1,
      paymentMethod: null,
      reviewMessage: "Choose the item from your stock.",
    });
  });

  it("keeps a draft reviewable but flags a quantity above available stock", () => {
    expect(prepareAiSaleDraft(products, {
      productId: "soap-1",
      quantity: 3,
      paymentMethod: "Cash",
    }).reviewMessage).toBe("Only 2 available. Adjust the quantity before confirming.");
  });

  it("does not invent a quantity when the description is unclear", () => {
    expect(prepareAiSaleDraft(products, {
      productId: "rice-1",
      quantity: null,
      paymentMethod: null,
    }).reviewMessage).toBe("Set the quantity before confirming.");
  });
});