import { uid } from './kit/format';

/** Applies a stock movement to the product's per-warehouse quantities and logs it. */
export function applyMovement(d, mv) {
  const record = { id: uid(), date: new Date().toISOString(), user: 'Jordan Ellis', note: '', ...mv };
  const products = d.products.map((p) => {
    if (p.id !== mv.productId) return p;
    const stock = { ...p.stock };
    if (mv.type === 'Stock in') stock[mv.to] = (stock[mv.to] || 0) + mv.qty;
    if (mv.type === 'Stock out') stock[mv.from] = Math.max(0, (stock[mv.from] || 0) - mv.qty);
    if (mv.type === 'Transfer') { stock[mv.from] = Math.max(0, (stock[mv.from] || 0) - mv.qty); stock[mv.to] = (stock[mv.to] || 0) + mv.qty; }
    if (mv.type === 'Adjustment') stock[mv.from] = Math.max(0, (stock[mv.from] || 0) + mv.qty);
    return { ...p, stock };
  });
  return { ...d, products, movements: [record, ...d.movements] };
}

export const MOVE_TONE = { 'Stock in': 'green', 'Stock out': 'blue', Transfer: 'purple', Adjustment: 'yellow' };
export const PO_TONE = { Draft: 'gray', Ordered: 'blue', Received: 'green', Cancelled: 'red' };
export const HEALTH_TONE = { 'In stock': 'green', 'Low stock': 'yellow', 'Out of stock': 'red' };
export const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
