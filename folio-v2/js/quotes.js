// FOLIO — Quotes

let qLineItems=[];
let editQId=null;

function renderQuotes(){
  if (!canView('quotes')) { renderAccessDenied('quotes'); return; }
  auditLog('quotes', 'viewed', 'Quotes page viewed', {});
  
  const quotes=S.quotes||[];
  const accVal=quotes.filter(q=>q.status==='accepted').reduce((s,q)=>s+calcInv(q).total,0);

  document.getElementById('page-quotes').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Quotes & Proposals</h1><p>${quotes.length} total · ${money(accVal)} accepted</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="openQuoteModal()">+ New Quote</button></div>
  </div>
  <div class="card">
    ${quotes.length===0?`<div class="empty"><div class="empty-ic">📋</div><h3>No quotes yet</h3><p>Create a quote or proposal to win new business.</p><button class="btn btn-primary" onclick="openQuoteModal()">+ Create Quote</button></div>`:`
    <div class="tbl-wrap"><table>
      <thead><tr><th>Quote #</th><th>Client / Lead</th><th>Date</th><th>Expiry</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${[...quotes].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(q=>{
          const c=calcInv(q);
          const clOrLead=q.clientId?clientName(q.clientId):(S.leads?.find(l=>l.id===q.leadId)?.name||'—');
          const sbadge={draft:'b-gray',sent:'b-blue',accepted:'b-teal',declined:'b-red',expired:'b-amber'};
          return`<tr>
            <td class="td-bold td-mono">${q.number}</td>
            <td>${clOrLead}</td>
            <td class="td-muted">${fmtDate(q.date)}</td>
            <td class="td-muted">${fmtDate(q.expiry)}</td>
            <td class="fw6">${money(c.total)}</td>
            <td><span class="badge ${sbadge[q.status]||'b-gray'}">${q.status}</span></td>
            <td><div class="flex gap1">
              ${q.status==='accepted'?`<button class="btn btn-xs btn-success" onclick="q2inv('${q.id}')">→ Invoice</button>`:''}
              <button class="btn btn-xs btn-secondary" onclick="openQuoteModal('${q.id}')">Edit</button>
              <button class="btn btn-xs btn-secondary" onclick="exportPDF('${q.id}','quote')">PDF</button>
              <button class="btn btn-xs btn-danger" onclick="delQuote('${q.id}')">Del</button>
            </div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`}
  </div>`;
}

function openQuoteModal(id){
  editQId=id||null;
  const q=id?S.quotes?.find(q=>q.id===id):null;
  qLineItems=q?(q.items||[]).map(i=>({...i})):[{id:uid(),desc:'',qty:1,rate:''}];
  const num=q?.number||`${S.settings.quotePrefix||'QUO'}-${String(S.settings.nextQuote||1).padStart(3,'0')}`;

  showModal(`<div class="modal-ov"><div class="modal xl">
    <div class="modal-hd"><h2>${id?'Edit Quote':'New Quote'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid" style="margin-bottom:14px">
        <div class="fg"><label>Client</label><select class="fc" id="q-cl"><option value="">— Select —</option>${(S.clients||[]).map(c=>`<option value="${c.id}" ${q?.clientId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Quote #</label><input class="fc" id="q-num" value="${num}"/></div>
        <div class="fg"><label>Status</label><select class="fc" id="q-st">${['draft','sent','accepted','declined','expired'].map(s=>`<option value="${s}" ${(q?.status||'draft')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
        <div class="fg"><label>Issue Date</label><input class="fc" type="date" id="q-date" value="${q?.date||today()}"/></div>
        <div class="fg"><label>Expiry Date</label><input class="fc" type="date" id="q-exp" value="${q?.expiry||addDays(today(),30)}"/></div>
        <div class="fg"><label>Tax Rate (%)</label><input class="fc" type="number" id="q-tax" value="${q?.taxRate??S.settings.taxRate??10}" oninput="updateQTotals()"/></div>
        <div class="fg"><label>Discount (%)</label><input class="fc" type="number" id="q-disc" value="${q?.discount||0}" oninput="updateQTotals()"/></div>
        <div class="fg s2"><label>Notes</label><input class="fc" id="q-notes" value="${q?.notes||''}"/></div>
      </div>
      <hr class="sec-div"/>
      <div class="flex jc-b items-c mb3"><label class="form-label" style="margin:0">Line Items</label><button class="btn btn-xs btn-secondary" onclick="addQLI()">+ Add Row</button></div>
      <div class="li-wrap mb3"><table>
        <thead><tr><th style="width:42%">Description</th><th style="width:12%">Qty</th><th style="width:18%">Rate ($)</th><th style="width:18%">Amount</th><th style="width:8%"></th></tr></thead>
        <tbody id="q-li-body"></tbody>
      </table></div>
      <div class="inv-totals" id="q-totals"></div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      ${id?`<button class="btn btn-danger" onclick="delQuote('${id}');closeModal()">Delete</button>`:''}
      <button class="btn btn-primary" onclick="saveQuote()">Save Quote</button>
    </div>
  </div></div>`);
  renderQLI();
}

function renderQLI(){
  const body=document.getElementById('q-li-body');if(!body)return;
  body.innerHTML=qLineItems.map((li,i)=>`
    <tr>
      <td><input type="text" value="${li.desc||''}" oninput="qLineItems[${i}].desc=this.value"/></td>
      <td><input type="number" value="${li.qty||1}" min="0" oninput="qLineItems[${i}].qty=this.value;updateQTotals()"/></td>
      <td><input type="number" value="${li.rate||''}" min="0" step="0.01" placeholder="0.00" oninput="qLineItems[${i}].rate=this.value;updateQTotals()"/></td>
      <td style="font-weight:600;padding:7px 10px;font-family:'JetBrains Mono',monospace;font-size:12px">${money((parseFloat(li.qty)||0)*(parseFloat(li.rate)||0))}</td>
      <td><button onclick="remQLI(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:3px 8px">✕</button></td>
    </tr>`).join('');
  updateQTotals();
}
function addQLI(){qLineItems.push({id:uid(),desc:'',qty:1,rate:''});renderQLI()}
function remQLI(i){qLineItems.splice(i,1);renderQLI()}
function updateQTotals(){
  const sub=qLineItems.reduce((s,li)=>s+(parseFloat(li.qty)||0)*(parseFloat(li.rate)||0),0);
  const tr=parseFloat(document.getElementById('q-tax')?.value)||0;
  const dr=parseFloat(document.getElementById('q-disc')?.value)||0;
  const disc=sub*(dr/100);const after=sub-disc;const tax=after*(tr/100);const total=after+tax;
  const el=document.getElementById('q-totals');
  if(el)el.innerHTML=`
    <div class="tot-row"><span class="tl">Subtotal</span><span class="tv">${money(sub)}</span></div>
    ${dr>0?`<div class="tot-row"><span class="tl">Discount (${dr}%)</span><span class="tv tc-r">−${money(disc)}</span></div>`:''}
    <div class="tot-row"><span class="tl">Tax (${tr}%)</span><span class="tv">${money(tax)}</span></div>
    <div class="tot-row grand"><span class="tl">Total</span><span class="tv">${money(total)}</span></div>`;
}

function saveQuote(){
  const quote={
    id:editQId||uid(),number:document.getElementById('q-num')?.value.trim(),
    clientId:document.getElementById('q-cl')?.value||null,
    status:document.getElementById('q-st')?.value||'draft',
    date:document.getElementById('q-date')?.value,
    expiry:document.getElementById('q-exp')?.value,
    taxRate:parseFloat(document.getElementById('q-tax')?.value)||0,
    discount:parseFloat(document.getElementById('q-disc')?.value)||0,
    notes:document.getElementById('q-notes')?.value.trim(),
    items:qLineItems.map(li=>({...li})),
  };
  if(!S.quotes)S.quotes=[];
  if(editQId){const i=S.quotes.findIndex(q=>q.id===editQId);if(i>=0)S.quotes[i]=quote;}
  else{S.quotes.push(quote);S.settings.nextQuote=(S.settings.nextQuote||1)+1;logAct('quote','created',quote.number,quote.id,'📋')}
  saveAppData();closeModal();toast(editQId?'Quote updated':'Quote created','s');renderQuotes();
}
function delQuote(id){S.quotes=S.quotes.filter(q=>q.id!==id);saveAppData();renderQuotes();toast('Quote deleted')}
function q2inv(id){
  const q=S.quotes?.find(q=>q.id===id);if(!q)return;
  const num=`${S.settings.invPrefix||'INV'}-${String(S.settings.nextInv||1).padStart(3,'0')}`;
  const inv={id:uid(),number:num,clientId:q.clientId,projectId:null,status:'draft',date:today(),due:addDays(today(),S.settings.payTerms||14),taxRate:q.taxRate,discount:q.discount,notes:q.notes,items:(q.items||[]).map(li=>({...li,id:uid()})),payments:[]};
  if(!S.invoices)S.invoices=[];
  S.invoices.push(inv);S.settings.nextInv=(S.settings.nextInv||1)+1;
  saveAppData();toast(`Converted to ${num}`,'s');nav('invoices');
}

// ═══════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════
