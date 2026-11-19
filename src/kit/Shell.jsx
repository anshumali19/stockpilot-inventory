import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, RotateCcw, LogOut, Search, ScanLine } from 'lucide-react';
import { Avatar, cx, useToast } from './ui';
import { useDB } from './db';

/**
 * StockPilot shell: dark icon rail (desktop), bottom tab bar (mobile), ops header with a scan action.
 */
export function Shell({ brand, nav, user, children, notifications = [], onSearch }) {
  const [bell, setBell] = useState(false);
  const [me, setMe] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const { reset } = useDB();
  const toast = useToast();
  const ref = useRef();
  useEffect(() => { setBell(false); setMe(false); }, [loc.pathname]);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && (setBell(false), setMe(false));
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = nav.filter((n) => !n.section);
  const current = [...items].sort((a, b) => b.to.length - a.to.length).find((n) => (n.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(n.to)));
  const Logo = brand.icon;
  const short = (l) => l.replace('Stock operations', 'Operate').replace('Movement ledger', 'Ledger').replace('Purchase orders', 'Orders');

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Icon rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[84px] flex-col items-center bg-zinc-950 py-4 lg:flex">
        <Link to="/" className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-zinc-950 shadow-lg shadow-brand-500/30" title={brand.name}><Logo size={22} /></Link>
        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
          {nav.map((n, i) =>
            n.section ? (
              <span key={i} className="my-2 h-px w-8 bg-white/10" />
            ) : (
              <NavLink key={n.to} to={n.to} end={n.to === '/'} title={n.label}
                className={({ isActive }) => cx('relative flex w-[68px] flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition', isActive ? 'bg-brand-500/15 text-brand-400' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200')}>
                {({ isActive }) => (<>
                  {isActive && <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-r bg-brand-400" />}
                  <n.icon size={19} strokeWidth={1.8} />
                  <span className="leading-tight">{short(n.label)}</span>
                  {n.badge ? <span className="absolute right-2 top-1 h-4 min-w-4 rounded-full bg-amber-400 px-1 text-[9px] font-bold leading-4 text-zinc-950">{n.badge}</span> : null}
                </>)}
              </NavLink>
            )
          )}
        </nav>
        <button title="Reset demo data" onClick={() => { if (confirm('Reset all demo data to the original sample set?')) { reset(); toast('Demo data restored'); } }} className="mb-1 rounded-xl p-2.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200 cursor-pointer"><RotateCcw size={18} /></button>
        <button title="Sign out" onClick={() => { sessionStorage.removeItem(brand.sessionKey); navigate('/login'); }} className="rounded-xl p-2.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-200 cursor-pointer"><LogOut size={18} /></button>
      </aside>

      <div className="pb-20 lg:pb-0 lg:pl-[84px]">
        <header ref={ref} className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 lg:hidden"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-950 text-brand-400"><Logo size={16} /></span></div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">{brand.name}</div>
            <div className="truncate text-base font-semibold text-zinc-900">{current?.label || 'Overview'}</div>
          </div>
          <div className="relative ml-auto hidden w-72 md:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input placeholder="Find SKU or product…" onKeyDown={(e) => e.key === 'Enter' && onSearch?.(e.currentTarget.value, navigate)} className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white" />
          </div>
          <Link to="/operations" className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 md:ml-0">
            <ScanLine size={16} className="text-brand-400" /><span className="hidden sm:inline">Scan item</span>
          </Link>
          <div className="relative">
            <button onClick={() => { setBell((b) => !b); setMe(false); }} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer" aria-label="Alerts">
              <Bell size={17} />
              {notifications.length > 0 && <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-amber-400 px-1 text-[9px] font-bold leading-4 text-zinc-950">{notifications.length}</span>}
            </button>
            {bell && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl animate-pop">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Stock alerts</div>
                {notifications.length === 0 && <div className="px-3 py-6 text-center text-sm text-zinc-500">All stock levels healthy</div>}
                {notifications.slice(0, 6).map((n, i) => (
                  <button key={i} onClick={() => n.to && navigate(n.to)} className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-zinc-50 cursor-pointer">
                    <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.tone === 'red' ? 'bg-rose-500' : n.tone === 'yellow' ? 'bg-amber-400' : 'bg-brand-500')} />
                    <span><span className="block text-sm text-zinc-800">{n.title}</span>{n.text && <span className="block text-xs text-zinc-500">{n.text}</span>}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setMe((m) => !m); setBell(false); }} className="cursor-pointer" aria-label="Account"><Avatar name={user.name} size={38} className="rounded-xl" /></button>
            {me && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl animate-pop">
                <div className="px-3 py-2"><div className="text-sm font-semibold">{user.name}</div><div className="text-xs text-zinc-500">{user.role}</div></div>
                <button onClick={() => { if (confirm('Reset all demo data?')) { reset(); toast('Demo data restored'); } }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-50 cursor-pointer"><RotateCcw size={14} /> Reset demo data</button>
                <button onClick={() => { sessionStorage.removeItem(brand.sessionKey); navigate('/login'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-50 cursor-pointer"><LogOut size={14} /> Sign out</button>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-white/10 bg-zinc-950 px-2 py-1.5 lg:hidden">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cx('flex min-w-[68px] flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px]', isActive ? 'text-brand-400' : 'text-zinc-500')}>
            <n.icon size={19} /> {short(n.label)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Dark, scanner-themed sign-in. */
export function Login({ brand, highlights = [], demoEmail }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(demoEmail);
  const [pw, setPw] = useState('demo1234');
  const Logo = brand.icon;
  const go = (e) => { e?.preventDefault(); sessionStorage.setItem(brand.sessionKey, '1'); navigate(brand.base || '/'); };
  const bars = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1];
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-800 p-10 md:flex">
          <div className="flex items-center gap-3 text-zinc-950"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-brand-400"><Logo size={20} /></span><span className="text-xl font-bold">{brand.name}</span></div>
          <div className="relative rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex h-20 items-stretch gap-[3px]">{bars.map((w, i) => <span key={i} className="bg-zinc-900" style={{ width: w * 2 }} />)}</div>
            <div className="mt-2 font-mono text-xs tracking-[0.3em] text-zinc-700">8901000000000</div>
            <div className="absolute inset-x-3 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_2px_rgba(244,63,94,.7)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight text-zinc-950">{brand.headline}</h2>
            <ul className="mt-4 space-y-1.5 text-sm text-zinc-900/80">{highlights.map((h) => <li key={h}>— {h}</li>)}</ul>
          </div>
        </div>
        <form onSubmit={go} className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-zinc-950"><Logo size={20} /></span><span className="text-xl font-bold">{brand.name}</span></div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-400">Operator sign-in</div>
          <h1 className="mt-2 text-2xl font-bold">Start your shift</h1>
          <div className="mt-8 space-y-4">
            <label className="block"><span className="mb-1.5 block text-xs text-zinc-400">Email</span><input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-brand-500" /></label>
            <label className="block"><span className="mb-1.5 block text-xs text-zinc-400">PIN / password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-brand-500" /></label>
            <button className="h-11 w-full rounded-xl bg-brand-500 text-sm font-bold text-zinc-950 hover:bg-brand-400 cursor-pointer">Sign in</button>
            <button type="button" onClick={go} className="h-11 w-full rounded-xl border border-white/10 text-sm text-zinc-300 hover:bg-white/5 cursor-pointer">Continue as demo operator →</button>
          </div>
          <p className="mt-8 text-xs leading-relaxed text-zinc-500">Demo environment — stock data lives in your browser. Reset it any time from the side rail.</p>
        </form>
      </div>
    </div>
  );
}

export function RequireAuth({ sessionKey, base = '', children }) {
  const navigate = useNavigate();
  const ok = sessionStorage.getItem(sessionKey);
  useEffect(() => { if (!ok) navigate(`${base}/login`, { replace: true }); }, [ok, navigate, base]);
  return ok ? children : null;
}
