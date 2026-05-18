// FOLIO — Clients

// ═══════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════
let clientQ='',clientStatusF='';
function renderClients(){
  if (!canView('clients')) { renderAccessDenied('clients'); return; }
  auditLog('clients', 'viewed', 'Clients page viewed', {});
  
  let list=S.clients||[];
  if(clientQ)list=list.filter(c=>c.name.toLowerCase().includes(clientQ)||c.email?.toLowerCase().includes(clientQ)||c.company?.toLowerCase().includes(clientQ));
  if(clientStatusF)list=list.filter(c=>c.status===clientStatusF);

  document.getElementById('page-clients').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Clients</h1><p>${S.clients?.length||0} total · ${S.clients?.filter(c=>c.status==='active').length||0} active</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="openClientModal()">+ New Client</button></div>
  </div>
  <div class="filters">
    <div class="fsearch"><span>🔍</span><input placeholder="Search clients…" value="${clientQ}" oninput="clientQ=this.value.toLowerCase();renderClients()"/></div>
    <select class="fsel" onchange="clientStatusF=this.value;renderClients()">
      <option value="">All Status</option>
      <option value="active" ${clientStatusF==='active'?'selected':''}>Active</option>
      <option value="inactive" ${clientStatusF==='inactive'?'selected':''}>Inactive</option>
    </select>
  </div>
  <div class="card">
    ${list.length===0?`<div class="empty"><div class="empty-ic">👥</div><h3>No clients yet</h3><p>Add your first client to start managing relationships.</p><button class="btn btn-primary" onclick="openClientModal()">+ Add Client</button></div>`:`
    <div class="tbl-wrap"><table>
      <thead><tr><th>Client</th><th>Email</th><th>Phone</th><th>Lifetime Value</th><th>Invoices</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${list.map(c=>{
          const cInvs=S.invoices?.filter(i=>i.clientId===c.id)||[];
          const lv=cInvs.filter(i=>i.status==='paid').reduce((s,i)=>s+calcInv(i).total,0);
          return`<tr>
            <td><div class="flex items-c gap2">${avEl(c.name,'sm')}<div><div class="td-bold">${c.name}</div>${c.company?`<div class="td-muted">${c.company}</div>`:''}</div></div></td>
            <td class="td-muted">${c.email||'—'}</td>
            <td class="td-muted">${c.phone||'—'}</td>
            <td class="fw6 tc-g">${money(lv)}</td>
            <td>${cInvs.length}</td>
            <td>${statusBadge(c.status||'active')}</td>
            <td><div class="flex gap1">
              <button class="btn btn-xs btn-secondary" onclick="openClientModal('${c.id}')">Edit</button>
              <button class="btn btn-xs btn-danger" onclick="delClient('${c.id}')">Del</button>
            </div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`}
  </div>`;
}

let editCId=null;
function openClientModal(id){
  editCId=id||null;
  const c=id?S.clients.find(c=>c.id===id):null;
  showModal(`<div class="modal-ov"><div class="modal">
    <div class="modal-hd"><h2>${id?'Edit Client':'New Client'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid">
        <div class="fg"><label>Name <span class="req">*</span></label><input class="fc" id="c-name" value="${c?.name||''}"/></div>
        <div class="fg"><label>Company</label><input class="fc" id="c-co" value="${c?.company||''}"/></div>
        <div class="fg"><label>Email</label><input class="fc" id="c-em" value="${c?.email||''}"/></div>
        <div class="fg"><label>Phone</label><input class="fc" id="c-ph" value="${c?.phone||''}"/></div>
        <div class="fg"><label>Website</label><input class="fc" id="c-web" value="${c?.website||''}"/></div>
        <div class="fg"><label>Currency</label><select class="fc" id="c-cur">${['AUD','USD','GBP','EUR','NZD','CAD'].map(x=>`<option ${(c?.currency||'AUD')===x?'selected':''}>${x}</option>`).join('')}</select></div>
        <div class="fg"><label>Status</label><select class="fc" id="c-st"><option value="active" ${(c?.status||'active')==='active'?'selected':''}>Active</option><option value="inactive" ${c?.status==='inactive'?'selected':''}>Inactive</option></select></div>
        <div class="fg"><label>Tags (comma sep.)</label><input class="fc" id="c-tags" value="${(c?.tags||[]).join(', ')}"/></div>
        <div class="fg s2"><label>Address</label><input class="fc" id="c-addr" value="${c?.address||''}"/></div>
        <div class="fg s2"><label>Notes</label><textarea class="fc" id="c-notes">${c?.notes||''}</textarea></div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveClient()">Save Client</button>
    </div>
  </div></div>`);
}

function saveClient(){
  const name=document.getElementById('c-name')?.value.trim();
  if(!name){toast('Name required','e');return}
  const cl={
    id:editCId||uid(),name,
    company:document.getElementById('c-co')?.value.trim(),
    email:document.getElementById('c-em')?.value.trim(),
    phone:document.getElementById('c-ph')?.value.trim(),
    website:document.getElementById('c-web')?.value.trim(),
    address:document.getElementById('c-addr')?.value.trim(),
    currency:document.getElementById('c-cur')?.value,
    status:document.getElementById('c-st')?.value,
    tags:document.getElementById('c-tags')?.value.split(',').map(t=>t.trim()).filter(Boolean),
    notes:document.getElementById('c-notes')?.value.trim(),
    createdAt:editCId?(S.clients.find(c=>c.id===editCId)?.createdAt||today()):today(),
  };
  if(editCId){const i=S.clients.findIndex(c=>c.id===editCId);if(i>=0)S.clients[i]=cl;}
  else{S.clients.push(cl);logAct('client','added',name,cl.id,'👤')}
  saveAppData();closeModal();toast(editCId?'Client updated':'Client added','s');renderClients();
}
function delClient(id){
  confirm2('Delete this client?',()=>{
    S.clients=S.clients.filter(c=>c.id!==id);
    saveAppData();renderClients();toast('Client deleted');
  });
}

// ═══════════════════════════════════════════════════════
// LEADS / PIPELINE
// ═══════════════════════════════════════════════════════
