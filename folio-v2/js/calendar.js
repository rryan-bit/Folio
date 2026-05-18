// FOLIO — Calendar

let calDate=new Date();

function getCalEvents(){
  const evs=[];
  (S.invoices||[]).filter(i=>i.due&&['sent','unpaid'].includes(invStatus(i))).forEach(i=>evs.push({date:i.due,label:i.number+' due',type:'invoice',icon:'📄',color:'#ea580c'}));
  (S.invoices||[]).filter(i=>invStatus(i)==='overdue').forEach(i=>evs.push({date:i.due,label:'⚠ '+i.number+' OVERDUE',type:'overdue',icon:'🚨',color:'#dc2626'}));
  (S.projects||[]).filter(p=>p.status==='active'&&p.deadline).forEach(p=>evs.push({date:p.deadline,label:p.name+' deadline',type:'project',icon:'📁',color:'#2d5be3'}));
  (S.tasks||[]).filter(t=>t.status!=='done'&&t.due).forEach(t=>evs.push({date:t.due,label:t.title,type:'task',icon:'✅',color:'#16a34a'}));
  (S.leads||[]).filter(l=>l.followUp).forEach(l=>evs.push({date:l.followUp,label:'Follow up: '+l.name,type:'lead',icon:'🎯',color:'#7c3aed'}));
  (S.quotes||[]).filter(q=>q.expiry&&['sent','draft'].includes(q.status)).forEach(q=>evs.push({date:q.expiry,label:q.number+' expires',type:'quote',icon:'📋',color:'#d97706'}));
  return evs;
}

function renderCalendar(){
  if (!canView('calendar')) { renderAccessDenied('calendar'); return; }
  auditLog('calendar', 'viewed', 'Calendar page viewed', {});
  
  const evs=getCalEvents();
  const year=calDate.getFullYear();
  const month=calDate.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthName=calDate.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
  const t=today();

  // Upcoming events (next 30 days)
  const upcoming=evs.filter(e=>e.date>=t&&e.date<=addDays(t,30)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8);

  document.getElementById('page-calendar').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Calendar</h1><p>Deadlines, due dates, and follow-ups</p></div>
    <div class="ph-right">
      <button class="btn btn-secondary" onclick="calDate.setMonth(calDate.getMonth()-1);renderCalendar()">← Prev</button>
      <span style="font-size:14px;font-weight:700;padding:0 8px;min-width:160px;text-align:center;display:inline-block">${monthName}</span>
      <button class="btn btn-secondary" onclick="calDate.setMonth(calDate.getMonth()+1);renderCalendar()">Next →</button>
      <button class="btn btn-ghost btn-sm" onclick="calDate=new Date();renderCalendar()">Today</button>
    </div>
  </div>
  <div class="card mb4">
    <div class="card-body" style="padding:14px">
      <div class="cal-grid" style="margin-bottom:6px">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-dh">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">
        ${Array(firstDay===0?0:firstDay).fill(0).map(()=>'<div class="cal-day other"></div>').join('')}
        ${Array.from({length:daysInMonth},(_,i)=>{
          const day=i+1;
          const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayEvs=evs.filter(e=>e.date===ds);
          const isT=ds===t;
          return`<div class="cal-day${isT?' today':''}">
            <div class="cal-dn" style="color:${isT?'var(--accent)':'var(--text)'};font-weight:${isT?'800':'600'}">${day}</div>
            ${dayEvs.slice(0,3).map(e=>`<div class="cal-ev" style="background:${e.color}" title="${e.label}">${e.label}</div>`).join('')}
            ${dayEvs.length>3?`<div style="font-size:9px;color:var(--muted)">+${dayEvs.length-3} more</div>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="card-hd"><div class="card-title">Upcoming (Next 30 Days)</div></div>
      <div class="card-body p0">
        ${upcoming.length===0?`<div class="empty"><p>No upcoming events</p></div>`:
          upcoming.map(e=>`
            <div class="act-item" style="padding:9px 18px">
              <div class="act-ic" style="background:${e.color}22;color:${e.color}">${e.icon}</div>
              <div class="act-txt"><div class="fw6">${e.label}</div><div class="fs11 tc-m">${e.type} · ${fmtDate(e.date)}</div></div>
              <span class="badge" style="background:${isOver(e.date)?'var(--red-l)':'var(--accent-l)'};color:${isOver(e.date)?'var(--red)':'var(--accent)'}">${fmtShort(e.date)}</span>
            </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-hd"><div class="card-title">Overdue Items</div></div>
      <div class="card-body p0">
        ${evs.filter(e=>isOver(e.date)).length===0?`<div class="empty"><div style="font-size:28px;margin-bottom:8px">🎉</div><p>Nothing overdue! Great work.</p></div>`:
          evs.filter(e=>isOver(e.date)).slice(0,6).map(e=>`
            <div class="act-item" style="padding:9px 18px">
              <div class="act-ic" style="background:var(--red-l);color:var(--red)">${e.icon}</div>
              <div class="act-txt"><div class="fw6">${e.label}</div><div class="fs11 tc-r">Overdue since ${fmtDate(e.date)}</div></div>
            </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════
