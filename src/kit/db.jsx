import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { uid } from './format';

/**
 * Tiny local "database": a JSON document of collections persisted to localStorage.
 * Every visitor gets their own sandbox, seeded with realistic demo data, and can reset it any time.
 */
const DBCtx = createContext(null);

export function DBProvider({ storageKey, seed, version = 1, children }) {
  const key = `${storageKey}:v${version}`;
  const [db, setDb] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) return JSON.parse(s);
    } catch {}
    return seed();
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(db));
    } catch {}
  }, [db, key]);

  // keep multiple tabs in sync (e.g. storefront tab + admin tab)
  useEffect(() => {
    const h = (e) => {
      if (e.key === key && e.newValue) {
        try { setDb(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, [key]);

  const api = useMemo(
    () => ({
      db,
      setDb,
      add: (col, item) => {
        const rec = { id: uid(), createdAt: new Date().toISOString(), ...item };
        setDb((d) => ({ ...d, [col]: [rec, ...(d[col] || [])] }));
        return rec;
      },
      update: (col, id, patch) =>
        setDb((d) => ({ ...d, [col]: d[col].map((x) => (x.id === id ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x)) })),
      remove: (col, id) => setDb((d) => ({ ...d, [col]: d[col].filter((x) => x.id !== id) })),
      setKey: (k, v) => setDb((d) => ({ ...d, [k]: typeof v === 'function' ? v(d[k]) : v })),
      reset: () => setDb(seed()),
    }),
    [db, seed]
  );

  return <DBCtx.Provider value={api}>{children}</DBCtx.Provider>;
}

export const useDB = () => useContext(DBCtx);
