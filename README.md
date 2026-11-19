# StockPilot

Multi-warehouse inventory & stock management demo.

**Live demo:** https://stockpilot-inventory-chi.vercel.app

> Demo data is generated in the browser and saved to `localStorage`, so every visitor gets their own sandbox. Create, edit and delete freely — use **Reset demo data** to start over.

## Features

- Live stock levels per warehouse with low-stock / out-of-stock health indicators
- Barcode / SKU scan box to receive, dispatch, transfer or adjust stock in seconds
- Full, exportable movement ledger (audit trail) for every stock change
- Warehouses with capacity utilisation, stock value and empty-SKU counts
- Purchase orders with “auto-fill low stock” reorder suggestions; receiving posts stock-in movements
- Product detail with 30-day stock trend, per-location breakdown and history
- Reports: valuation by category & warehouse, ABC analysis, days-of-cover (overstock / reorder signals)

## Tech stack

- React 18 + Vite
- Tailwind CSS v4
- React Router
- Recharts (charts) & Lucide (icons)
- Deployed on Vercel

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build` (outputs to `dist/`).

## Making it production-ready

This demo runs entirely in the browser. For a client project, the same UI connects to a real backend (e.g. Supabase / PostgreSQL + REST or tRPC API), with authentication, role-based permissions and server-side validation.
