export const uid = () => Math.random().toString(36).slice(2, 10);

export const money = (n, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n || 0);
export const money2 = (n, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(n || 0);
export const compact = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
export const num = (n) => new Intl.NumberFormat('en-US').format(n || 0);
export const pct = (n) => `${(n || 0).toFixed(1)}%`;
export const date = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
export const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
export const daysFromNow = (n) => new Date(Date.now() + n * 864e5).toISOString();
export const isoDay = (d) => new Date(d).toISOString().slice(0, 10);
export const timeAgo = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return date(d);
};

export function rng(seed = 42) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
export const initials = (name = '') =>
  name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const lastMonths = (n = 12) => {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
  }
  return out;
};

export const FIRST = ['Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia', 'Arjun', 'Priya', 'Rohan', 'Ananya', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Daniel', 'Harper', 'Henry', 'Zara', 'Kabir', 'Meera', 'Leo', 'Chloe', 'Omar', 'Layla', 'Victor'];
export const LAST = ['Smith', 'Johnson', 'Sharma', 'Patel', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Kapoor', 'Wilson', 'Anderson', 'Thomas', 'Moore', 'Clark', 'Lewis', 'Walker', 'Mehta', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Rivera', 'Verma', 'Reddy', 'Brooks'];
export const COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Labs', 'Stark Industries', 'Wayne Logistics', 'Hooli', 'Vandelay Imports', 'Soylent Foods', 'Cyberdyne Systems', 'Wonka Retail', 'Tyrell Tech', 'Pied Piper', 'Massive Dynamic', 'Oscorp', 'Aperture Science', 'Blue Sun Co', 'Monarch Trading', 'Nakatomi Trading', 'Gringotts Finance', 'Sterling Cooper', 'Dunder Paper', 'Bluth Holdings', 'Prestige Worldwide'];
export const CITIES = ['New York', 'London', 'Mumbai', 'Bengaluru', 'Dubai', 'Singapore', 'Toronto', 'Sydney', 'Berlin', 'San Francisco', 'Delhi', 'Austin'];

export const fullName = (r) => `${pick(r, FIRST)} ${pick(r, LAST)}`;
export const emailOf = (name, domain = 'example.com') => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${domain}`;
export const phone = (r) => `+1 (${int(r, 200, 989)}) ${int(r, 200, 999)}-${int(r, 1000, 9999)}`;

export function downloadCSV(filename, rows, columns) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.csv ? c.csv(r) : r[c.key])).join(',')).join('\n');
  const blob = new Blob([head + '\n' + body], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
