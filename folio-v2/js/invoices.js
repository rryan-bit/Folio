// FOLIO — Invoices

let invQ='',invStatusF='';
let invLineItems=[];

function renderInvoices(){
  if (!canView('invoices')) { renderAccessDenied('invoices'); return; }
  auditLog('invoices', 'viewed', 'Invoices page viewed', {});
  
  let list=S.invoices||[];
  if(invQ)list=list.filter(i=>i.number.toLowerCase().includes(invQ)||clientName(i.clientId).toLowerCase().includes(invQ));
  if(invStatusF)list=list.filter(i=>invStatus(i)===invStatusF);

  const stats={
    paid:list.filter(i=>i.status==='paid').reduce((s,i)=>s+calcInv(i).total,0),
    outstanding:list.filter(i=>['sent','unpaid'].includes(invStatus(i))).reduce((s,i)=>s+calcInv(i).balance,0),
    overdue:list.filter(i=>invStatus(i)==='overdue').reduce((s,i)=>s+calcInv(i).balance,0),
  };

  document.getElementById('page-invoices').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Invoices</h1><p>${S.invoices?.length||0} total · ${money(stats.paid)} paid · ${money(stats.outstanding)} outstanding</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="openInvModal()">+ New Invoice</button></div>
  </div>
  ${stats.overdue>0?`<div class="alert alert-err mb4">🚨 <strong>${money(stats.overdue)}</strong> overdue across ${list.filter(i=>invStatus(i)==='overdue').length} invoice${list.filter(i=>invStatus(i)==='overdue').length!==1?'s':''}.</div>`:''}
  <div class="filters">
    <div class="fsearch"><span>🔍</span><input placeholder="Search invoices…" value="${invQ}" oninput="invQ=this.value.toLowerCase();renderInvoices()"/></div>
    <select class="fsel" onchange="invStatusF=this.value;renderInvoices()">
      <option value="">All Status</option>
      ${['paid','sent','unpaid','overdue','draft','cancelled'].map(s=>`<option value="${s}" ${invStatusF===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
    </select>
  </div>
  <div class="card">
    ${list.length===0?`<div class="empty"><div class="empty-ic">📄</div><h3>No invoices</h3><p>Create your first invoice to get paid.</p><button class="btn btn-primary" onclick="openInvModal()">+ Create Invoice</button></div>`:`
    <div class="tbl-wrap"><table>
      <thead><tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Due</th><th>Total</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${[...list].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(inv=>{
          const c=calcInv(inv);const st=invStatus(inv);
          const sbadge={paid:'b-green',sent:'b-blue',unpaid:'b-orange',overdue:'b-red',draft:'b-gray',cancelled:'b-gray'};
          return`<tr>
            <td class="td-bold td-mono">${inv.number}</td>
            <td><div class="flex items-c gap2">${avEl(clientName(inv.clientId),'sm')} ${clientName(inv.clientId)}</div></td>
            <td class="td-muted">${fmtDate(inv.date)}</td>
            <td class="td-muted" style="color:${st==='overdue'?'var(--red)':''}">${fmtDate(inv.due)}</td>
            <td class="fw6">${money(c.total)}</td>
            <td class="fw6 ${c.balance>0?'tc-o':'tc-g'}">${money(c.balance)}</td>
            <td><span class="badge ${sbadge[st]||'b-gray'}">${st}</span></td>
            <td><div class="flex gap1">
              ${st!=='paid'?`<button class="btn btn-xs btn-success" onclick="markPaid('${inv.id}')">✓ Paid</button>`:''}
              <button class="btn btn-xs btn-secondary" onclick="openInvModal('${inv.id}')">Edit</button>
              <button class="btn btn-xs btn-secondary" onclick="pdfInv('${inv.id}')">PDF</button>
              <button class="btn btn-xs btn-secondary" onclick="dupInv('${inv.id}')">Dup</button>
              <button class="btn btn-xs btn-danger" onclick="delInv('${inv.id}')">Del</button>
            </div></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>`}
  </div>`;
}

let editInvId=null;
function openInvModal(id){
  editInvId=id||null;
  const inv=id?S.invoices?.find(i=>i.id===id):null;
  invLineItems=inv?(inv.items||[]).map(i=>({...i})):[{id:uid(),desc:'',qty:1,rate:''}];
  const num=inv?.number||`${S.settings.invPrefix||'INV'}-${String(S.settings.nextInv||1).padStart(3,'0')}`;

  showModal(`<div class="modal-ov"><div class="modal xl">
    <div class="modal-hd"><h2>${id?'Edit Invoice':'New Invoice'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid" style="margin-bottom:14px">
        <div class="fg"><label>Client <span class="req">*</span></label><select class="fc" id="inv-cl"><option value="">— Select —</option>${(S.clients||[]).map(c=>`<option value="${c.id}" ${inv?.clientId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Invoice #</label><input class="fc" id="inv-num" value="${num}"/></div>
        <div class="fg"><label>Project</label><select class="fc" id="inv-proj"><option value="">—</option>${(S.projects||[]).map(p=>`<option value="${p.id}" ${inv?.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Status</label><select class="fc" id="inv-st">${['draft','sent','unpaid','paid','overdue','cancelled'].map(s=>`<option value="${s}" ${(inv?.status||'draft')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
        <div class="fg"><label>Issue Date</label><input class="fc" type="date" id="inv-date" value="${inv?.date||today()}"/></div>
        <div class="fg"><label>Due Date</label><input class="fc" type="date" id="inv-due" value="${inv?.due||addDays(today(),S.settings.payTerms||14)}"/></div>
        <div class="fg"><label>Tax Rate (%)</label><input class="fc" type="number" id="inv-tax" value="${inv?.taxRate??S.settings.taxRate??10}" oninput="updateInvTotals()"/></div>
        <div class="fg"><label>Discount (%)</label><input class="fc" type="number" id="inv-disc" value="${inv?.discount||0}" oninput="updateInvTotals()"/></div>
        <div class="fg s2"><label>Notes / Terms</label><input class="fc" id="inv-notes" value="${inv?.notes||''}"/></div>
      </div>
      <hr class="sec-div"/>
      <div class="flex jc-b items-c mb3"><label class="form-label" style="margin:0">Line Items</label><button class="btn btn-xs btn-secondary" onclick="addInvLI()">+ Add Row</button></div>
      <div class="li-wrap mb3"><table>
        <thead><tr><th style="width:42%">Description</th><th style="width:12%">Qty</th><th style="width:18%">Rate ($)</th><th style="width:18%">Amount</th><th style="width:8%"></th></tr></thead>
        <tbody id="inv-li-body"></tbody>
      </table></div>
      <div class="inv-totals" id="inv-totals"></div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-secondary" onclick="saveInv('draft')">Save Draft</button>
      <button class="btn btn-primary" onclick="saveInv('sent')">Save & Send</button>
    </div>
  </div></div>`);
  renderInvLI();
}

function renderInvLI(){
  const body=document.getElementById('inv-li-body');if(!body)return;
  body.innerHTML=invLineItems.map((li,i)=>`
    <tr>
      <td><input type="text" value="${li.desc||''}" placeholder="Description" oninput="invLineItems[${i}].desc=this.value"/></td>
      <td><input type="number" value="${li.qty||1}" min="0" step="0.5" oninput="invLineItems[${i}].qty=this.value;updateInvTotals()"/></td>
      <td><input type="number" value="${li.rate||''}" min="0" step="0.01" placeholder="0.00" oninput="invLineItems[${i}].rate=this.value;updateInvTotals()"/></td>
      <td style="font-weight:600;padding:7px 10px;font-family:'JetBrains Mono',monospace;font-size:12px" id="li-a-${i}">${money((parseFloat(li.qty)||0)*(parseFloat(li.rate)||0))}</td>
      <td><button onclick="remInvLI(${i})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:3px 8px" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--muted)'">✕</button></td>
    </tr>`).join('');
  updateInvTotals();
}
function addInvLI(){invLineItems.push({id:uid(),desc:'',qty:1,rate:''});renderInvLI()}
function remInvLI(i){invLineItems.splice(i,1);renderInvLI()}
function updateInvTotals(){
  invLineItems.forEach((li,i)=>{const e=document.getElementById(`li-a-${i}`);if(e)e.textContent=money((parseFloat(li.qty)||0)*(parseFloat(li.rate)||0))});
  const sub=invLineItems.reduce((s,li)=>s+(parseFloat(li.qty)||0)*(parseFloat(li.rate)||0),0);
  const tr=parseFloat(document.getElementById('inv-tax')?.value)||0;
  const dr=parseFloat(document.getElementById('inv-disc')?.value)||0;
  const disc=sub*(dr/100);const after=sub-disc;const tax=after*(tr/100);const total=after+tax;
  const el=document.getElementById('inv-totals');
  if(el)el.innerHTML=`
    <div class="tot-row"><span class="tl">Subtotal</span><span class="tv">${money(sub)}</span></div>
    ${dr>0?`<div class="tot-row"><span class="tl">Discount (${dr}%)</span><span class="tv tc-r">−${money(disc)}</span></div>`:''}
    <div class="tot-row"><span class="tl">Tax (${tr}%)</span><span class="tv">${money(tax)}</span></div>
    <div class="tot-row grand"><span class="tl">Total</span><span class="tv">${money(total)}</span></div>`;
}

function saveInv(defSt){
  const clId=document.getElementById('inv-cl')?.value;
  if(!clId){toast('Please select a client','e');return}
  const num=document.getElementById('inv-num')?.value.trim();
  if(!num){toast('Invoice number required','e');return}
  const inv={
    id:editInvId||uid(),number:num,clientId:clId,
    projectId:document.getElementById('inv-proj')?.value||null,
    status:document.getElementById('inv-st')?.value||defSt,
    date:document.getElementById('inv-date')?.value,
    due:document.getElementById('inv-due')?.value,
    taxRate:parseFloat(document.getElementById('inv-tax')?.value)||0,
    discount:parseFloat(document.getElementById('inv-disc')?.value)||0,
    notes:document.getElementById('inv-notes')?.value.trim(),
    items:invLineItems.map(li=>({...li})),
    payments:editInvId?(S.invoices.find(i=>i.id===editInvId)?.payments||[]):[],
  };
  if(!S.invoices)S.invoices=[];
  if(editInvId){const i=S.invoices.findIndex(i=>i.id===editInvId);if(i>=0)S.invoices[i]=inv;}
  else{S.invoices.push(inv);S.settings.nextInv=(S.settings.nextInv||1)+1;logAct('invoice','created',num,inv.id,'📄')}
  saveAppData();closeModal();toast(editInvId?'Invoice updated':'Invoice created','s');renderInvoices();updateBadges();
}

function markPaid(id){
  const inv=S.invoices?.find(i=>i.id===id);if(!inv)return;
  const c=calcInv(inv);
  if(!inv.payments)inv.payments=[];
  if(c.balance>0)inv.payments.push({id:uid(),amount:c.balance,date:today(),method:'Bank Transfer',ref:''});
  inv.status='paid';saveAppData();renderInvoices();renderDash();
  logAct('invoice','marked as paid',inv.number,id,'💰');toast(`${inv.number} marked as paid`,'s');
}
function dupInv(id){
  const inv=S.invoices?.find(i=>i.id===id);if(!inv)return;
  const num=`${S.settings.invPrefix||'INV'}-${String(S.settings.nextInv||1).padStart(3,'0')}`;
  const copy={...inv,id:uid(),number:num,status:'draft',date:today(),due:addDays(today(),S.settings.payTerms||14),payments:[],items:(inv.items||[]).map(li=>({...li,id:uid()}))};
  S.invoices.push(copy);S.settings.nextInv=(S.settings.nextInv||1)+1;
  saveAppData();renderInvoices();toast('Invoice duplicated','s');
}
function delInv(id){confirm2('Delete this invoice?',()=>{S.invoices=S.invoices.filter(i=>i.id!==id);saveAppData();renderInvoices();toast('Invoice deleted')})}

// PDF EXPORT
function pdfInv(id){exportPDF(id,'invoice')}

function exportPDF(id,type){
  const doc=type==='quote'?S.quotes?.find(q=>q.id===id):S.invoices?.find(i=>i.id===id);
  if(!doc)return;
  const jsPDF=window.jspdf?.jsPDF;
  if(!jsPDF){toast('PDF library not loaded','e');return}
  const pdf=new jsPDF({unit:'mm',format:'a4'});
  const s=S.settings;const cl=S.clients?.find(c=>c.id===doc.clientId);
  const W=210,M=18;const calc=calcInv(doc);

  // Header
  pdf.setFillColor(20,18,14);pdf.rect(0,0,W,44,'F');
  pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(22);
  pdf.text(s.bizName||'Your Business',M,15);
  pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(175,168,158);
  const bLines=[s.email,s.phone,s.abn?'ABN: '+s.abn:null].filter(Boolean);
  bLines.forEach((l,i)=>pdf.text(l,M,22+i*5));
  pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(18);
  pdf.text(type.toUpperCase(),W-M,15,{align:'right'});
  pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(175,168,158);
  pdf.text(doc.number,W-M,22,{align:'right'});
  pdf.text('Date: '+fmtDate(doc.date),W-M,27,{align:'right'});
  if(doc.due)pdf.text('Due: '+fmtDate(doc.due),W-M,32,{align:'right'});

  let y=56;
  pdf.setTextColor(20,18,14);
  pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.text('BILL TO',M,y);
  pdf.setFont('helvetica','normal');y+=5;
  if(cl){
    pdf.setFontSize(11);pdf.setFont('helvetica','bold');pdf.text(cl.name,M,y);y+=5;
    pdf.setFontSize(8.5);pdf.setFont('helvetica','normal');
    if(cl.company){pdf.text(cl.company,M,y);y+=4.5}
    if(cl.email){pdf.text(cl.email,M,y);y+=4.5}
    if(cl.address){const ls=pdf.splitTextToSize(cl.address,80);pdf.text(ls,M,y);y+=ls.length*4.5}
  }
  if(s.address){
    let ry=56;pdf.setFont('helvetica','bold');pdf.setFontSize(8);pdf.setTextColor(20,18,14);
    pdf.text('FROM',W/2+6,ry);pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);ry+=5;
    const ls=pdf.splitTextToSize(s.address,82);pdf.text(ls,W/2+6,ry);
  }
  y=Math.max(y,96)+6;

  pdf.setFillColor(238,234,228);pdf.rect(M,y-2,W-M*2,8,'F');
  pdf.setFont('helvetica','bold');pdf.setFontSize(7.5);pdf.setTextColor(100,95,85);
  pdf.text('DESCRIPTION',M+2,y+3.5);pdf.text('QTY',128,y+3.5,{align:'right'});
  pdf.text('RATE',155,y+3.5,{align:'right'});pdf.text('AMOUNT',W-M-1,y+3.5,{align:'right'});
  y+=10;
  pdf.setFont('helvetica','normal');pdf.setTextColor(20,18,14);pdf.setFontSize(8.5);
  (doc.items||[]).forEach((li,idx)=>{
    if(idx%2===1){pdf.setFillColor(248,246,242);pdf.rect(M,y-3.5,W-M*2,8,'F')}
    const amt=(parseFloat(li.qty)||0)*(parseFloat(li.rate)||0);
    pdf.text(li.desc||'',M+2,y+1);pdf.text(String(li.qty||''),128,y+1,{align:'right'});
    pdf.text(money(li.rate),155,y+1,{align:'right'});pdf.text(money(amt),W-M-1,y+1,{align:'right'});
    y+=9;
  });
  y+=4;pdf.setDrawColor(215,210,202);pdf.line(M,y,W-M,y);y+=5;
  const addRow=(lbl,val,bold)=>{
    if(bold){pdf.setFont('helvetica','bold');pdf.setFontSize(10);}else{pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(100,95,85)}
    pdf.text(lbl,W-M-52,y);pdf.setTextColor(20,18,14);pdf.text(val,W-M-1,y,{align:'right'});y+=5.5;
  };
  addRow('Subtotal',money(calc.sub));
  if(calc.disc>0)addRow(`Discount (${doc.discount}%)`,`−${money(calc.disc)}`);
  addRow(`Tax (${doc.taxRate||0}%)`,money(calc.tax));
  pdf.line(W-M-58,y,W-M,y);y+=4;addRow('TOTAL DUE',money(calc.total),true);
  if(s.paymentDetails){
    y+=8;const pls=s.paymentDetails.split('\n');
    pdf.setFillColor(238,234,228);pdf.rect(M,y-3,W-M*2,pls.length*5+10,'F');
    pdf.setFont('helvetica','bold');pdf.setFontSize(7.5);pdf.setTextColor(100,95,85);
    pdf.text('PAYMENT DETAILS',M+3,y+1);y+=6;
    pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(20,18,14);
    pls.forEach(l=>{pdf.text(l,M+3,y);y+=5});
  }
  if(doc.notes){y+=6;pdf.setFont('helvetica','italic');pdf.setFontSize(8);pdf.setTextColor(120,115,105);pdf.text(doc.notes,M,y)}
  pdf.setFontSize(7);pdf.setFont('helvetica','normal');pdf.setTextColor(155,150,143);
  pdf.text(`${s.bizName} · ${s.email||''} · Created with Folio`,W/2,287,{align:'center'});
  pdf.save(`${doc.number}.pdf`);
  logAct(type,'exported PDF',doc.number,id,'📄');toast(`${doc.number}.pdf exported`,'s');
}

// ═══════════════════════════════════════════════════════
// QUOTES
// ═══════════════════════════════════════════════════════
