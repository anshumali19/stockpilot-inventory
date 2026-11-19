import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, RotateCcw, LogOut, Search, Sparkles } from 'lucide-react';
import { Avatar, cx, useToast } from './ui';
import { useDB } from './db';

/**
 * App shell: responsive sidebar + topbar.
 * nav: [{ section?: 'Label' } | { to, label, icon, badge? }]
 */
export function Shell({ brand, nav, user, children, notifications = [], onSearch }) {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const { reset } = useDB();
  const toast = useToast();
  useEffect(() => { setOpen(false); setBell(false); }, [loc.pathname]);

  const Logo = brand.icon;
  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-lg shadow-brand-600/30">
          <Logo size={18} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">{brand.name}</div>
          <div className="text-[11px] text-slate-500">{brand.tagline}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {nav.map((n, i) =>
          n.section ? (
            <div key={i} className="mt-5 mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{n.section}</div>
          ) : (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/' || n.to === brand.base}
              className={({ isActive }) =>
                cx('group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition', isActive ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40' : 'hover:bg-white/5 hover:text-white')
              }
            >
              <n.icon size={17} className="shrink-0" />
              <span className="flex-1">{n.label}</span>
              {n.badge ? <span className="rounded-full bg-white/10 px-2 text-[10px] font-semibold">{n.badge}</span> : null}
            </NavLink>
          )
        )}
      </nav>
      <div className="border-t border-white/5 p-3">
        <button
          onClick={() => { if (confirm('Reset all demo data to the original sample set?')) { reset(); toast('Demo data restored'); } }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <RotateCcw size={16} /> Reset demo data
        </button>
        <button
          onClick={() => { sessionStorage.removeItem(brand.sessionKey); navigate(`${brand.base || ''}/login`); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/5 hover:text-white cursor-pointer"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 animate-slide-left">{sidebar}</div>
          <button onClick={() => setOpen(false)} className="absolute left-66 top-4 rounded-lg bg-white p-1.5 cursor-pointer" aria-label="Close menu"><X size={18} /></button>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder={onSearch ? 'Search… (press Enter)' : 'Search…'}
              onKeyDown={(e) => e.key === 'Enter' && onSearch?.(e.currentTarget.value, navigate)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex-1 md:hidden" />
          <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 sm:inline-flex">
            <Sparkles size={13} /> Live demo
          </span>
          <div className="relative">
            <button onClick={() => setBell((b) => !b)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Notifications">
              <Bell size={19} />
              {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
            </button>
            {bell && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-pop">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Notifications</div>
                {notifications.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-500">You're all caught up 🎉</div>}
                {notifications.slice(0, 6).map((n, i) => (
                  <button key={i} onClick={() => n.to && navigate(n.to)} className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 cursor-pointer">
                    <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.tone === 'red' ? 'bg-rose-500' : n.tone === 'yellow' ? 'bg-amber-500' : 'bg-brand-500')} />
                    <span>
                      <span className="block text-sm text-slate-800">{n.title}</span>
                      {n.text && <span className="block text-xs text-slate-500">{n.text}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <Avatar name={user.name} size={34} />
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-medium text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500">{user.role}</div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/** Demo sign-in screen; any input works, it only sets a session flag. */
export function Login({ brand, highlights = [], demoEmail }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(demoEmail);
  const [pw, setPw] = useState('demo1234');
  const Logo = brand.icon;
  const go = (e) => {
    e?.preventDefault();
    sessionStorage.setItem(brand.sessionKey, '1');
    navigate(brand.base || '/');
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600"><Logo size={20} /></div>
          <span className="text-lg font-semibold">{brand.name}</span>
        </div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">{brand.headline}</h2>
          <p className="mt-4 max-w-md text-slate-400">{brand.description}</p>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600/30 text-brand-300">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} {brand.name}. Demo environment.</p>
      </div>
      <div className="flex items-center justify-center bg-white p-6">
        <form onSubmit={go} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><Logo size={20} /></div>
            <span className="text-lg font-semibold">{brand.name}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to explore the live demo workspace.</p>
          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Password</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            </label>
            <button className="h-10 w-full rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 cursor-pointer">Sign in</button>
            <button type="button" onClick={go} className="h-10 w-full rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
              Continue as demo user →
            </button>
          </div>
          <p className="mt-6 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
            This is a demo. Data is stored only in your browser, so feel free to create, edit and delete anything. Use “Reset demo data” in the sidebar to start over.
          </p>
        </form>
      </div>
    </div>
  );
}

/** Route guard */
export function RequireAuth({ sessionKey, base = '', children }) {
  const navigate = useNavigate();
  const ok = sessionStorage.getItem(sessionKey);
  useEffect(() => { if (!ok) navigate(`${base}/login`, { replace: true }); }, [ok, navigate, base]);
  return ok ? children : null;
}
