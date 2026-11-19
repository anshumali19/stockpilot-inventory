import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { X, Search, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown, Inbox, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { downloadCSV } from './format';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Button({ variant = 'primary', size = 'md', className, icon: Icon, children, ...p }) {
  const v = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  }[variant];
  const s = { xs: 'h-7 px-2 text-xs', sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-11 px-5 text-sm' }[size];
  return (
    <button
      className={cx('inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer', v, s, className)}
      {...p}
    >
      {Icon && <Icon size={size === 'xs' || size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, className, title, ...p }) {
  return (
    <button title={title} aria-label={title} className={cx('inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer', className)} {...p}>
      <Icon size={16} />
    </button>
  );
}

export function Card({ className, children, ...p }) {
  return <div className={cx('rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...p}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-500/10',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  yellow: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
};
export function Badge({ tone = 'gray', children, dot, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap', TONES[tone] || TONES.gray, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** map of status -> tone, used by StatusBadge */
export function StatusBadge({ status, map }) {
  const tone = (map && map[status]) || 'gray';
  return <Badge tone={tone} dot>{status}</Badge>;
}

export function StatCard({ label, value, delta, icon: Icon, hint, tone = 'brand' }) {
  const toneBg = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    yellow: 'bg-amber-50 text-amber-600',
    blue: 'bg-sky-50 text-sky-600',
    purple: 'bg-violet-50 text-violet-600',
  }[tone];
  const up = typeof delta === 'number' ? delta >= 0 : null;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneBg)}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {(up !== null || hint) && (
        <p className="mt-3 text-xs text-slate-500">
          {up !== null && (
            <span className={cx('mr-1 font-semibold', up ? 'text-emerald-600' : 'text-rose-600')}>
              {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint}
        </p>
      )}
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumb && <div className="mb-1 text-xs font-medium text-slate-500">{breadcrumb}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl animate-pop', w)}>
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <IconButton icon={X} title="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 animate-fade" onClick={onClose} />
      <div className={cx('absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl animate-slide', width)}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <IconButton icon={X} title="Close" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export const inputCls =
  'w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function Field({ label, children, hint, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-medium text-slate-700">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
export const Input = ({ className, ...p }) => <input className={cx(inputCls, className)} {...p} />;
export const Select = ({ className, options = [], ...p }) => (
  <select className={cx(inputCls, 'pr-8', className)} {...p}>
    {options.map((o) => {
      const v = typeof o === 'object' ? o.value : o;
      const l = typeof o === 'object' ? o.label : o;
      return <option key={v} value={v}>{l}</option>;
    })}
  </select>
);
export const Textarea = ({ className, ...p }) => <textarea className={cx(inputCls, 'h-auto min-h-[90px] py-2', className)} {...p} />;

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-3 cursor-pointer">
      <span className={cx('relative h-5 w-9 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition', checked ? 'left-4.5' : 'left-0.5')} />
      </span>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </button>
  );
}

/**
 * Schema-driven create / edit form.
 * fields: [{ name, label, type: text|number|email|date|select|textarea|color|url, options, required, span: 2, step, placeholder }]
 */
export function FormModal({ open, onClose, title, fields, initial, onSubmit, submitLabel = 'Save', size = 'md' }) {
  const [form, setForm] = useState({});
  useEffect(() => {
    if (open) {
      const base = {};
      fields.forEach((f) => {
        const first = f.options?.[0];
        base[f.name] = f.default ?? (f.type === 'select' && first !== undefined ? (typeof first === 'object' ? first.value : first) : f.type === 'number' ? 0 : '');
      });
      setForm({ ...base, ...(initial || {}) });
    }
  }, [open]); // eslint-disable-line
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const out = { ...form };
    fields.forEach((f) => {
      if (f.type === 'number') out[f.name] = Number(out[f.name]) || 0;
      if (f.type === 'date' && out[f.name] && out[f.name].length === 10) out[f.name] = new Date(out[f.name] + 'T12:00:00').toISOString();
    });
    onSubmit(out);
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" form="schema-form">{submitLabel}</Button>
        </>
      }
    >
      <form id="schema-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          let v = form[f.name] ?? '';
          if (f.type === 'date' && v) v = String(v).slice(0, 10);
          const common = { value: v, required: f.required, placeholder: f.placeholder, onChange: (e) => set(f.name, e.target.value) };
          return (
            <Field key={f.name} label={f.label + (f.required ? ' *' : '')} hint={f.hint} className={f.span === 2 || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
              {f.type === 'select' ? (
                <Select options={f.options} {...common} />
              ) : f.type === 'textarea' ? (
                <Textarea {...common} />
              ) : f.type === 'color' ? (
                <Input type="color" className="p-1" {...common} />
              ) : (
                <Input type={f.type || 'text'} step={f.step || (f.type === 'number' ? 'any' : undefined)} min={f.min} {...common} />
              )}
            </Field>
          );
        })}
      </form>
    </Modal>
  );
}

export function EmptyState({ title = 'Nothing here yet', text, action, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={22} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Searchable, sortable, paginated table with filter chips and CSV export.
 * columns: [{ key, label, render(row), sortValue(row), align, className, csv(row) }]
 * filters: { key, options: [..] } -> renders segmented filter by row[key]
 */
export function DataTable({ rows, columns, searchKeys = [], pageSize = 10, onRowClick, toolbar, filter, exportName, emptyText, initialSort, initialQuery }) {
  const [q, setQ] = useState(initialQuery || '');
  useEffect(() => { if (initialQuery !== undefined) setQ(initialQuery); }, [initialQuery]);
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(0);
  const [fv, setFv] = useState('All');

  const filtered = useMemo(() => {
    let r = rows;
    if (filter && fv !== 'All') r = r.filter((x) => x[filter.key] === fv);
    if (q) {
      const s = q.toLowerCase();
      r = r.filter((x) => searchKeys.some((k) => String(typeof k === 'function' ? k(x) : x[k] ?? '').toLowerCase().includes(s)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const val = col?.sortValue || ((x) => x[sort.key]);
      r = [...r].sort((a, b) => {
        const A = val(a), B = val(b);
        const res = typeof A === 'number' && typeof B === 'number' ? A - B : String(A ?? '').localeCompare(String(B ?? ''));
        return sort.dir === 'asc' ? res : -res;
      });
    }
    return r;
  }, [rows, q, sort, fv, filter, searchKeys, columns]);

  useEffect(() => setPage(0), [q, fv, rows.length]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key) =>
    setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {searchKeys.length > 0 && (
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={cx(inputCls, 'pl-9')} />
            </div>
          )}
          {filter && (
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
              {['All', ...filter.options].map((o) => (
                <button
                  key={o}
                  onClick={() => setFv(o)}
                  className={cx('rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer', fv === o ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {toolbar}
          {exportName && (
            <Button variant="secondary" size="sm" icon={Download} onClick={() => downloadCSV(`${exportName}.csv`, filtered, columns.filter((c) => c.label))}>
              Export
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sortable !== false && c.label && toggleSort(c.key)}
                  className={cx(
                    'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap select-none',
                    c.sortable !== false && c.label && 'cursor-pointer hover:text-slate-800',
                    c.align === 'right' && 'text-right'
                  )}
                >
                  <span className={cx('inline-flex items-center gap-1', c.align === 'right' && 'flex-row-reverse')}>
                    {c.label}
                    {c.sortable !== false && c.label && (sort?.key === c.key ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronsUpDown size={12} className="opacity-40" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {view.map((r) => (
              <tr key={r.id} onClick={() => onRowClick?.(r)} className={cx('transition hover:bg-slate-50/80', onRowClick && 'cursor-pointer')}>
                {columns.map((c) => (
                  <td key={c.key} className={cx('px-4 py-3 text-slate-700 whitespace-nowrap', c.align === 'right' && 'text-right', c.className)}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {view.length === 0 && <EmptyState title="No results" text={emptyText || 'Try adjusting your search or filters.'} />}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        <span>
          {filtered.length === 0 ? 0 : page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <IconButton icon={ChevronLeft} title="Previous" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
          <span className="px-2">Page {page + 1} / {pages}</span>
          <IconButton icon={ChevronRight} title="Next" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} />
        </div>
      </div>
    </Card>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cx('flex gap-1 overflow-x-auto border-b border-slate-200', className)}>
      {tabs.map((t) => {
        const v = typeof t === 'object' ? t.value : t;
        const l = typeof t === 'object' ? t.label : t;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition cursor-pointer', value === v ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ name = '', size = 32, className }) {
  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-teal-500', 'bg-indigo-500'];
  const c = colors[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % colors.length];
  const ini = name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', c, className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {ini}
    </span>
  );
}

export function Progress({ value, max = 100, tone = 'brand', className }) {
  const p = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const bg = { brand: 'bg-brand-600', green: 'bg-emerald-500', red: 'bg-rose-500', yellow: 'bg-amber-500' }[tone];
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cx('h-full rounded-full transition-all', bg)} style={{ width: `${p}%` }} />
    </div>
  );
}

/* ---------------- Toasts ---------------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = Math.random();
    setItems((i) => [...i, { id, msg, type }]);
    setTimeout(() => setItems((i) => i.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-xl animate-pop">
            {t.type === 'error' ? <AlertTriangle size={16} className="text-amber-400" /> : <CheckCircle2 size={16} className="text-emerald-400" />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
