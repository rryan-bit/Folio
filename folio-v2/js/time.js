// FOLIO — Time

// ═══════════════════════════════════════════════════════
// TIME TRACKING
// ═══════════════════════════════════════════════════════
let timerInt=null;

function renderTime(){
  if (!canView('time')) { renderAccessDenied('time'); return; }
  auditLog('time', 'viewed', 'Time page viewed', {});
  
  const tes=S.timeEntries||[];
  const billMins=tes.filter(t=>t.billable).reduce((s,t)=>s+(t.duration||0),0);
  const billVal=tes.filter(t=>t.billable).reduce((s,t)=>s+((t.duration||0)/60)*(t.rate||0),0);
  const unbilled=tes.filter(t=>t.billable&&!t.billed).reduce((s,t)=>s+((t.duration||0)/60)*(t.rate||0),0);

  document.getElementById('page-time').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Time Tracking</h1><p>${fmtMins(billMins)} billable · ${money(billVal)} value · ${money(unbilled)} unbilled</p></div>
    <div class="ph-right"><button class="btn btn-secondary" onclick="openTimeModal()">+ Manual Entry</button></div>
  </div>
  <div class="card mb4">
    <div class="card-body">
      <div class="timer-w ${S.timer?.running?'timer-running':''}" id="timer-widget">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:2px;text-transform:uppercase;letter-spacing:.08em">${S.timer?.running?'● Recording':'Timer'}</div>
          <div class="timer-d" id="timer-display">${fmtSecs(S.timer?.secs||0)}</div>
        </div>
        <div style="flex:1;padding:0 14px">
          <input class="fc" id="timer-desc" placeholder="What are you working on?" value="${S.timer?.desc||''}" style="margin-bottom:6px" oninput="S.timer.desc=this.value"/>
          <div class="flex gap2">
            <select class="fc" id="timer-proj" onchange="S.timer.projectId=this.value" style="flex:1">
              <option value="">— Project —</option>
              ${(S.projects||[]).map(p=>`<option value="${p.id}" ${S.timer?.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}
            </select>
            <select class="fc" id="timer-cl" onchange="S.timer.clientId=this.value" style="flex:1">
              <option value="">— Client —</option>
              ${(S.clients||[]).map(c=>`<option value="${c.id}" ${S.timer?.clientId===c.id?'selected':''}>${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="flex gap2">
          ${S.timer?.running
            ?`<button class="btn btn-danger" onclick="stopTimer()" style="min-width:78px">⏹ Stop</button>`
            :`<button class="btn btn-success" onclick="startTimer()" style="min-width:78px">▶ Start</button>`}
        </div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-hd"><div class="card-title">Time Entries</div></div>
    ${tes.length===0?`<div class="empty"><div class="empty-ic">⏱</div><h3>No time entries</h3><p>Start the timer or add a manual entry.</p></div>`:`
    <div class="tbl-wrap"><table>
      <thead><tr><th>Description</th><th>Project</th><th>Client</th><th>Date</th><th>Duration</th><th>Rate</th><th>Value</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${[...tes].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(te=>{
          const val=((te.duration||0)/60)*(te.rate||0);
          return`<tr>
            <td class="td-bold">${te.desc||'—'}</td>
            <td class="td-muted">${projName(te.projectId)}</td>
            <td class="td-muted">${clientName(te.clientId)}</td>
            <td class="td-muted">${fmtShort(te.date)}</td>
            <td class="td-mono fw6">${fmtMins(te.duration||0)}</td>
            <td class="td-mono">${te.rate?money(te.rate)+'/hr':'—'}</td>
            <td class="fw6 ${te.billable?'tc-g':'tc-m'}">${te.billable?money(val):'—'}</td>
            <td>${te.billable?`<span class="badge ${te.billed?'b-gray':'b-green'}">${te.billed?'Billed':'Unbilled'}</span>`:`<span class="badge b-gray">Non-bill</span>`}</td>
            <td><div class="flex gap1">
              <button class="btn btn-xs btn-secondary" onclick="openTimeModal('${te.id}')">Edit</button>
              <button class="btn btn-xs btn-danger" onclick="delTE('${te.id}')">Del</button>
            </div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`}
  </div>`;
  if(S.timer?.running)startTimerDisplay();
}

function startTimer(){
  S.timer.running=true;S.timer.startedAt=Date.now()-(S.timer.secs||0)*1000;
  S.timer.desc=document.getElementById('timer-desc')?.value||'';
  S.timer.projectId=document.getElementById('timer-proj')?.value||null;
  S.timer.clientId=document.getElementById('timer-cl')?.value||null;
  startTimerDisplay();renderTime();
}
function startTimerDisplay(){
  if(timerInt)clearInterval(timerInt);
  timerInt=setInterval(()=>{
    const el=S.timer?.startedAt?Math.floor((Date.now()-S.timer.startedAt)/1000):0;
    S.timer.secs=el;
    const d=document.getElementById('timer-display');
    if(d)d.textContent=fmtSecs(el);
  },1000);
}
function stopTimer(){
  if(timerInt){clearInterval(timerInt);timerInt=null}
  const mins=Math.round((S.timer.secs||0)/60);
  if(mins>0){
    const proj=S.projects?.find(p=>p.id===S.timer.projectId);
    const te={id:uid(),desc:S.timer.desc||'Timed session',projectId:S.timer.projectId||null,clientId:S.timer.clientId||null,date:today(),duration:mins,billable:true,rate:proj?.rate||0,billed:false};
    if(!S.timeEntries)S.timeEntries=[];
    S.timeEntries.push(te);saveAppData();toast(`${fmtMins(mins)} saved`,'s');
  }
  S.timer={running:false,startedAt:null,secs:0,projectId:null,clientId:null,desc:''};
  renderTime();
}

let editTEId=null;
function openTimeModal(id){
  editTEId=id||null;
  const te=id?S.timeEntries?.find(t=>t.id===id):null;
  showModal(`<div class="modal-ov"><div class="modal">
    <div class="modal-hd"><h2>${id?'Edit Entry':'Manual Time Entry'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid">
        <div class="fg s2"><label>Description</label><input class="fc" id="te-desc" value="${te?.desc||''}"/></div>
        <div class="fg"><label>Project</label><select class="fc" id="te-proj"><option value="">—</option>${(S.projects||[]).map(p=>`<option value="${p.id}" ${te?.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Client</label><select class="fc" id="te-cl"><option value="">—</option>${(S.clients||[]).map(c=>`<option value="${c.id}" ${te?.clientId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Date</label><input class="fc" type="date" id="te-date" value="${te?.date||today()}"/></div>
        <div class="fg"><label>Duration (minutes)</label><input class="fc" type="number" id="te-dur" value="${te?.duration||60}" min="1"/></div>
        <div class="fg"><label>Hourly Rate ($)</label><input class="fc" type="number" id="te-rate" value="${te?.rate||0}"/></div>
        <div class="fg"><label>Billable?</label><select class="fc" id="te-bill"><option value="true" ${te?.billable!==false?'selected':''}>Billable</option><option value="false" ${te?.billable===false?'selected':''}>Non-billable</option></select></div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      ${id?`<button class="btn btn-danger" onclick="delTE('${id}');closeModal()">Delete</button>`:''}
      <button class="btn btn-primary" onclick="saveTE()">Save</button>
    </div>
  </div></div>`);
}
function saveTE(){
  const te={id:editTEId||uid(),desc:document.getElementById('te-desc')?.value.trim(),projectId:document.getElementById('te-proj')?.value||null,clientId:document.getElementById('te-cl')?.value||null,date:document.getElementById('te-date')?.value,duration:parseInt(document.getElementById('te-dur')?.value)||0,rate:parseFloat(document.getElementById('te-rate')?.value)||0,billable:document.getElementById('te-bill')?.value!=='false',billed:false};
  if(!S.timeEntries)S.timeEntries=[];
  if(editTEId){const i=S.timeEntries.findIndex(t=>t.id===editTEId);if(i>=0)S.timeEntries[i]=te;}
  else S.timeEntries.push(te);
  saveAppData();closeModal();toast('Entry saved','s');renderTime();
}
function delTE(id){S.timeEntries=S.timeEntries.filter(t=>t.id!==id);saveAppData();renderTime();toast('Deleted')}

// ═══════════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════════
