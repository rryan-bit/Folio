// FOLIO — Projects

let projQ='',projStatusF='';
function renderProjects(){
  if (!canView('projects')) { renderAccessDenied('projects'); return; }
  auditLog('projects', 'viewed', 'Projects page viewed', {});
  
  let list=S.projects||[];
  if(projQ)list=list.filter(p=>p.name.toLowerCase().includes(projQ)||clientName(p.clientId).toLowerCase().includes(projQ));
  if(projStatusF)list=list.filter(p=>p.status===projStatusF);

  document.getElementById('page-projects').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Projects</h1><p>${S.projects?.filter(p=>p.status==='active').length||0} active · ${S.projects?.filter(p=>p.status==='complete').length||0} complete</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="openProjModal()">+ New Project</button></div>
  </div>
  <div class="filters">
    <div class="fsearch"><span>🔍</span><input placeholder="Search projects…" value="${projQ}" oninput="projQ=this.value.toLowerCase();renderProjects()"/></div>
    <select class="fsel" onchange="projStatusF=this.value;renderProjects()">
      <option value="">All Status</option>
      <option value="active">Active</option><option value="complete">Complete</option><option value="paused">Paused</option>
    </select>
  </div>
  <div class="g-auto">
    ${list.length===0?`<div class="card" style="grid-column:1/-1"><div class="empty"><div class="empty-ic">📁</div><h3>No projects yet</h3><p>Create a project to start tracking your work.</p><button class="btn btn-primary" onclick="openProjModal()">+ New Project</button></div></div>`:''}
    ${list.map(p=>{
      const days=p.deadline?Math.ceil((new Date(p.deadline)-new Date())/86400000):null;
      const timeL=(S.timeEntries||[]).filter(t=>t.projectId===p.id).reduce((s,t)=>s+(t.duration||0),0);
      const scol={active:'blue',complete:'green',paused:'gray'};
      const pcol={high:'red',medium:'orange',low:'gray'};
      return`<div class="card" style="cursor:pointer" onclick="openProjModal('${p.id}')">
        <div class="card-body">
          <div class="flex jc-b mb2"><span class="badge b-${scol[p.status]||'gray'}">${p.status}</span><span class="badge b-${pcol[p.priority]||'gray'}">${p.priority||'medium'}</span></div>
          <div style="font-size:14.5px;font-weight:700;margin-bottom:3px;letter-spacing:-.01em">${p.name}</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:11px">${clientName(p.clientId)}</div>
          <div class="mb3">
            <div class="flex jc-b fs12 mb2"><span class="tc-m">Progress</span><span class="fw6">${p.progress||0}%</span></div>
            <div class="prog"><div class="prog-fill ${(p.progress||0)>=100?'g':''}" style="width:${p.progress||0}%"></div></div>
          </div>
          <div class="flex jc-b fs12 tc-m">
            <span>💰 ${money(p.budget||0)}</span>
            <span>⏱ ${fmtMins(timeL)}</span>
            <span style="color:${days!==null&&days<0?'var(--red)':days!==null&&days<=7?'var(--orange)':'var(--muted)'}">${days===null?'—':days<0?`${Math.abs(days)}d over`:`${days}d left`}</span>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

let editPId=null;
function openProjModal(id){
  editPId=id||null;
  const p=id?S.projects?.find(p=>p.id===id):null;
  showModal(`<div class="modal-ov"><div class="modal lg">
    <div class="modal-hd"><h2>${id?'Edit Project':'New Project'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid">
        <div class="fg s2"><label>Project Name <span class="req">*</span></label><input class="fc" id="p-name" value="${p?.name||''}"/></div>
        <div class="fg"><label>Client</label><select class="fc" id="p-cl"><option value="">— No client —</option>${(S.clients||[]).map(c=>`<option value="${c.id}" ${p?.clientId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Status</label><select class="fc" id="p-st">${['active','complete','paused'].map(s=>`<option value="${s}" ${(p?.status||'active')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
        <div class="fg"><label>Priority</label><select class="fc" id="p-pri">${['high','medium','low'].map(s=>`<option value="${s}" ${(p?.priority||'medium')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
        <div class="fg"><label>Progress (%)</label><input class="fc" type="number" id="p-prog" value="${p?.progress||0}" min="0" max="100"/></div>
        <div class="fg"><label>Start Date</label><input class="fc" type="date" id="p-start" value="${p?.start||today()}"/></div>
        <div class="fg"><label>Deadline</label><input class="fc" type="date" id="p-dead" value="${p?.deadline||''}"/></div>
        <div class="fg"><label>Budget ($)</label><input class="fc" type="number" id="p-bud" value="${p?.budget||''}"/></div>
        <div class="fg"><label>Hourly Rate ($/hr)</label><input class="fc" type="number" id="p-rate" value="${p?.rate||''}"/></div>
        <div class="fg s2"><label>Description</label><textarea class="fc" id="p-desc">${p?.desc||''}</textarea></div>
        <div class="fg s2"><label>Notes</label><textarea class="fc" id="p-notes" rows="2">${p?.notes||''}</textarea></div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      ${id?`<button class="btn btn-danger" onclick="delProj('${id}')">Delete</button>`:''}
      <button class="btn btn-primary" onclick="saveProj()">Save Project</button>
    </div>
  </div></div>`);
}

function saveProj(){
  const name=document.getElementById('p-name')?.value.trim();
  if(!name){toast('Project name required','e');return}
  const proj={
    id:editPId||uid(),name,
    clientId:document.getElementById('p-cl')?.value||null,
    status:document.getElementById('p-st')?.value,
    priority:document.getElementById('p-pri')?.value,
    progress:parseFloat(document.getElementById('p-prog')?.value)||0,
    start:document.getElementById('p-start')?.value,
    deadline:document.getElementById('p-dead')?.value,
    budget:parseFloat(document.getElementById('p-bud')?.value)||0,
    rate:parseFloat(document.getElementById('p-rate')?.value)||0,
    desc:document.getElementById('p-desc')?.value.trim(),
    notes:document.getElementById('p-notes')?.value.trim(),
  };
  if(editPId){const i=S.projects.findIndex(p=>p.id===editPId);if(i>=0)S.projects[i]=proj;}
  else{S.projects.push(proj);logAct('project','created',name,proj.id,'📁')}
  saveAppData();closeModal();toast(editPId?'Project updated':'Project created','s');renderProjects();
}
function delProj(id){confirm2('Delete this project?',()=>{S.projects=S.projects.filter(p=>p.id!==id);saveAppData();closeModal();toast('Project deleted');renderProjects()})}

// ═══════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════
