import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Wand2, Send, PackageCheck, XCircle, Pencil, Trash2, Trash } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Button, DataTable, Modal, Drawer, FormModal, Field, Select, Input, Badge, StatusBadge, Avatar, IconButton, Card, useToast } from '../kit/ui';
import { money, money2, date, num } from '../kit/format';
import { totalStock } from '../seed';
import { applyMovement, PO_TONE, byId } from '../logic';

function POBuilder({ open, onClose, initial, onSave }) {
  const { db } = useDB();
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lines, setLines] = useState([]);
  useEffect(() => {
    if (!open) return;
    setSupplierId(initial?.supplierId || db.suppliers[0].id);
    setWarehouseId(db.warehouses[0].id);
    setLines(initial?.lines || []);
  }, [open]); // eslint-disable-line
  const items = db.products.filter((p) => p.supplierId === supplierId);
  const suggest = () => setLines(items.filter((p) => totalStock(p) <= p.reorder * 1.2).map((p) => ({ productId: p.id, qty: Math.max(p.reorder * 2 - totalStock(p), 20), cost: p.cost })));
  const total = lines.reduce((s, l) => s + l.qty * l.cost, 0);
  return (
    <Modal open={open} onClose={onClose} title="New purchase order" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!lines.length} onClick={() => onSave({ supplierId, warehouseId, lines: lines.map((l) => ({ ...l, qty: Number(l.qty) })), total })}>Create PO</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Supplier"><Select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setLines([]); }} options={db.suppliers.map((s) => ({ value: s.id, label: s.name }))} /></Field>
        <Field label="Deliver to"><Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={db.warehouses.map((w) => ({ value: w.id, label: w.name }))} /></Field>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Items from this supplier</span>
        <Button size="sm" variant="secondary" icon={Wand2} onClick={suggest}>Auto-fill low stock</Button>
      </div>
      <div className="mt-2 space-y-2">
        {lines.map((l, i) => {
          const p = db.products.find((x) => x.id === l.productId);
          return (
            <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 p-2">
              <div className="col-span-12 sm:col-span-6"><div className="text-sm font-medium">{p?.name}</div><div className="text-xs text-slate-500">On hand {totalStock(p)} · reorder {p?.reorder}</div></div>
              <Input className="col-span-4 sm:col-span-2" type="number" value={l.qty} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} />
              <div className="col-span-3 text-right text-sm text-slate-500 sm:col-span-2">@ {money2(l.cost)}</div>
              <div className="col-span-4 text-right text-sm font-medium sm:col-span-1">{money(l.qty * l.cost)}</div>
              <IconButton className="col-span-1" icon={Trash} title="Remove" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} />
            </div>
          );
        })}
        {lines.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Add items below, or use “Auto-fill low stock”.</div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.filter((p) => !lines.some((l) => l.productId === p.id)).map((p) => (
          <button key={p.id} onClick={() => setLines((ls) => [...ls, { productId: p.id, qty: 50, cost: p.cost }])} className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:border-brand-500 hover:text-brand-700 cursor-pointer">+ {p.name}</button>
        ))}
      </div>
      <div className="mt-5 text-right text-lg font-semibold">Total {money2(total)}</div>
    </Modal>
  );
}

export function PurchaseOrders() {
  const { db, setDb, update } = useDB();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [viewId, setViewId] = useState(null);
  const sup = byId(db.suppliers);
  const wh = byId(db.warehouses);
  const prod = byId(db.products);
  const view = db.purchaseOrders.find((p) => p.id === viewId);
  useEffect(() => { if (params.get('suggest')) { setCreating(true); setParams({}, { replace: true }); } }, [params]); // eslint-disable-line

  const save = (po) => {
    const n = Math.max(...db.purchaseOrders.map((p) => +p.number.split('-')[1]), 5200) + 1;
    setDb((d) => ({ ...d, purchaseOrders: [{ id: 'po' + Date.now(), number: `PO-${n}`, status: 'Draft', date: new Date().toISOString(), expected: new Date(Date.now() + (sup[po.supplierId]?.leadDays || 7) * 864e5).toISOString(), createdAt: new Date().toISOString(), ...po }, ...d.purchaseOrders] }));
    setCreating(false);
    toast(`PO-${n} created`);
  };
  const receive = (po) => {
    setDb((d) => {
      let next = d;
      po.lines.forEach((l) => { next = applyMovement(next, { productId: l.productId, type: 'Stock in', qty: l.qty, to: po.warehouseId, from: null, ref: po.number }); });
      return { ...next, purchaseOrders: next.purchaseOrders.map((p) => (p.id === po.id ? { ...p, status: 'Received' } : p)) };
    });
    toast(`${po.number} received into ${wh[po.warehouseId]?.code} — stock updated`);
  };

  const rows = db.purchaseOrders.map((p) => ({ ...p, supplier: sup[p.supplierId]?.name, warehouse: wh[p.warehouseId]?.code, units: p.lines.reduce((s, l) => s + l.qty, 0) }));
  return (
    <>
      <PageHeader title="Purchase orders" subtitle="Replenish stock from suppliers; receiving a PO posts stock-in movements automatically." actions={<Button icon={Plus} onClick={() => setCreating(true)}>New PO</Button>} />
      <DataTable
        rows={rows}
        exportName="purchase-orders"
        searchKeys={['number', 'supplier']}
        filter={{ key: 'status', options: ['Draft', 'Ordered', 'Received', 'Cancelled'] }}
        initialSort={{ key: 'date', dir: 'desc' }}
        onRowClick={(r) => setViewId(r.id)}
        columns={[
          { key: 'number', label: 'PO', render: (r) => <span className="font-medium text-slate-900">{r.number}</span> },
          { key: 'supplier', label: 'Supplier' },
          { key: 'warehouse', label: 'Ship to', render: (r) => <Badge>{r.warehouse}</Badge> },
          { key: 'date', label: 'Created', render: (r) => date(r.date), sortValue: (r) => new Date(r.date).getTime(), csv: (r) => date(r.date) },
          { key: 'expected', label: 'Expected', render: (r) => date(r.expected), sortValue: (r) => new Date(r.expected).getTime(), csv: (r) => date(r.expected) },
          { key: 'units', label: 'Units', align: 'right', render: (r) => num(r.units) },
          { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} map={PO_TONE} /> },
          { key: 'total', label: 'Total', align: 'right', render: (r) => <span className="font-medium">{money2(r.total)}</span> },
        ]}
      />
      <POBuilder open={creating} onClose={() => setCreating(false)} onSave={save} />
      <Drawer open={!!view} onClose={() => setViewId(null)} title={view?.number} width="max-w-xl"
        footer={view && (<>
          {view.status === 'Draft' && <Button icon={Send} onClick={() => { update('purchaseOrders', view.id, { status: 'Ordered' }); toast('PO sent to supplier'); }}>Send to supplier</Button>}
          {view.status === 'Ordered' && <Button icon={PackageCheck} variant="success" onClick={() => receive(view)}>Receive all items</Button>}
          {['Draft', 'Ordered'].includes(view.status) && <Button icon={XCircle} variant="secondary" onClick={() => { update('purchaseOrders', view.id, { status: 'Cancelled' }); toast('PO cancelled'); }}>Cancel</Button>}
        </>)}>
        {view && (
          <div className="space-y-5">
            <div className="flex items-center justify-between"><StatusBadge status={view.status} map={PO_TONE} /><span className="text-sm text-slate-500">Expected {date(view.expected)}</span></div>
            <Card className="flex items-center gap-3 p-4"><Avatar name={sup[view.supplierId]?.name} size={40} /><div><div className="font-medium">{sup[view.supplierId]?.name}</div><div className="text-xs text-slate-500">Deliver to {wh[view.warehouseId]?.name}</div></div></Card>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {view.lines.map((l, i) => (
                <li key={i} className="flex justify-between px-4 py-2.5 text-sm"><span>{prod[l.productId]?.name}</span><span className="text-slate-500">{l.qty} × {money2(l.cost)}</span><span className="font-medium">{money2(l.qty * l.cost)}</span></li>
              ))}
              <li className="flex justify-between bg-slate-50 px-4 py-2.5 text-sm font-semibold"><span>Total</span><span>{money2(view.total)}</span></li>
            </ul>
          </div>
        )}
      </Drawer>
    </>
  );
}

const SUP_FIELDS = [
  { name: 'name', label: 'Supplier name', required: true, span: 2 },
  { name: 'contact', label: 'Contact person' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'terms', label: 'Payment terms', type: 'select', options: ['Net 15', 'Net 30', 'Net 45', 'Prepaid'] },
  { name: 'leadDays', label: 'Lead time (days)', type: 'number' },
];

export function Suppliers() {
  const { db, add, update, remove } = useDB();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const rows = db.suppliers.map((s) => ({ ...s, skus: db.products.filter((p) => p.supplierId === s.id).length, open: db.purchaseOrders.filter((p) => p.supplierId === s.id && p.status === 'Ordered').length }));
  return (
    <>
      <PageHeader title="Suppliers" subtitle="Vendors, terms and lead times." actions={<Button icon={Plus} onClick={() => setEdit({})}>Add supplier</Button>} />
      <DataTable rows={rows} exportName="suppliers" searchKeys={['name', 'contact', 'email']}
        columns={[
          { key: 'name', label: 'Supplier', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.name} /><div><div className="font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.contact} · {r.email}</div></div></div> },
          { key: 'phone', label: 'Phone' },
          { key: 'terms', label: 'Terms', render: (r) => <Badge>{r.terms}</Badge> },
          { key: 'leadDays', label: 'Lead time', render: (r) => `${r.leadDays} days` },
          { key: 'skus', label: 'SKUs', align: 'right' },
          { key: 'open', label: 'Open POs', align: 'right' },
          { key: 'a', label: '', sortable: false, render: (r) => <div className="flex justify-end gap-1"><Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEdit(r)} /><Button size="xs" variant="ghost" icon={Trash2} onClick={() => { if (confirm('Delete supplier?')) { remove('suppliers', r.id); toast('Supplier deleted'); } }} /></div> },
        ]} />
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit supplier' : 'New supplier'} fields={SUP_FIELDS} initial={edit}
        onSubmit={(v) => { const { skus, open, ...c } = v; edit.id ? update('suppliers', edit.id, c) : add('suppliers', c); toast('Supplier saved'); setEdit(null); }} />
    </>
  );
}
