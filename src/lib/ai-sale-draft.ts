export type SaleDraftPayment = "Cash" | "Transfer" | "POS";

export type SaleDraftCatalogItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type ExtractedSaleDraft = {
  productId: string | null;
  quantity: number | null;
  paymentMethod: SaleDraftPayment | null;
};

export function prepareAiSaleDraft(
  products: SaleDraftCatalogItem[],
  extracted: ExtractedSaleDraft,
) {
  const product = extracted.productId
    ? products.find((item) => item.id === extracted.productId) ?? null
    : null;
  const quantity = Number.isInteger(extracted.quantity) && extracted.quantity !== null && extracted.quantity > 0
    ? extracted.quantity
    : null;
  const messages: string[] = [];

  if (!product) messages.push("Choose the item from your stock.");
  if (quantity === null) messages.push("Set the quantity before confirming.");
  if (product && quantity !== null && quantity > product.quantity) {
    messages.push(`Only ${product.quantity} available. Adjust the quantity before confirming.`);
  }

  return {
    productId: product?.id ?? "",
    quantity,
    paymentMethod: extracted.paymentMethod,
    reviewMessage: messages.join(" "),
  };
}