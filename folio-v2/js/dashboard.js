// FOLIO — Dashboard

function renderDash() {
  auditLog('dashboard', 'viewed', 'Dashboard viewed', {});
  updateBadges();

  const invs  = S.invoices   || [];
  const exps  = S.expenses   || [];
  const projs = S.projects   || [];
  const tasks = S.tasks      || [];

  const earned      = invs.filter(i => i.status === 'paid').reduce((s,i) => s + calcInv(i).total, 0);
  const outstanding = invs.filter(i => ['sent','unpaid'].includes(invStatus(i))).reduce((s,i) => s + calcInv(i).balance, 0);
  const overdueAmt  = invs.filter(i => invStatus(i) === 'overdue').reduce((s,i) => s + calcInv(i).balance, 0);
  const totalExp    = exps.reduce((s,e) => s + parseFloat(e.amount||0), 0);
  const netProfit   = earned - totalExp;
  const activeProj  = projs.filter(p => p.status === 'active').length;
  const overdueT    = tasks.filter(t => t.status !== 'done' && isOver(t.due)).length;

  // Monthly chart (6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const key = fmtMonKey(i);
    const rev = invs.filter(inv => inv.status === 'paid' && inv.date?.startsWith(key)).reduce((s,inv) => s + calcInv(inv).total, 0);
    const exp = exps.filter(e => e.date?.startsWith(key)).reduce((s,e) => s + parseFloat(e.amount||0), 0);
    months.push({ key, lbl: fmtMonLabel(key), rev, exp });
  }
  const maxChart = Math.max(...months.map(m => Math.max(m.rev, m.exp)), 1);
  const curKey   = fmtMonKey(0);

  // Upcoming deadlines
  const deadlines = [
    ...projs.filter(p => p.status === 'active' && p.deadline).map(p => ({ label:p.name, date:p.deadline, type:'project' })),
    ...tasks.filter(t => t.status !== 'done' && t.due).map(t => ({ label:t.title, date:t.due, type:'task' })),
    ...invs.filter(i => ['sent','unpaid'].includes(invStatus(i)) && i.due).map(i => ({ label:i.number+' due', date:i.due, type:'invoice' })),
  ].sort((a,b) => a.date.localeCompare(b.date)).slice(0, 5);

  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (currentUser?.name || '').split(' ')[0] || 'there';

  document.getElementById('page-dashboard').innerHTML = `
  <div class="ph">
    <div class="ph-left">
      <h1>${greet}, ${firstName} 👋</h1>
      <p>Here's your business overview for today.</p>
    </div>
    <div class="ph-right">
      <div class="qa-grid">
        ${canCreate('invoices') ? `<div class="qa" onclick="openInvModal()"><span>📄</span> New Invoice</div>` : ''}
        ${canCreate('clients')  ? `<div class="qa" onclick="openClientModal()"><span>👤</span> Add Client</div>` : ''}
        ${canCreate('time')     ? `<div class="qa" onclick="nav('time')"><span>⏱</span> Start Timer</div>` : ''}
        ${canCreate('expenses') ? `<div class="qa" onclick="openExpModal()"><span>💸</span> Log Expense</div>` : ''}
        ${canCreate('quotes')   ? `<div class="qa" onclick="openQuoteModal()"><span>📋</span> New Quote</div>` : ''}
      </div>
    </div>
  </div>

  <div class="stat-grid" style="grid-template-columns:repeat(6,1fr)">
    <div class="stat" title="${money(earned)}">
      <div class="stat-ic">💰</div>
      <div class="stat-lbl">Total Earned</div>
      <div class="stat-val g">${moneyK(earned)}</div>
      <div class="stat-sub">${invs.filter(i=>i.status==='paid').length} paid invoices</div>
    </div>
    <div class="stat" title="${money(outstanding)}">
      <div class="stat-ic">⏳</div>
      <div class="stat-lbl">Outstanding</div>
      <div class="stat-val o">${moneyK(outstanding)}</div>
      <div class="stat-sub">${invs.filter(i=>['sent','unpaid'].includes(invStatus(i))).length} invoices</div>
    </div>
    <div class="stat" title="${money(overdueAmt)}">
      <div class="stat-ic">🚨</div>
      <div class="stat-lbl">Overdue</div>
      <div class="stat-val r">${moneyK(overdueAmt)}</div>
      <div class="stat-sub">${invs.filter(i=>invStatus(i)==='overdue').length} overdue</div>
    </div>
    <div class="stat" title="${money(netProfit)}">
      <div class="stat-ic">📈</div>
      <div class="stat-lbl">Net Profit</div>
      <div class="stat-val ${netProfit >= 0 ? 'g' : 'r'}">${moneyK(netProfit)}</div>
      <div class="stat-sub">After expenses</div>
    </div>
    <div class="stat">
      <div class="stat-ic">📁</div>
      <div class="stat-lbl">Active Projects</div>
      <div class="stat-val b">${activeProj}</div>
      <div class="stat-sub">${projs.length} total</div>
    </div>
    <div class="stat">
      <div class="stat-ic">⚡</div>
      <div class="stat-lbl">Overdue Tasks</div>
      <div class="stat-val ${overdueT > 0 ? 'r' : 'g'}">${overdueT}</div>
      <div class="stat-sub">${tasks.filter(t=>t.status!=='done').length} open</div>
    </div>
  </div>

  <div class="g2 mb4">
    <div class="card">
      <div class="card-hd">
        <div><div class="card-title">Revenue vs Expenses</div><div class="card-sub">Last 6 months</div></div>
        <div style="display:flex;gap:10px;font-size:11.5px;flex-shrink:0">
          <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--accent);border-radius:2px;display:inline-block"></span>Revenue</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--red-l);border:1px solid var(--red-b);border-radius:2px;display:inline-block"></span>Expenses</span>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-bars">
          ${months.map(m => `
            <div class="chart-col">
              <div style="flex:1;display:flex;align-items:flex-end;gap:2px;width:100%">
                <div class="chart-bar ${m.key===curKey?'cur':''}" style="flex:1;height:${Math.max(4,(m.rev/maxChart)*118)}px" title="${money(m.rev)}"></div>
                <div class="chart-bar exp" style="flex:1;height:${Math.max(4,(m.exp/maxChart)*118)}px" title="${money(m.exp)}"></div>
              </div>
              <div class="chart-lbl">${m.lbl}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-title">Invoice Status</div>
        ${canView('invoices') ? `<button class="btn btn-sm btn-secondary" onclick="nav('invoices')">View All</button>` : ''}
      </div>
      <div class="card-body">
        ${[
          { lbl:'Paid',        n:invs.filter(i=>i.status==='paid').length,                              cls:'g' },
          { lbl:'Outstanding', n:invs.filter(i=>['sent','unpaid'].includes(invStatus(i))).length,       cls:'o' },
          { lbl:'Overdue',     n:invs.filter(i=>invStatus(i)==='overdue').length,                       cls:'r' },
          { lbl:'Draft',       n:invs.filter(i=>i.status==='draft').length,                             cls:''  },
        ].map(r => {
          const pct = invs.length ? Math.round(r.n / invs.length * 100) : 0;
          return `<div class="mb3">
            <div class="flex items-c jc-b mb2">
              <span class="fw6 fs12">${r.lbl}</span>
              <span class="tc-m fs12">${r.n}</span>
            </div>
            <div class="prog"><div class="prog-fill ${r.cls}" style="width:${pct}%"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>

  <div class="g2">
    <div class="card">
      <div class="card-hd"><div class="card-title">Upcoming Deadlines</div></div>
      <div class="card-body p0">
        ${deadlines.length === 0 ? `<div class="empty"><div class="empty-ic">📅</div><p>No upcoming deadlines</p></div>` :
          deadlines.map(d => {
            const over = isOver(d.date);
            const icons = { project:'📁', task:'✅', invoice:'📄' };
            const cols  = { project:'blue', task:'green', invoice:'orange' };
            return `<div class="act-item" style="padding:9px 18px">
              <div class="act-ic" style="background:${over?'var(--red-l)':'var(--surface2)'};">${icons[d.type]}</div>
              <div class="act-txt">
                <div class="fw6" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px" title="${d.label}">${truncate(d.label, 30)}</div>
                <div style="font-size:11px;color:${over?'var(--red)':'var(--muted)'}">${over?'⚠ Overdue · ':''}${fmtDate(d.date)}</div>
              </div>
              <span class="badge b-${cols[d.type]||'gray'}">${d.type}</span>
            </div>`;
          }).join('')
        }
      </div>
    </div>
    <div class="card">
      <div class="card-hd"><div class="card-title">Recent Activity</div></div>
      <div class="card-body p0">
        ${(S.activity || []).length === 0 ? `<div class="empty"><p>No activity yet</p></div>` :
          (S.activity || []).slice(0, 6).map(a => `
            <div class="act-item" style="padding:9px 18px">
              <div class="act-ic">${a.icon}</div>
              <div class="act-txt">
                <span class="fw6">${truncate(a.entity, 24)}</span>
                <span class="tc-m"> ${a.action}</span>
              </div>
              <div class="act-time">${fmtShort(a.date)}</div>
            </div>`).join('')
        }
      </div>
    </div>
  </div>`;
}
