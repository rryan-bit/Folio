// ═══════════════════════════════════════════════════════════════
// FOLIO — Navigation, Theme, Sidebar, Command Palette
// All navigation is permission-gated here.
// ═══════════════════════════════════════════════════════════════

let currentPage = 'dashboard';

const pageTitles = {
  dashboard:'Dashboard', clients:'Clients', leads:'Pipeline',
  projects:'Projects', tasks:'Tasks', invoices:'Invoices',
  quotes:'Quotes', time:'Time Tracking', expenses:'Expenses',
  reports:'Reports', calendar:'Calendar', settings:'Settings',
  team:'Team', audit:'Audit Log',
};

// Pages and which permission is required to view them
const pagePermission = {
  dashboard: null,      // always visible
  clients:   'clients',
  leads:     'leads',
  projects:  'projects',
  tasks:     'tasks',
  invoices:  'invoices',
  quotes:    'quotes',
  time:      'time',
  expenses:  'expenses',
  reports:   'reports',
  calendar:  'calendar',
  settings:  'settings',
  team:      'team',
  audit:     'team',    // only admins+ via isAdmin()
};

function nav(page, el) {
  if (currentPage === page) return;

  // Permission gate
  const perm = pagePermission[page];
  if (perm && !canView(perm) && page !== 'team') {
    // Still navigate but show access denied
    currentPage = page;
    _doNav(page, el);
    renderAccessDenied(page);
    return;
  }

  currentPage = page;
  _doNav(page, el);
  render(page);
}

function _doNav(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  if (el) el.classList.add('active');
  else document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  document.getElementById('topbar-title').textContent = pageTitles[page] || page;

  // Close mobile sidebar
  closeSidebar();
}

function render(page) {
  const fns = {
    dashboard:  renderDash,
    clients:    renderClients,
    leads:      renderLeads,
    projects:   renderProjects,
    tasks:      renderTasks,
    invoices:   renderInvoices,
    quotes:     renderQuotes,
    time:       renderTime,
    expenses:   renderExpenses,
    reports:    renderReports,
    calendar:   renderCalendar,
    settings:   renderSettings,
    team:       renderTeam,
    audit:      renderAuditLog,
  };
  if (fns[page]) fns[page]();
}

// ── Build sidebar based on current user permissions ──
function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const items = [
    { section: 'Overview' },
    { page:'dashboard', icon:'⬡', label:'Dashboard', perm:null },
    { section: 'Work' },
    { page:'clients',  icon:'👥', label:'Clients',  perm:'clients'  },
    { page:'leads',    icon:'🎯', label:'Pipeline', perm:'leads'    },
    { page:'projects', icon:'📁', label:'Projects', perm:'projects' },
    { page:'tasks',    icon:'✅', label:'Tasks',    perm:'tasks', badge:'tasks-badge' },
    { section: 'Finance' },
    { page:'invoices', icon:'📄', label:'Invoices', perm:'invoices', badge:'inv-badge' },
    { page:'quotes',   icon:'📋', label:'Quotes',   perm:'quotes'   },
    { page:'time',     icon:'⏱', label:'Time',     perm:'time'     },
    { page:'expenses', icon:'💸', label:'Expenses', perm:'expenses' },
    { section: 'Insights' },
    { page:'reports',  icon:'📊', label:'Reports',  perm:'reports'  },
    { page:'calendar', icon:'📅', label:'Calendar', perm:'calendar' },
    { section: 'System' },
    { page:'team',     icon:'👤', label:'Team',     perm:'team'     },
    // Audit log only for admins+
    ...(isAdmin() ? [{ page:'audit', icon:'📋', label:'Audit Log', perm:'team' }] : []),
    { page:'settings', icon:'⚙️', label:'Settings', perm:'settings' },
  ];

  nav.innerHTML = items.map(item => {
    if (item.section) return `<div class="nav-section-label">${item.section}</div>`;
    // Hide items the user can't view (except dashboard)
    if (item.perm && !canView(item.perm)) return '';
    return `
      <div class="nav-item${currentPage === item.page ? ' active' : ''}"
           data-page="${item.page}"
           onclick="nav('${item.page}',this)">
        <span class="nav-icon">${item.icon}</span> ${item.label}
        ${item.badge ? `<span class="nav-badge" id="${item.badge}" style="display:none">0</span>` : ''}
      </div>`;
  }).join('');
}

function updateBadges() {
  const overInv   = S?.invoices?.filter(i => invStatus(i) === 'overdue').length || 0;
  const overTasks = S?.tasks?.filter(t => t.status !== 'done' && isOver(t.due)).length || 0;
  const ib = document.getElementById('inv-badge');
  const tb = document.getElementById('tasks-badge');
  if (ib) { ib.textContent = overInv;   ib.style.display = overInv   > 0 ? '' : 'none'; }
  if (tb) { tb.textContent = overTasks; tb.style.display = overTasks > 0 ? '' : 'none'; }
}

// ── Topbar user display ──
function updateTopbarUser() {
  if (!currentUser) return;
  const el = document.getElementById('topbar-user-display');
  if (!el) return;
  const roleCols = { owner:'b-purple',admin:'b-blue',manager:'b-teal',employee:'b-green',accountant:'b-amber',readonly:'b-gray' };
  const roleLabels = { owner:'Owner',admin:'Admin',manager:'Manager',employee:'Employee',accountant:'Accountant',readonly:'Read-only' };
  el.innerHTML = `
    <div class="av av-sm" style="background:${avColor(currentUser.name)}">${initials(currentUser.name)}</div>
    <div>
      <div class="topbar-user-name">${truncate(currentUser.name, 20)}</div>
      <div class="topbar-user-role">
        <span class="badge ${roleCols[currentUser.role]||'b-gray'}" style="font-size:10px">${roleLabels[currentUser.role]||currentUser.role}</span>
      </div>
    </div>`;
}

function updateSidebar() {
  const logoBiz = document.getElementById('logo-biz');
  if (logoBiz) logoBiz.textContent = currentBusiness?.name || 'Folio';

  const uname = document.getElementById('sidebar-uname');
  if (uname) uname.textContent = currentUser?.name || 'Your Name';

  const ubiz = document.getElementById('sidebar-biz');
  if (ubiz) ubiz.textContent = currentBusiness?.name || '';

  const av = document.getElementById('sidebar-av');
  if (av) {
    av.textContent = initials(currentUser?.name || '?');
    av.style.background = avColor(currentUser?.name || 'x');
  }

  buildSidebar();
  updateTopbarUser();
}

// ── Sidebar toggle ──
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sb) return;
  sb.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

// ── Theme ──
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  if (currentBusiness) { saveBusiness({ theme: t }); }
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
}

// ── Command Palette ──
function openCmd() {
  if (document.getElementById('cmd-ov')) return;
  const html = `
  <div class="cmd-ov" id="cmd-ov" onclick="if(event.target===this)closeCmd()">
    <div class="cmd">
      <div class="cmd-s">
        <span style="font-size:16px;color:var(--muted)">⌘</span>
        <input type="text" placeholder="Search or run a command…" id="cmd-in"
          oninput="filterCmd(this.value)" autofocus/>
      </div>
      <div class="cmd-res" id="cmd-res"></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  setTimeout(() => document.getElementById('cmd-in')?.focus(), 50);
  filterCmd('');
}

function closeCmd() {
  document.getElementById('cmd-ov')?.remove();
}

function filterCmd(q) {
  const el = document.getElementById('cmd-res');
  if (!el) return;
  q = q.toLowerCase();

  // Actions filtered by permissions
  const actions = [
    canCreate('invoices') && { icon:'📄', t:'New Invoice',  s:'Create a new invoice',  fn:"closeCmd();openInvModal()"  },
    canCreate('clients')  && { icon:'👤', t:'New Client',   s:'Add a client',           fn:"closeCmd();openClientModal()"},
    canCreate('projects') && { icon:'📁', t:'New Project',  s:'Start a project',        fn:"closeCmd();openProjModal()" },
    canCreate('quotes')   && { icon:'📋', t:'New Quote',    s:'Create a quote',         fn:"closeCmd();openQuoteModal()"},
    canCreate('expenses') && { icon:'💸', t:'Log Expense',  s:'Track an expense',       fn:"closeCmd();openExpModal()"  },
    canCreate('time')     && { icon:'⏱', t:'Start Timer',  s:'Begin tracking time',    fn:"closeCmd();nav('time')"     },
    canCreate('leads')    && { icon:'🎯', t:'Add Lead',     s:'New pipeline lead',      fn:"closeCmd();openLeadModal()" },
  ].filter(Boolean);

  const pages = [
    { icon:'⬡', t:'Dashboard', fn:"closeCmd();nav('dashboard')" },
    canView('clients')  && { icon:'👥', t:'Clients',   fn:"closeCmd();nav('clients')"  },
    canView('invoices') && { icon:'📄', t:'Invoices',  fn:"closeCmd();nav('invoices')" },
    canView('reports')  && { icon:'📊', t:'Reports',   fn:"closeCmd();nav('reports')"  },
    canView('team')     && { icon:'👤', t:'Team',      fn:"closeCmd();nav('team')"     },
  ].filter(Boolean);

  const clients = q ? S?.clients?.filter(c =>
    c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const invs = q && canView('invoices') ? S?.invoices?.filter(i =>
    i.number.toLowerCase().includes(q) || clientName(i.clientId).toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const filt = items => items.filter(i => !q || i.t.toLowerCase().includes(q) || (i.s||'').toLowerCase().includes(q));
  let html = '';

  const fa = filt(actions);
  if (fa.length) {
    html += `<div class="cmd-sec">Quick Actions</div>`;
    html += fa.map(a => `<div class="cmd-item" onclick="${a.fn}">
      <div class="cmd-ic">${a.icon}</div>
      <div class="cmd-it"><div class="cmd-it-t">${a.t}</div>${a.s?`<div class="cmd-it-s">${a.s}</div>`:''}</div>
    </div>`).join('');
  }

  const fp = filt(pages);
  if (fp.length) {
    html += `<div class="cmd-sec">Navigate</div>`;
    html += fp.map(p => `<div class="cmd-item" onclick="${p.fn}">
      <div class="cmd-ic">${p.icon}</div>
      <div class="cmd-it"><div class="cmd-it-t">${p.t}</div></div>
    </div>`).join('');
  }

  if (clients?.length && canView('clients')) {
    html += `<div class="cmd-sec">Clients</div>`;
    html += clients.map(c => `<div class="cmd-item" onclick="closeCmd();nav('clients')">
      <div class="cmd-ic">👤</div>
      <div class="cmd-it"><div class="cmd-it-t">${c.name}</div><div class="cmd-it-s">${c.email||c.company||''}</div></div>
    </div>`).join('');
  }

  if (invs?.length) {
    html += `<div class="cmd-sec">Invoices</div>`;
    html += invs.map(i => `<div class="cmd-item" onclick="closeCmd();nav('invoices')">
      <div class="cmd-ic">📄</div>
      <div class="cmd-it"><div class="cmd-it-t">${i.number} · ${clientName(i.clientId)}</div><div class="cmd-it-s">${money(calcInv(i).total)} · ${invStatus(i)}</div></div>
    </div>`).join('');
  }

  if (!html) {
    html = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No results for "${q}"</div>`;
  }
  el.innerHTML = html;
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openCmd(); }
  if (e.key === 'Escape') { closeCmd(); closeModal(); }
});
