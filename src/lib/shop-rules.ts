export function quantityAfterSale(available: number, requested: number): number | null {
  if (!Number.isInteger(available) || !Number.isInteger(requested) || requested < 1) return null;
  if (available < requested) return null;
  return available - requested;
}