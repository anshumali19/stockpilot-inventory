import { useMemo, useState, useRef, useEffect } from 'react';
import { ScanLine, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Card, Button, Field, Input, Select, Badge, DataTable, cx, inputCls, useToast } from '../kit/ui';
import { num, dateTime } from '../kit/format';
import { totalStock, MOVE_TYPES } from '../seed';
import { applyMovement, MOVE_TONE, byId } from '../logic';

const OPS = [
  { type: 'Stock in', icon: ArrowDownLeft, title: 'Receive', desc: 'Goods arriving into a warehouse', tone: 'text-emerald-600 bg-emerald-50' },
  { type: 'Stock out', icon: ArrowUpRight, title: 'Dispatch', desc: 'Ship to a customer or channel', tone: 'text-sky-600 bg-sky-50' },
  { type: 'Transfer', icon: ArrowLeftRight, title: 'Transfer', desc: 'Move between warehouses', tone: 'text-violet-600 bg-violet-50' },
  { type: 'Adjustment', icon: SlidersHorizontal, title: 'Adjust', desc: 'Damage, loss or cycle count', tone: 'text-amber-600 bg-amber-50' },
];

export function Operations() {
  const { db, setDb } = useDB();
  const toast = useToast();
  const [type, setType] = useState('Stock in');
  const [scan, setScan] = useState('');
  const [productId, setProductId] = useState(db.products[0]?.id);
  const [from, setFrom] = useState(db.warehouses[0]?.id);
  const [to, setTo] = useState(db.warehouses[1]?.id);
  const [qty, setQty] = useState(10);
  const [ref, setRef] = useState('');
  const [direction, setDirection] = useState('-');
  const [last, setLast] = useState(null);
  const scanRef = useRef();
  useEffect(() => scanRef.current?.focus(), []);

  const product = db.products.find((p) => p.id === productId);
  const wh = byId(db.warehouses);

  const lookup = (e) => {
    e.preventDefault();
    const q = scan.trim().toLowerCase();
    const p = db.products.find((x) => x.sku.toLowerCase() === q || x.barcode === q) || db.products.find((x) => x.name.toLowerCase().includes(q) || x.sku.toLowerCase().includes(q));
    if (!p) return toast('No product matches that code', 'error');
    setProductId(p.id);
    setScan('');
    toast(`Found ${p.name}`);
  };

  const submit = (e) => {
    e.preventDefault();
    const n = Number(qty);
    if (!n || n <= 0) return toast('Enter a quantity', 'error');
    if ((type === 'Stock out' || type === 'Transfer') && (product.stock[from] || 0) < n) return toast(`Only ${product.stock[from] || 0} available at ${wh[from].code}`, 'error');
    if (type === 'Transfer' && from === to) return toast('Choose two different warehouses', 'error');
    const mv = {
      productId, type,
      qty: type === 'Adjustment' ? (direction === '-' ? -n : n) : n,
      from: type === 'Stock in' ? null : from,
      to: type === 'Stock in' ? to : type === 'Transfer' ? to : null,
      ref: ref || (type === 'Stock in' ? 'Manual receipt' : type === 'Stock out' ? 'Manual dispatch' : type === 'Transfer' ? `TR-${400 + db.movements.length}` : 'Cycle count'),
    };
    setDb((d) => applyMovement(d, mv));
    setLast({ ...mv, name: product.name });
    toast(`${type} recorded for ${product.name}`);
    setRef('');
  };

  return (
    <>
      <PageHeader title="Stock operations" subtitle="Scan or search an item, then record a receipt, dispatch, transfer or adjustment." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {OPS.map((o) => (
          <button key={o.type} onClick={() => setType(o.type)} className={cx('flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition cursor-pointer', type === o.type ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300')}>
            <span className={cx('flex h-10 w-10 items-center justify-center rounded-lg', o.tone)}><o.icon size={18} /></span>
            <span><span className="block text-sm font-semibold">{o.title}</span><span className="block text-xs text-slate-500">{o.desc}</span></span>
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <form onSubmit={lookup} className="mb-6">
            <Field label="Scan barcode or type SKU">
              <div className="relative">
                <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" />
                <input ref={scanRef} value={scan} onChange={(e) => setScan(e.target.value)} placeholder={`e.g. ${db.products[0]?.sku} or ${db.products[0]?.barcode} — press Enter`} className={cx(inputCls, 'h-11 pl-9')} />
              </div>
            </Field>
          </form>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Product" className="sm:col-span-2">
              <Select value={productId} onChange={(e) => setProductId(e.target.value)} options={db.products.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))} />
            </Field>
            {type !== 'Stock in' && (
              <Field label={type === 'Transfer' ? 'From warehouse' : 'Warehouse'}>
                <Select value={from} onChange={(e) => setFrom(e.target.value)} options={db.warehouses.map((w) => ({ value: w.id, label: `${w.name} (${product?.stock[w.id] || 0})` }))} />
              </Field>
            )}
            {(type === 'Stock in' || type === 'Transfer') && (
              <Field label={type === 'Transfer' ? 'To warehouse' : 'Receiving warehouse'}>
                <Select value={to} onChange={(e) => setTo(e.target.value)} options={db.warehouses.map((w) => ({ value: w.id, label: `${w.name} (${product?.stock[w.id] || 0})` }))} />
              </Field>
            )}
            {type === 'Adjustment' && (
              <Field label="Direction">
                <Select value={direction} onChange={(e) => setDirection(e.target.value)} options={[{ value: '-', label: 'Decrease (damage / loss)' }, { value: '+', label: 'Increase (found stock)' }]} />
              </Field>
            )}
            <Field label="Quantity"><Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
            <Field label="Reference (PO, order #, note)"><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Optional" /></Field>
            <div className="flex justify-end sm:col-span-2"><Button type="submit" size="lg">Record {OPS.find((o) => o.type === type).title.toLowerCase()}</Button></div>
          </form>
        </Card>
        <div className="space-y-6">
          {product && (
            <Card className="p-5">
              <div className="text-xs uppercase tracking-wide text-slate-500">Selected item</div>
              <div className="mt-1 font-semibold">{product.name}</div>
              <div className="text-xs text-slate-500">{product.sku} · {product.barcode}</div>
              <div className="mt-4 space-y-2">
                {db.warehouses.map((w) => (
                  <div key={w.id} className="flex justify-between text-sm"><span className="text-slate-600">{w.name}</span><span className="font-medium">{num(product.stock[w.id] || 0)}</span></div>
                ))}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold"><span>Total</span><span>{num(totalStock(product))}</span></div>
              </div>
            </Card>
          )}
          {last && (
            <Card className="border-emerald-200 bg-emerald-50/50 p-5 animate-pop">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> Recorded</div>
              <p className="mt-1 text-sm text-slate-600">{last.type}: {Math.abs(last.qty)} × {last.name}{last.type === 'Transfer' ? ` (${wh[last.from].code} → ${wh[last.to].code})` : ''}</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

export function Movements() {
  const { db } = useDB();
  const prod = byId(db.products);
  const wh = byId(db.warehouses);
  const rows = useMemo(() => db.movements.map((m) => ({ ...m, product: prod[m.productId]?.name || '(deleted)', sku: prod[m.productId]?.sku, fromName: wh[m.from]?.code || '—', toName: wh[m.to]?.code || '—' })), [db.movements]); // eslint-disable-line
  return (
    <>
      <PageHeader title="Movement ledger" subtitle="A complete, auditable history of every stock change." />
      <DataTable
        rows={rows}
        pageSize={15}
        exportName="stock-movements"
        searchKeys={['product', 'sku', 'ref', 'user']}
        filter={{ key: 'type', options: MOVE_TYPES }}
        initialSort={{ key: 'date', dir: 'desc' }}
        columns={[
          { key: 'date', label: 'Date', render: (r) => dateTime(r.date), sortValue: (r) => new Date(r.date).getTime(), csv: (r) => new Date(r.date).toISOString() },
          { key: 'type', label: 'Type', render: (r) => <Badge tone={MOVE_TONE[r.type]} dot>{r.type}</Badge> },
          { key: 'product', label: 'Product', render: (r) => (<div><div className="font-medium text-slate-900">{r.product}</div><div className="text-xs text-slate-500">{r.sku}</div></div>) },
          { key: 'fromName', label: 'From' },
          { key: 'toName', label: 'To' },
          { key: 'qty', label: 'Qty', align: 'right', render: (r) => <span className={r.type === 'Stock in' || r.qty > 0 && r.type === 'Adjustment' ? 'font-semibold text-emerald-600' : r.type === 'Transfer' ? 'font-semibold text-violet-600' : 'font-semibold text-rose-600'}>{r.type === 'Stock in' || (r.type === 'Adjustment' && r.qty > 0) ? '+' : r.type === 'Transfer' ? '⇄ ' : '−'}{Math.abs(r.qty)}</span> },
          { key: 'ref', label: 'Reference', render: (r) => <span className="text-slate-500">{r.ref}</span> },
          { key: 'user', label: 'User' },
        ]}
      />
    </>
  );
}
