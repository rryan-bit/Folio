// ═══════════════════════════════════════════════════════════════
// FOLIO — Formatting Helpers
// All currency, number, date, and display formatting lives here.
// Always use these functions — never format inline.
// ═══════════════════════════════════════════════════════════════

// ── Currency formatting ──

/**
 * Full money format: $1,234.56
 * Always shows 2 decimal places. Uses business currency symbol.
 */
function money(n, sym) {
  sym = sym ?? currentBusiness?.currencySymbol ?? '$';
  const num = parseFloat(n || 0);
  if (isNaN(num)) return sym + '0.00';
  return sym + Math.abs(num).toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Compact money format: $1.2K, $45.8K, $2.4M
 * Used in stat cards and charts where space is limited.
 * Full value available as title attribute via moneyCell()
 */
function moneyK(n, sym) {
  sym = sym ?? currentBusiness?.currencySymbol ?? '$';
  const num = parseFloat(n || 0);
  if (isNaN(num)) return sym + '0';
  const abs = Math.abs(num);
  const sign = num < 0 ? '−' : '';
  if (abs >= 1_000_000) return sign + sym + (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + 'M';
  if (abs >= 10_000)   return sign + sym + (abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1) + 'K';
  if (abs >= 1_000)    return sign + sym + (abs / 1_000).toFixed(1) + 'K';
  return sign + money(num, sym);
}

/**
 * Returns an HTML span with compact value shown and full value as tooltip.
 */
function moneyCell(n, colorClass) {
  const full = money(n);
  const compact = moneyK(n);
  const cls = colorClass ? ` tc-${colorClass}` : '';
  return `<span class="money-cell${cls}" title="${full}">${compact}</span>`;
}

/**
 * Format a number as a percentage: 12.5%
 */
function pct(n, decimals = 1) {
  const num = parseFloat(n || 0);
  if (isNaN(num)) return '0%';
  return num.toFixed(decimals).replace(/\.0+$/, '') + '%';
}

/**
 * Format a plain number with commas: 1,234,567
 */
function fmtNum(n) {
  return parseFloat(n || 0).toLocaleString('en-AU');
}

// ── Date formatting ──

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d.slice(0,10) + 'T00:00:00').toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' }); }
  catch(e) { return d; }
}

function fmtShort(d) {
  if (!d) return '—';
  try { return new Date(d.slice(0,10) + 'T00:00:00').toLocaleDateString('en-AU', { day:'numeric', month:'short' }); }
  catch(e) { return d; }
}

function fmtMonLabel(key) {
  try { return new Date(key + '-01').toLocaleDateString('en-AU', { month:'short' }); }
  catch(e) { return key; }
}

function fmtMonKey(offset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return d.toISOString().slice(0, 7);
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-AU', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  catch(e) { return iso; }
}

function fmtRelative(d) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  const diff = Math.floor((Date.now() - dt) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
  return fmtShort(d.slice ? d.slice(0,10) : dt.toISOString().slice(0,10));
}

// ── Time formatting ──

function fmtMins(m) {
  const h = Math.floor((m||0) / 60);
  const mm = (m||0) % 60;
  return h > 0 ? `${h}h${mm > 0 ? ' ' + mm + 'm' : ''}` : `${mm}m`;
}

function fmtSecs(s) {
  s = s || 0;
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

// ── String helpers ──

function truncate(str, max = 32) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function initials(n) {
  if (!n) return '?';
  return n.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function avColor(s) {
  const c = ['#2d5be3','#7c3aed','#16a34a','#ea580c','#dc2626','#0891b2','#b45309','#be185d'];
  let h = 0;
  for (let i = 0; i < (s||'').length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
}

function avEl(name, size = 'sm') {
  return `<div class="av av-${size}" style="background:${avColor(name)}">${initials(name)}</div>`;
}

// ── Invoice / Quote calculations ──

function calcInv(inv) {
  const sub = (inv.items || []).reduce((s, i) => s + (parseFloat(i.qty)||0) * (parseFloat(i.rate)||0), 0);
  const disc = sub * ((parseFloat(inv.discount)||0) / 100);
  const after = sub - disc;
  const tax = after * ((parseFloat(inv.taxRate)||0) / 100);
  const total = after + tax;
  const paid = (inv.payments || []).reduce((s, p) => s + (parseFloat(p.amount)||0), 0);
  return { sub, disc, after, tax, total, paid, balance: total - paid };
}

function invStatus(inv) {
  if (inv.status === 'paid')      return 'paid';
  if (inv.status === 'cancelled') return 'cancelled';
  if (inv.status === 'draft')     return 'draft';
  if (isOver(inv.due))            return 'overdue';
  return inv.status || 'unpaid';
}

// ── Badge helpers ──

function statusBadge(st) {
  const map = {
    paid:'b-green', sent:'b-blue', unpaid:'b-orange', overdue:'b-red',
    draft:'b-gray', cancelled:'b-gray', accepted:'b-teal', declined:'b-red',
    expired:'b-amber', active:'b-blue', complete:'b-green', paused:'b-gray',
    won:'b-teal', lost:'b-red', new:'b-gray', contacted:'b-blue',
    proposal:'b-orange', negotiation:'b-purple',
  };
  return `<span class="badge ${map[st]||'b-gray'}">${st}</span>`;
}

function priorityBadge(p) {
  const m = { high:'b-red', medium:'b-orange', low:'b-gray' };
  return `<span class="badge ${m[p]||'b-gray'}">${p||'medium'}</span>`;
}

// ── Misc helpers ──

function uid()  { return '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36); }
function today(){ return new Date().toISOString().slice(0, 10); }
function addDays(d, n) {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function subMonths(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}
function isOver(d) { return !!(d && d < today()); }

function clientName(id) {
  const c = S?.clients?.find(c => c.id === id);
  return c ? c.name : '—';
}
function projName(id) {
  const p = S?.projects?.find(p => p.id === id);
  return p ? p.name : '—';
}

// ── DOM helpers ──

function toast(msg, type = '') {
  const container = document.getElementById('toast-wrap');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast${type ? ' ' + type : ''}`;
  const icons = { s:'✓', e:'✕', w:'⚠', '':'ℹ' };
  el.innerHTML = `<span>${icons[type]||'ℹ'}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2800);
}

function showModal(html) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = html;
  root.querySelector('.modal-ov')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

function confirm2(msg, cb) {
  if (confirm(msg)) cb();
}
