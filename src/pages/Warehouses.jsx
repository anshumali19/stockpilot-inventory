import { useState } from 'react';
import { Plus, MapPin, User, Pencil, Warehouse as WIcon } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Button, Card, Progress, FormModal, Badge, useToast } from '../kit/ui';
import { money, num } from '../kit/format';

const FIELDS = [
  { name: 'name', label: 'Warehouse name', required: true, span: 2 },
  { name: 'code', label: 'Short code', required: true },
  { name: 'city', label: 'City / state' },
  { name: 'capacity', label: 'Capacity (units)', type: 'number' },
  { name: 'manager', label: 'Manager' },
  { name: 'color', label: 'Label colour', type: 'color', default: '#10b981' },
];

export default function Warehouses() {
  const { db, setDb, update } = useDB();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  return (
    <>
      <PageHeader title="Warehouses" subtitle="Locations, capacity and stock value per site." actions={<Button icon={Plus} onClick={() => setEdit({})}>Add warehouse</Button>} />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {db.warehouses.map((w) => {
          const used = db.products.reduce((a, p) => a + (p.stock[w.id] || 0), 0);
          const value = db.products.reduce((a, p) => a + (p.stock[w.id] || 0) * p.cost, 0);
          const skus = db.products.filter((p) => (p.stock[w.id] || 0) > 0).length;
          const empty = db.products.filter((p) => (p.stock[w.id] || 0) === 0).length;
          const pctUsed = Math.round((used / (w.capacity || 1)) * 100);
          const moves = db.movements.filter((m) => m.from === w.id || m.to === w.id).length;
          return (
            <Card key={w.id} className="overflow-hidden">
              <div className="h-1.5" style={{ background: w.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: w.color }}><WIcon size={20} /></span>
                    <div><div className="font-semibold">{w.name}</div><div className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> {w.city}</div></div>
                  </div>
                  <Badge>{w.code}</Badge>
                </div>
                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-600">Capacity used</span><span className="font-semibold">{pctUsed}%</span></div>
                  <Progress value={used} max={w.capacity} tone={pctUsed > 85 ? 'red' : pctUsed > 65 ? 'yellow' : 'green'} />
                  <div className="mt-1 text-xs text-slate-400">{num(used)} of {num(w.capacity)} units</div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2"><div className="text-sm font-semibold">{money(value)}</div><div className="text-[11px] text-slate-500">Value</div></div>
                  <div className="rounded-lg bg-slate-50 p-2"><div className="text-sm font-semibold">{skus}</div><div className="text-[11px] text-slate-500">SKUs stocked</div></div>
                  <div className="rounded-lg bg-slate-50 p-2"><div className={`text-sm font-semibold ${empty ? 'text-rose-600' : ''}`}>{empty}</div><div className="text-[11px] text-slate-500">Empty SKUs</div></div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><User size={12} /> {w.manager}</span>
                  <span>{moves} movements</span>
                  <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEdit(w)}>Edit</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <FormModal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit warehouse' : 'New warehouse'} fields={FIELDS} initial={edit}
        onSubmit={(v) => {
          if (edit.id) update('warehouses', edit.id, v);
          else {
            const id = 'w' + Date.now();
            setDb((d) => ({ ...d, warehouses: [...d.warehouses, { ...v, id }], products: d.products.map((p) => ({ ...p, stock: { ...p.stock, [id]: 0 } })) }));
          }
          toast('Warehouse saved'); setEdit(null);
        }} />
    </>
  );
}
