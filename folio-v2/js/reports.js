// FOLIO — Reports

// ═══════════════════════════════════════════════════════
// REPORTS & ANALYTICS
// ═══════════════════════════════════════════════════════
function renderReports(){
  if (!canView('reports')) { renderAccessDenied('reports'); return; }
  auditLog('reports', 'viewed', 'Reports page viewed', {});
  
  const invs=S.invoices||[];const exps=S.expenses||[];
  const leads=S.leads||[];const quotes=S.quotes||[];

  const totalRev=invs.filter(i=>i.status==='paid').reduce((s,i)=>s+calcInv(i).total,0);
  const totalExp=exps.reduce((s,e)=>s+parseFloat(e.amount||0),0);
  const profit=totalRev-totalExp;
  const margin=totalRev>0?Math.round((profit/totalRev)*100):0;

  // 12 month chart
  const months=[];
  for(let i=11;i>=0;i--){
    const key=fmtMonKey(i);
    const rev=invs.filter(inv=>inv.status==='paid'&&inv.date?.startsWith(key)).reduce((s,inv)=>s+calcInv(inv).total,0);
    const exp=exps.filter(e=>e.date?.startsWith(key)).reduce((s,e)=>s+parseFloat(e.amount||0),0);
    months.push({key,lbl:fmtMonLabel(key),rev,exp,profit:rev-exp});
  }
  const maxV=Math.max(...months.map(m=>Math.max(m.rev,m.exp)),1);
  const curKey=fmtMonKey(0);

  // Revenue by client
  const byClient=(S.clients||[]).map(c=>({
    name:c.name,
    rev:invs.filter(i=>i.clientId===c.id&&i.status==='paid').reduce((s,i)=>s+calcInv(i).total,0)
  })).filter(c=>c.rev>0).sort((a,b)=>b.rev-a.rev);

  // Expenses by category
  const byCat={};
  exps.forEach(e=>{byCat[e.cat||'Other']=(byCat[e.cat||'Other']||0)+parseFloat(e.amount||0)});

  // Conversion stats
  const wonLeads=leads.filter(l=>l.stage==='won').length;
  const accQuotes=quotes.filter(q=>q.status==='accepted').length;
  const paidInvs=invs.filter(i=>i.status==='paid').length;

  document.getElementById('page-reports').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Reports & Analytics</h1><p>Financial overview and business intelligence</p></div>
    <div class="ph-right">
      <button class="btn btn-secondary" onclick="exportCSV()">⬇ Export CSV</button>
    </div>
  </div>

  <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-ic">💰</div><div class="stat-lbl">Total Revenue</div><div class="stat-val g">${moneyK(totalRev)}</div><div class="stat-sub">All paid invoices</div></div>
    <div class="stat"><div class="stat-ic">💸</div><div class="stat-lbl">Total Expenses</div><div class="stat-val r">${moneyK(totalExp)}</div><div class="stat-sub">All logged expenses</div></div>
    <div class="stat"><div class="stat-ic">📈</div><div class="stat-lbl">Net Profit</div><div class="stat-val ${profit>=0?'g':'r'}">${moneyK(profit)}</div><div class="stat-sub">Revenue minus expenses</div></div>
    <div class="stat"><div class="stat-ic">📊</div><div class="stat-lbl">Profit Margin</div><div class="stat-val b">${margin}%</div><div class="stat-sub">Of total revenue</div></div>
  </div>

  <div class="g2 mb4">
    <div class="card">
      <div class="card-hd">
        <div><div class="card-title">Revenue vs Expenses</div><div class="card-sub">12-month comparison</div></div>
        <div style="display:flex;gap:10px;font-size:11.5px">
          <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--accent);border-radius:2px;display:inline-block"></span>Revenue</span>
          <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--red-l);border:1px solid var(--red-b);border-radius:2px;display:inline-block"></span>Expenses</span>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-bars" style="height:150px">
          ${months.map(m=>`
            <div class="chart-col">
              <div style="flex:1;display:flex;align-items:flex-end;gap:2px;width:100%">
                <div class="chart-bar ${m.key===curKey?'cur':''}" style="flex:1;height:${Math.max(3,(m.rev/maxV)*138)}px" title="Rev: ${money(m.rev)}"></div>
                <div class="chart-bar exp" style="flex:1;height:${Math.max(3,(m.exp/maxV)*138)}px" title="Exp: ${money(m.exp)}"></div>
              </div>
              <div class="chart-lbl">${m.lbl}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-hd"><div class="card-title">Revenue by Client</div></div>
      <div class="card-body">
        ${byClient.length===0?`<div class="empty" style="padding:20px"><p>No paid invoices yet</p></div>`:
          byClient.map(c=>{
            const pct=totalRev>0?Math.round((c.rev/totalRev)*100):0;
            return`<div class="mb3">
              <div class="flex jc-b mb2"><span class="fw6 fs12">${c.name}</span><span class="fw6 fs12">${money(c.rev)}</span></div>
              <div class="prog"><div class="prog-fill" style="width:${pct}%"></div></div>
            </div>`;
          }).join('')}
      </div>
    </div>
  </div>

  <div class="g2 mb4">
    <div class="card">
      <div class="card-hd"><div class="card-title">Expenses by Category</div></div>
      <div class="card-body">
        ${Object.keys(byCat).length===0?`<div class="empty" style="padding:20px"><p>No expenses logged</p></div>`:
          Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
            const pct=totalExp>0?Math.round((amt/totalExp)*100):0;
            return`<div class="mb3">
              <div class="flex jc-b mb2"><span class="fw6 fs12">${cat}</span><span class="fw6 fs12 tc-r">−${money(amt)} (${pct}%)</span></div>
              <div class="prog"><div class="prog-fill r" style="width:${pct}%"></div></div>
            </div>`;
          }).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-hd"><div class="card-title">Conversion Rates</div></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:18px">
          ${[
            {lbl:'Quote Conversion',n:accQuotes,d:quotes.length,col:''},
            {lbl:'Lead Win Rate',n:wonLeads,d:leads.length,col:'g'},
            {lbl:'Invoice Collection',n:paidInvs,d:invs.length,col:'g'},
          ].map(r=>{
            const pct=r.d>0?Math.round((r.n/r.d)*100):0;
            return`<div>
              <div class="flex jc-b mb2"><span class="fw6 fs12">${r.lbl}</span><span class="fw7 fs12 ${r.col?'tc-'+r.col:'tc-b'}">${pct}%</span></div>
              <div class="prog"><div class="prog-fill ${r.col}" style="width:${pct}%"></div></div>
              <div class="fs11 tc-m" style="margin-top:3px">${r.n} of ${r.d}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd"><div class="card-title">Month-by-Month Financial Table</div></div>
    <div class="tbl-wrap">
      <table>
        <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Profit</th><th>Margin</th></tr></thead>
        <tbody>
          ${months.map(m=>`
            <tr>
              <td class="fw6">${m.lbl}</td>
              <td class="tc-g fw6">${money(m.rev)}</td>
              <td class="tc-r">${money(m.exp)}</td>
              <td class="${m.profit>=0?'tc-g':'tc-r'} fw6">${money(m.profit)}</td>
              <td>${m.rev>0?Math.round((m.profit/m.rev)*100)+'%':'—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function exportCSV(){
  const rows=[['Month','Revenue','Expenses','Profit','Margin']];
  for(let i=11;i>=0;i--){
    const key=fmtMonKey(i);
    const d=new Date(key+'-01');
    const lbl=d.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
    const rev=(S.invoices||[]).filter(inv=>inv.status==='paid'&&inv.date?.startsWith(key)).reduce((s,inv)=>s+calcInv(inv).total,0);
    const exp=(S.expenses||[]).filter(e=>e.date?.startsWith(key)).reduce((s,e)=>s+parseFloat(e.amount||0),0);
    const profit=rev-exp;
    rows.push([lbl,rev.toFixed(2),exp.toFixed(2),profit.toFixed(2),rev>0?((profit/rev)*100).toFixed(1)+'%':'0%']);
  }
  const csv=rows.map(r=>r.join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`folio-report-${today()}.csv`;a.click();
  toast('CSV exported','s');
}

// ═══════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════
