import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, DollarSign, AlertTriangle, PackageX, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, SlidersHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { useDB } from '../kit/db';
import { PageHeader, StatCard, Card, CardHeader, Badge, Progress, Button } from '../kit/ui';
import { money, num, compact, timeAgo } from '../kit/format';
import { totalStock, CATEGORIES } from '../seed';
import { MOVE_TONE, byId } from '../logic';

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
const ICON = { 'Stock in': ArrowDownLeft, 'Stock out': ArrowUpRight, Transfer: ArrowLeftRight, Adjustment: SlidersHorizontal };

export default function Dashboard() {
  const { db } = useDB();
  const prod = byId(db.products);
  const wh = byId(db.warehouses);

  const s = useMemo(() => {
    const units = db.products.reduce((a, p) => a + totalStock(p), 0);
    const value = db.products.reduce((a, p) => a + totalStock(p) * p.cost, 0);
    const low = db.products.filter((p) => totalStock(p) > 0 && totalStock(p) <= p.reorder);
    const out = db.products.filter((p) => totalStock(p) === 0);
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 864e5);
      return { key: d.toDateString(), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), in: 0, out: 0 };
    });
    db.movements.forEach((m) => {
      const day = days.find((d) => d.key === new Date(m.date).toDateString());
      if (!day) return;
      if (m.type === 'Stock in') day.in += m.qty;
      if (m.type === 'Stock out') day.out += m.qty;
    });
    const byCat = CATEGORIES.map((c) => ({ name: c, value: Math.round(db.products.filter((p) => p.category === c).reduce((a, p) => a + totalStock(p) * p.cost, 0)) }));
    const util = db.warehouses.map((w) => ({ ...w, used: db.products.reduce((a, p) => a + (p.stock[w.id] || 0), 0) }));
    return { units, value, low, out, days, byCat, util };
  }, [db]);

  return (
    <>
      <PageHeader title="Inventory overview" subtitle={`${db.products.length} SKUs across ${db.warehouses.length} warehouses`}
        actions={<><Link to="/reports"><Button variant="secondary">Reports</Button></Link><Link to="/operations"><Button icon={ArrowLeftRight}>Move stock</Button></Link></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units on hand" value={num(s.units)} icon={Boxes} hint={`${db.products.length} active SKUs`} />
        <StatCard label="Inventory value" value={money(s.value)} icon={DollarSign} tone="blue" hint="at cost" />
        <StatCard label="Low stock" value={s.low.length} icon={AlertTriangle} tone="yellow" hint="below reorder point" />
        <StatCard label="Out of stock" value={s.out.length} icon={PackageX} tone="red" hint="across all locations" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Stock in vs. out" subtitle="Units moved over the last 14 days" />
          <div className="h-72 p-4">
            <ResponsiveContainer>
              <BarChart data={s.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval={1} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="in" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Dispatched" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Value by category" />
          <div className="h-52">
            <ResponsiveContainer>
              <PieChart><Pie data={s.byCat} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>{s.byCat.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 px-5 pb-5 text-xs">
            {s.byCat.map((c, i) => <div key={c.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} /><span className="flex-1 text-slate-600">{c.name}</span><span className="font-medium">${compact(c.value)}</span></div>)}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Warehouse capacity" action={<Link to="/warehouses" className="text-xs font-medium text-brand-600 hover:underline">Manage</Link>} />
          <div className="space-y-5 p-5">
            {s.util.map((w) => (
              <div key={w.id}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{w.name}</span><span className="text-slate-500">{Math.round((w.used / w.capacity) * 100)}%</span></div>
                <Progress value={w.used} max={w.capacity} tone={w.used / w.capacity > 0.85 ? 'red' : 'brand'} />
                <div className="mt-1 text-xs text-slate-400">{num(w.used)} / {num(w.capacity)} units · {w.city}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Needs reordering" action={<Link to="/purchase-orders?suggest=1" className="text-xs font-medium text-brand-600 hover:underline">Create PO</Link>} />
          <ul className="divide-y divide-slate-100">
            {[...s.out, ...s.low].slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.sku}</div></div>
                <Badge tone={totalStock(p) === 0 ? 'red' : 'yellow'}>{totalStock(p)} / {p.reorder}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Recent activity" action={<Link to="/movements" className="text-xs font-medium text-brand-600 hover:underline">Ledger</Link>} />
          <ul className="divide-y divide-slate-100">
            {db.movements.slice(0, 7).map((m) => {
              const I = ICON[m.type];
              return (
                <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.type === 'Stock in' ? 'bg-emerald-50 text-emerald-600' : m.type === 'Stock out' ? 'bg-sky-50 text-sky-600' : m.type === 'Transfer' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}><I size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{prod[m.productId]?.name}</div>
                    <div className="text-xs text-slate-500">{m.type} · {wh[m.from || m.to]?.code}{m.type === 'Transfer' ? ` → ${wh[m.to]?.code}` : ''} · {timeAgo(m.date)}</div>
                  </div>
                  <Badge tone={MOVE_TONE[m.type]}>{m.qty > 0 && m.type !== 'Stock out' ? '+' : m.type === 'Stock out' ? '−' : ''}{Math.abs(m.qty)}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
