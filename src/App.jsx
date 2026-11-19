import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, History, Warehouse, ClipboardList, Truck, BarChart3, ScanLine } from 'lucide-react';
import { Shell, Login, RequireAuth } from './kit/Shell';
import { useDB } from './kit/db';
import { totalStock } from './seed';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import { Operations, Movements } from './pages/Operations';
import Warehouses from './pages/Warehouses';
import { PurchaseOrders, Suppliers } from './pages/Purchasing';
import Reports from './pages/Reports';

const brand = {
  name: 'StockPilot',
  tagline: 'Inventory control',
  icon: ScanLine,
  sessionKey: 'stockpilot-auth',
  headline: 'Know exactly what you have, where it is, and when to reorder.',
  description: 'Multi-warehouse stock tracking with barcode lookup, transfers, purchase orders, a full movement ledger and valuation reports.',
};

export default function App() {
  const { db } = useDB();
  const low = db.products.filter((p) => totalStock(p) <= p.reorder);
  const incoming = db.purchaseOrders.filter((p) => p.status === 'Ordered');
  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'Stock' },
    { to: '/products', label: 'Products', icon: Package, badge: low.length || null },
    { to: '/operations', label: 'Stock operations', icon: ArrowLeftRight },
    { to: '/movements', label: 'Movement ledger', icon: History },
    { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
    { section: 'Procurement' },
    { to: '/purchase-orders', label: 'Purchase orders', icon: ClipboardList, badge: incoming.length || null },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { section: 'Insights' },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ];
  const notifications = [
    ...low.slice(0, 4).map((p) => ({ title: `${totalStock(p) === 0 ? 'Out of stock' : 'Low stock'}: ${p.name}`, text: `${totalStock(p)} left · reorder point ${p.reorder}`, tone: totalStock(p) === 0 ? 'red' : 'yellow', to: '/products' })),
    ...incoming.slice(0, 2).map((p) => ({ title: `${p.number} arriving soon`, to: '/purchase-orders' })),
  ];
  const onSearch = (q, navigate) => navigate(`/products?q=${encodeURIComponent(q)}`);

  return (
    <Routes>
      <Route path="/login" element={<Login brand={brand} demoEmail="ops@stockpilot.example" highlights={['Real-time stock across multiple warehouses', 'Barcode / SKU scan to receive, ship & transfer', 'Automatic reorder suggestions & purchase orders', 'Full audit trail and valuation reports']} />} />
      <Route path="/*" element={
        <RequireAuth sessionKey={brand.sessionKey}>
          <Shell brand={brand} nav={nav} user={{ name: 'Jordan Ellis', role: 'Inventory Manager' }} notifications={notifications} onSearch={onSearch}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/movements" element={<Movements />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        </RequireAuth>
      } />
    </Routes>
  );
}
