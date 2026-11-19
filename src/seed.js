import { rng, pick, int, fullName, emailOf, phone, daysAgo, uid } from './kit/format';

export const CATEGORIES = ['Beverages', 'Snacks', 'Personal Care', 'Household', 'Electronics', 'Apparel'];
export const MOVE_TYPES = ['Stock in', 'Stock out', 'Transfer', 'Adjustment'];

const ITEMS = [
  ['Cold Brew Coffee 250ml', 'Beverages', 'case', 14, 29],
  ['Sparkling Water Lime 500ml', 'Beverages', 'case', 8, 18],
  ['Green Tea Bags (100)', 'Beverages', 'box', 5, 12],
  ['Orange Juice 1L', 'Beverages', 'case', 16, 32],
  ['Sea Salt Kettle Chips', 'Snacks', 'case', 11, 24],
  ['Protein Bar Choc Peanut', 'Snacks', 'box', 18, 39],
  ['Trail Mix 400g', 'Snacks', 'case', 22, 45],
  ['Dark Chocolate 70%', 'Snacks', 'box', 15, 33],
  ['Herbal Shampoo 400ml', 'Personal Care', 'case', 24, 52],
  ['Bamboo Toothbrush (4)', 'Personal Care', 'pack', 3, 9],
  ['Aloe Hand Wash 250ml', 'Personal Care', 'case', 12, 27],
  ['Sunscreen SPF50', 'Personal Care', 'case', 38, 79],
  ['Eco Dish Soap 750ml', 'Household', 'case', 13, 28],
  ['Laundry Pods (40)', 'Household', 'box', 9, 21],
  ['Paper Towels (6 rolls)', 'Household', 'pack', 6, 14],
  ['LED Bulb 9W (4 pack)', 'Household', 'pack', 7, 17],
  ['USB-C Cable 2m', 'Electronics', 'pcs', 3, 12],
  ['Wireless Earbuds', 'Electronics', 'pcs', 21, 59],
  ['Power Bank 10000mAh', 'Electronics', 'pcs', 14, 35],
  ['Smart Plug Wi-Fi', 'Electronics', 'pcs', 8, 22],
  ['Cotton Crew T-Shirt', 'Apparel', 'pcs', 4, 18],
  ['Performance Socks (3)', 'Apparel', 'pack', 3, 13],
  ['Fleece Hoodie', 'Apparel', 'pcs', 15, 49],
  ['Canvas Tote Bag', 'Apparel', 'pcs', 2, 11],
];

export function seed() {
  const r = rng(11);
  const warehouses = [
    { id: 'w1', code: 'DAL', name: 'Dallas Distribution Center', city: 'Dallas, TX', capacity: 9000, manager: 'Maria Lopez', color: '#10b981' },
    { id: 'w2', code: 'CHI', name: 'Chicago Fulfillment Hub', city: 'Chicago, IL', capacity: 6000, manager: 'Kevin Brooks', color: '#0ea5e9' },
    { id: 'w3', code: 'NJ', name: 'Newark Cross-Dock', city: 'Newark, NJ', capacity: 4000, manager: 'Priya Nair', color: '#f59e0b' },
  ];

  const supplierNames = ['FreshSource Foods', 'PureCare Labs', 'BrightHome Goods', 'VoltEdge Electronics', 'ThreadLine Apparel', 'Summit Beverages'];
  const suppliers = supplierNames.map((name, i) => {
    const contact = fullName(r);
    return { id: `s${i}`, name, contact, email: emailOf(contact, name.toLowerCase().replace(/[^a-z]/g, '') + '.com'), phone: phone(r), leadDays: int(r, 3, 14), terms: pick(r, ['Net 30', 'Net 45', 'Net 15', 'Prepaid']), createdAt: daysAgo(500) };
  });
  const supFor = { Beverages: ['s0', 's5'], Snacks: ['s0'], 'Personal Care': ['s1'], Household: ['s2'], Electronics: ['s3'], Apparel: ['s4'] };

  const products = ITEMS.map(([name, category, unit, cost, price], i) => {
    const stock = {};
    warehouses.forEach((w) => (stock[w.id] = r() < 0.15 ? 0 : int(r, 5, 240)));
    if (i % 7 === 3) Object.keys(stock).forEach((k) => (stock[k] = int(r, 0, 6)));
    return {
      id: `p${i}`, sku: `SP-${category.slice(0, 3).toUpperCase()}-${String(100 + i)}`, barcode: String(8901000000000 + i * 7919),
      name, category, unit, cost, price, reorder: int(r, 30, 90), supplierId: pick(r, supFor[category]), stock, createdAt: daysAgo(300),
    };
  });

  const users = ['Maria Lopez', 'Kevin Brooks', 'Priya Nair', 'Sam Carter'];
  const movements = [];
  for (let i = 0; i < 260; i++) {
    const p = pick(r, products);
    const type = pick(r, ['Stock in', 'Stock out', 'Stock out', 'Stock out', 'Transfer', 'Adjustment']);
    const w = pick(r, warehouses);
    const w2 = pick(r, warehouses.filter((x) => x.id !== w.id));
    const qty = type === 'Stock in' ? int(r, 40, 200) : type === 'Adjustment' ? -int(r, 1, 6) : int(r, 4, 45);
    movements.push({
      id: uid(), date: daysAgo(Math.pow(r(), 1.3) * 90), productId: p.id, type, qty,
      from: type === 'Stock in' ? null : w.id, to: type === 'Stock in' ? w.id : type === 'Transfer' ? w2.id : null,
      ref: type === 'Stock in' ? `PO-${int(r, 5100, 5199)}` : type === 'Stock out' ? `SO-${int(r, 88000, 88999)}` : type === 'Transfer' ? `TR-${int(r, 300, 399)}` : 'Cycle count',
      user: pick(r, users), note: '',
    });
  }
  movements.sort((a, b) => new Date(b.date) - new Date(a.date));

  const purchaseOrders = Array.from({ length: 16 }, (_, i) => {
    const sup = pick(r, suppliers);
    const items = products.filter((p) => p.supplierId === sup.id);
    const lines = Array.from({ length: int(r, 1, 3) }, () => {
      const p = pick(r, items.length ? items : products);
      return { productId: p.id, qty: int(r, 50, 200), cost: p.cost };
    });
    const age = int(r, 0, 60);
    return { id: `po${i}`, number: `PO-${5200 + i}`, supplierId: sup.id, warehouseId: pick(r, warehouses).id, date: daysAgo(age), expected: daysAgo(age - sup.leadDays), lines, total: lines.reduce((s, l) => s + l.qty * l.cost, 0), status: age > 14 ? 'Received' : pick(r, ['Draft', 'Ordered', 'Ordered']), createdAt: daysAgo(age) };
  });

  return { warehouses, suppliers, products, movements, purchaseOrders };
}

export const totalStock = (p) => Object.values(p.stock || {}).reduce((a, b) => a + b, 0);
export const health = (p) => { const t = totalStock(p); return t === 0 ? 'Out of stock' : t <= p.reorder ? 'Low stock' : 'In stock'; };
