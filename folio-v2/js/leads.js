// FOLIO — Leads

const STAGES=[
  {id:'new',lbl:'New Lead',col:'gray'},
  {id:'contacted',lbl:'Contacted',col:'blue'},
  {id:'proposal',lbl:'Proposal Sent',col:'orange'},
  {id:'negotiation',lbl:'Negotiation',col:'purple'},
  {id:'won',lbl:'Won 🎉',col:'teal'},
  {id:'lost',lbl:'Lost',col:'red'},
];

function renderLeads(){
  if (!canView('leads')) { renderAccessDenied('leads'); return; }
  auditLog('leads', 'viewed', 'Leads page viewed', {});
  
  const leads=S.leads||[];
  const pipe=leads.filter(l=>!['won','lost'].includes(l.stage)).reduce((s,l)=>s+(parseFloat(l.value)||0)*((parseFloat(l.prob)||0)/100),0);
  const won=leads.filter(l=>l.stage==='won').reduce((s,l)=>s+(parseFloat(l.value)||0),0);

  document.getElementById('page-leads').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Sales Pipeline</h1><p>Weighted pipeline: ${money(pipe)} · Won: ${money(won)}</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="openLeadModal()">+ New Lead</button></div>
  </div>
  <div class="kanban" id="lead-kanban">
    ${STAGES.map(st=>{
      const stageLds=leads.filter(l=>l.stage===st.id);
      const stVal=stageLds.reduce((s,l)=>s+(parseFloat(l.value)||0),0);
      return`<div class="kb-col" data-stage="${st.id}" ondragover="event.preventDefault()" ondrop="dropLead(event,'${st.id}')">
        <div class="kb-hd">
          <div><div class="kb-title">${st.lbl}</div>${stVal>0?`<div style="font-size:10.5px;color:var(--muted);margin-top:1px">${money(stVal)}</div>`:''}</div>
          <span class="kb-count">${stageLds.length}</span>
        </div>
        <div class="kb-cards">
          ${stageLds.map(l=>`
            <div class="kb-card" draggable="true" ondragstart="dragLead(event,'${l.id}')" onclick="openLeadModal('${l.id}')">
              <div class="kb-ct">${l.name}</div>
              ${l.company?`<div style="font-size:11.5px;color:var(--muted);margin-bottom:5px">${l.company}</div>`:''}
              <div class="kb-meta">
                <span class="badge b-${st.col}">${money(l.value||0)}</span>
                <span style="font-size:11px;color:var(--muted)">${l.prob||0}%</span>
                ${l.followUp&&isOver(l.followUp)?'<span class="badge b-red">Follow up!</span>':''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

let dragLId=null;
function dragLead(e,id){dragLId=id;e.dataTransfer.effectAllowed='move'}
function dropLead(e,stage){e.preventDefault();if(!dragLId)return;const l=S.leads?.find(l=>l.id===dragLId);if(l){l.stage=stage;saveAppData();renderLeads()}dragLId=null}

let editLId=null;
function openLeadModal(id){
  editLId=id||null;
  const l=id?S.leads?.find(l=>l.id===id):null;
  showModal(`<div class="modal-ov"><div class="modal">
    <div class="modal-hd"><h2>${id?'Edit Lead':'New Lead'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid">
        <div class="fg"><label>Name <span class="req">*</span></label><input class="fc" id="l-name" value="${l?.name||''}"/></div>
        <div class="fg"><label>Company</label><input class="fc" id="l-co" value="${l?.company||''}"/></div>
        <div class="fg"><label>Email</label><input class="fc" id="l-em" value="${l?.email||''}"/></div>
        <div class="fg"><label>Phone</label><input class="fc" id="l-ph" value="${l?.phone||''}"/></div>
        <div class="fg"><label>Value ($)</label><input class="fc" type="number" id="l-val" value="${l?.value||''}"/></div>
        <div class="fg"><label>Probability (%)</label><input class="fc" type="number" id="l-prob" value="${l?.prob||50}" min="0" max="100"/></div>
        <div class="fg"><label>Stage</label><select class="fc" id="l-stage">${STAGES.map(s=>`<option value="${s.id}" ${(l?.stage||'new')===s.id?'selected':''}>${s.lbl}</option>`).join('')}</select></div>
        <div class="fg"><label>Source</label><select class="fc" id="l-src">${['Referral','LinkedIn','Website','Cold Outreach','Conference','Social Media','Other'].map(s=>`<option ${l?.source===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="fg"><label>Follow-up Date</label><input class="fc" type="date" id="l-fu" value="${l?.followUp||''}"/></div>
        <div class="fg s2"><label>Notes</label><textarea class="fc" id="l-notes">${l?.notes||''}</textarea></div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      ${id?`<button class="btn btn-danger" onclick="delLead('${id}')">Delete</button>`:''}
      <button class="btn btn-primary" onclick="saveLead()">Save Lead</button>
    </div>
  </div></div>`);
}

function saveLead(){
  const name=document.getElementById('l-name')?.value.trim();
  if(!name){toast('Name required','e');return}
  const lead={
    id:editLId||uid(),name,
    company:document.getElementById('l-co')?.value.trim(),
    email:document.getElementById('l-em')?.value.trim(),
    phone:document.getElementById('l-ph')?.value.trim(),
    value:parseFloat(document.getElementById('l-val')?.value)||0,
    prob:parseFloat(document.getElementById('l-prob')?.value)||0,
    stage:document.getElementById('l-stage')?.value,
    source:document.getElementById('l-src')?.value,
    followUp:document.getElementById('l-fu')?.value,
    notes:document.getElementById('l-notes')?.value.trim(),
    createdAt:editLId?(S.leads.find(l=>l.id===editLId)?.createdAt||today()):today(),
  };
  if(editLId){const i=S.leads.findIndex(l=>l.id===editLId);if(i>=0)S.leads[i]=lead;}
  else{S.leads.push(lead);logAct('lead','added',name,lead.id,'🎯')}
  saveAppData();closeModal();toast(editLId?'Lead updated':'Lead added','s');renderLeads();
}
function delLead(id){S.leads=S.leads.filter(l=>l.id!==id);saveAppData();closeModal();toast('Lead deleted');renderLeads()}

// ═══════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════
