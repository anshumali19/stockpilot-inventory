import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { useDB } from '../kit/db';
import { PageHeader, Card, CardHeader, Badge, Tabs, Button } from '../kit/ui';
import { money, num, compact, downloadCSV } from '../kit/format';
import { totalStock, CATEGORIES } from '../seed';

export default function Reports() {
  const { db } = useDB();
  const [tab, setTab] = useState('valuation');

  const r = useMemo(() => {
    const valuation = CATEGORIES.map((c) => {
      const row = { name: c };
      db.warehouses.forEach((w) => (row[w.code] = Math.round(db.products.filter((p) => p.category === c).reduce((a, p) => a + (p.stock[w.id] || 0) * p.cost, 0))));
      return row;
    });
    const since = Date.now() - 90 * 864e5;
    const sold = {};
    db.movements.filter((m) => m.type === 'Stock out' && new Date(m.date) > since).forEach((m) => (sold[m.productId] = (sold[m.productId] || 0) + m.qty));
    const withSales = db.products.map((p) => ({ ...p, sold: sold[p.id] || 0, revenue: (sold[p.id] || 0) * p.price, onHand: totalStock(p) }));
    const sorted = [...withSales].sort((a, b) => b.revenue - a.revenue);
    const totalRev = sorted.reduce((a, p) => a + p.revenue, 0) || 1;
    let cum = 0;
    const abc = sorted.map((p) => { cum += p.revenue; const share = cum / totalRev; return { ...p, cls: share <= 0.8 ? 'A' : share <= 0.95 ? 'B' : 'C', share: (p.revenue / totalRev) * 100 }; });
    const turnover = withSales.map((p) => ({ ...p, cover: p.sold ? Math.round(p.onHand / (p.sold / 90)) : null })).sort((a, b) => (b.cover ?? 9999) - (a.cover ?? 9999));
    return { valuation, abc, turnover };
  }, [db]);

  return (
    <>
      <PageHeader title="Reports" subtitle="Valuation, ABC classification and stock cover — based on the last 90 days of movements." />
      <Tabs className="mb-6" value={tab} onChange={setTab} tabs={[{ value: 'valuation', label: 'Stock valuation' }, { value: 'abc', label: 'ABC analysis' }, { value: 'cover', label: 'Days of cover' }]} />
      {tab === 'valuation' && (
        <Card>
          <CardHeader title="Inventory value by category & warehouse" subtitle="At cost" />
          <div className="h-96 p-4">
            <ResponsiveContainer>
              <BarChart data={r.valuation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => '$' + compact(v)} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                {db.warehouses.map((w) => <Bar key={w.id} dataKey={w.code} stackId="a" fill={w.color} name={w.name} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      {tab === 'abc' && (
        <Card>
          <CardHeader title="ABC classification" subtitle="A = top 80% of revenue · B = next 15% · C = last 5%"
            action={<Button size="sm" variant="secondary" icon={Download} onClick={() => downloadCSV('abc-analysis.csv', r.abc, [{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Product' }, { key: 'sold', label: 'Units sold' }, { key: 'revenue', label: 'Revenue' }, { key: 'cls', label: 'Class' }])}>Export</Button>} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2 text-left">Class</th><th className="px-4 py-2 text-left">Product</th><th className="px-4 py-2 text-right">Units sold</th><th className="px-4 py-2 text-right">Revenue</th><th className="px-4 py-2 text-left">Share</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {r.abc.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5"><Badge tone={p.cls === 'A' ? 'green' : p.cls === 'B' ? 'blue' : 'gray'}>{p.cls}</Badge></td>
                    <td className="px-4 py-2.5"><div className="font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.sku}</div></td>
                    <td className="px-4 py-2.5 text-right">{num(p.sold)}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{money(p.revenue)}</td>
                    <td className="px-4 py-2.5"><div className="h-2 w-40 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, p.share * 4)}%` }} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {tab === 'cover' && (
        <Card>
          <CardHeader title="Days of stock cover" subtitle="On-hand units ÷ average daily dispatch. High cover = overstock; low cover = stock-out risk." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-2 text-left">Product</th><th className="px-4 py-2 text-right">On hand</th><th className="px-4 py-2 text-right">Sold (90d)</th><th className="px-4 py-2 text-right">Days of cover</th><th className="px-4 py-2 text-left">Signal</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {r.turnover.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-right">{num(p.onHand)}</td>
                    <td className="px-4 py-2.5 text-right">{num(p.sold)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{p.cover === null ? '∞' : p.cover}</td>
                    <td className="px-4 py-2.5">{p.cover === null ? <Badge tone="gray">No sales</Badge> : p.cover < 14 ? <Badge tone="red">Reorder now</Badge> : p.cover > 120 ? <Badge tone="yellow">Overstocked</Badge> : <Badge tone="green">Healthy</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
