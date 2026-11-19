import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Barcode, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useDB } from '../kit/db';
import { PageHeader, Button, DataTable, FormModal, Drawer, Badge, Card, useToast } from '../kit/ui';
import { money, money2, num, dateTime } from '../kit/format';
import { CATEGORIES, totalStock, health } from '../seed';
import { HEALTH_TONE, MOVE_TONE, byId } from '../logic';

export default function Products() {
  const { db, add, update, remove } = useDB();
  const toast = useToast();
  const [params] = useSearchParams();
  const [edit, setEdit] = useState(null);
  const [viewId, setViewId] = useState(null);
  const sup = byId(db.suppliers);
  const wh = byId(db.warehouses);
  const view = db.products.find((p) => p.id === viewId);

  const FIELDS = [
    { name: 'name', label: 'Product name', required: true, span: 2 },
    { name: 'sku', label: 'SKU', required: true },
    { name: 'barcode', label: 'Barcode (EAN-13)' },
    { name: 'category', label: 'Category', type: 'select', options: CATEGORIES },
    { name: 'unit', label: 'Unit of measure', type: 'select', options: ['pcs', 'case', 'box', 'pack'] },
    { name: 'cost', label: 'Unit cost ($)', type: 'number', required: true },
    { name: 'price', label: 'Selling price ($)', type: 'number', required: true },
    { name: 'reorder', label: 'Reorder point (units)', type: 'number' },
    { name: 'supplierId', label: 'Preferred supplier', type: 'select', options: db.suppliers.map((s) => ({ value: s.id, label: s.name })) },
  ];

  const rows = db.products.map((p) => ({ ...p, total: totalStock(p), health: health(p), value: totalStock(p) * p.cost, supplier: sup[p.supplierId]?.name }));

  const history = view ? db.movements.filter((m) => m.productId === view.id) : [];
  const trend = (() => {
    if (!view) return [];
    let level = totalStock(view);
    const pts = [];
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 864e5).toDateString();
      pts.unshift({ label: new Date(Date.now() - i * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), level });
      history.filter((m) => new Date(m.date).toDateString() === day).forEach((m) => {
        if (m.type === 'Stock in') level -= m.qty;
        else if (m.type === 'Stock out') level += m.qty;
        else if (m.type === 'Adjustment') level -= m.qty;
      });
      level = Math.max(0, level);
    }
    return pts;
  })();

  return (
    <>
      <PageHeader title="Products" subtitle="Your catalogue with live stock levels in every warehouse." actions={<Button icon={Plus} onClick={() => setEdit({})}>Add product</Button>} />
      <DataTable
        rows={rows}
        initialQuery={params.get('q') || undefined}
        exportName="products"
        searchKeys={['name', 'sku', 'barcode', 'category', 'supplier']}
        filter={{ key: 'health', options: ['In stock', 'Low stock', 'Out of stock'] }}
        onRowClick={(r) => setViewId(r.id)}
        columns={[
          { key: 'name', label: 'Product', render: (r) => (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{r.category.slice(0, 2).toUpperCase()}</div>
              <div><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.sku}</div></div>
            </div>
          ) },
          { key: 'category', label: 'Category', render: (r) => <Badge>{r.category}</Badge> },
          ...db.warehouses.map((w) => ({ key: `wh_${w.id}`, label: w.code, align: 'right', render: (r) => <span className={(r.stock[w.id] || 0) === 0 ? 'text-slate-300' : ''}>{num(r.stock[w.id] || 0)}</span>, sortValue: (r) => r.stock[w.id] || 0, csv: (r) => r.stock[w.id] || 0 })),
          { key: 'total', label: 'Total', align: 'right', render: (r) => <span className="font-semibold">{num(r.total)}</span> },
          { key: 'health', label: 'Status', render: (r) => <Badge tone={HEALTH_TONE[r.health]} dot>{r.health}</Badge> },
          { key: 'value', label: 'Value', align: 'right', render: (r) => money(r.value) },
        ]}
      />
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit product' : 'New product'} fields={FIELDS} initial={edit}
        onSubmit={(v) => {
          const { total, health: _h, value, supplier, ...clean } = v;
          if (edit.id) update('products', edit.id, clean);
          else add('products', { ...clean, stock: Object.fromEntries(db.warehouses.map((w) => [w.id, 0])) });
          toast(edit.id ? 'Product updated' : 'Product created — receive stock from Stock operations');
          setEdit(null);
        }} />
      <Drawer open={!!view} onClose={() => setViewId(null)} title={view?.name} width="max-w-xl"
        footer={view && (<>
          <Button variant="secondary" icon={Trash2} onClick={() => { if (confirm('Delete this product?')) { remove('products', view.id); setViewId(null); toast('Product deleted'); } }}>Delete</Button>
          <Button icon={Pencil} onClick={() => { setEdit(view); setViewId(null); }}>Edit</Button>
        </>)}>
        {view && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={HEALTH_TONE[health(view)]} dot>{health(view)}</Badge>
              <Badge>{view.category}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Barcode size={14} /> {view.barcode}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Card className="p-3"><div className="text-lg font-semibold">{num(totalStock(view))}</div><div className="text-xs text-slate-500">On hand ({view.unit})</div></Card>
              <Card className="p-3"><div className="text-lg font-semibold">{money2(view.cost)}</div><div className="text-xs text-slate-500">Cost</div></Card>
              <Card className="p-3"><div className="text-lg font-semibold">{money2(view.price)}</div><div className="text-xs text-slate-500">Price · {Math.round(((view.price - view.cost) / view.price) * 100)}% margin</div></Card>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Stock by location</h4>
              <div className="space-y-2">
                {db.warehouses.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: w.color }} />
                    <span className="flex-1">{w.name}</span>
                    <span className="font-semibold">{num(view.stock[w.id] || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Stock level – last 30 days</h4>
              <div className="h-32">
                <ResponsiveContainer>
                  <AreaChart data={trend}><XAxis dataKey="label" hide /><Tooltip /><Area type="monotone" dataKey="level" name="Units" stroke="#10b981" fill="#10b98122" strokeWidth={2} /></AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Movement history</h4>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {history.slice(0, 8).map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    {m.type === 'Stock in' ? <ArrowDownLeft size={15} className="text-emerald-600" /> : <ArrowUpRight size={15} className="text-sky-600" />}
                    <span className="flex-1">{m.type} <span className="text-slate-400">· {m.ref} · {wh[m.from || m.to]?.code}{m.type === 'Transfer' ? `→${wh[m.to]?.code}` : ''}</span></span>
                    <span className="text-xs text-slate-500">{dateTime(m.date)}</span>
                    <Badge tone={MOVE_TONE[m.type]}>{Math.abs(m.qty)}</Badge>
                  </li>
                ))}
                {history.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">No movements yet</li>}
              </ul>
            </div>
            <div className="text-xs text-slate-500">Preferred supplier: <span className="font-medium text-slate-700">{sup[view.supplierId]?.name || '—'}</span> · Reorder point {view.reorder}</div>
          </div>
        )}
      </Drawer>
    </>
  );
}
