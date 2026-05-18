// FOLIO — Expenses

let editExId=null;
function renderExpenses(){
  if (!canView('expenses')) { renderAccessDenied('expenses'); return; }
  auditLog('expenses', 'viewed', 'Expenses page viewed', {});
  
  const exps=S.expenses||[];
  const total=exps.reduce((s,e)=>s+parseFloat(e.amount||0),0);
  const ded=exps.filter(e=>e.deductible).reduce((s,e)=>s+parseFloat(e.amount||0),0);
  const curMon=exps.filter(e=>e.date?.startsWith(fmtMonKey(0))).reduce((s,e)=>s+parseFloat(e.amount||0),0);
  const earned=(S.invoices||[]).filter(i=>i.status==='paid').reduce((s,i)=>s+calcInv(i).total,0);

  document.getElementById('page-expenses').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Expenses</h1><p>${exps.length} logged · ${money(ded)} deductible</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="openExpModal()">+ Log Expense</button></div>
  </div>
  <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="stat-lbl">Total Expenses</div><div class="stat-val r">${moneyK(total)}</div><div class="stat-sub">All time</div></div>
    <div class="stat"><div class="stat-lbl">This Month</div><div class="stat-val o">${moneyK(curMon)}</div></div>
    <div class="stat"><div class="stat-lbl">Tax Deductible</div><div class="stat-val g">${moneyK(ded)}</div></div>
    <div class="stat"><div class="stat-lbl">Net Profit</div><div class="stat-val ${earned-total>=0?'g':'r'}">${moneyK(earned-total)}</div><div class="stat-sub">Earned − expenses</div></div>
  </div>
  <div class="card">
    ${exps.length===0?`<div class="empty"><div class="empty-ic">💸</div><h3>No expenses</h3><p>Track your business expenses to stay on top of finances.</p><button class="btn btn-primary" onclick="openExpModal()">+ Log Expense</button></div>`:`
    <div class="tbl-wrap"><table>
      <thead><tr><th>Description</th><th>Merchant</th><th>Category</th><th>Date</th><th>Amount</th><th>Deductible</th><th>Actions</th></tr></thead>
      <tbody>
        ${[...exps].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(e=>`
          <tr>
            <td class="td-bold">${e.desc}</td>
            <td class="td-muted">${e.merchant||'—'}</td>
            <td><span class="badge b-gray">${e.cat||'Other'}</span></td>
            <td class="td-muted">${fmtDate(e.date)}</td>
            <td class="fw6 tc-r">−${money(e.amount)}</td>
            <td>${e.deductible?'<span class="badge b-green">Yes</span>':'<span class="badge b-gray">No</span>'}</td>
            <td><div class="flex gap1">
              <button class="btn btn-xs btn-secondary" onclick="openExpModal('${e.id}')">Edit</button>
              <button class="btn btn-xs btn-danger" onclick="delExp('${e.id}')">Del</button>
            </div></td>
          </tr>`).join('')}
      </tbody>
    </table></div>`}
  </div>`;
}

function openExpModal(id){
  editExId=id||null;const e=id?S.expenses?.find(e=>e.id===id):null;
  const cats=['Software','Hardware','Travel','Meals','Marketing','Subscriptions','Office','Subcontractors','Equipment','Education','Other'];
  showModal(`<div class="modal-ov"><div class="modal">
    <div class="modal-hd"><h2>${id?'Edit Expense':'Log Expense'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid">
        <div class="fg s2"><label>Description <span class="req">*</span></label><input class="fc" id="ex-desc" value="${e?.desc||''}"/></div>
        <div class="fg"><label>Merchant</label><input class="fc" id="ex-mer" value="${e?.merchant||''}"/></div>
        <div class="fg"><label>Category</label><select class="fc" id="ex-cat">${cats.map(c=>`<option ${e?.cat===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="fg"><label>Amount ($) <span class="req">*</span></label><input class="fc" type="number" id="ex-amt" value="${e?.amount||''}" step="0.01"/></div>
        <div class="fg"><label>Tax ($)</label><input class="fc" type="number" id="ex-tax" value="${e?.tax||''}" step="0.01"/></div>
        <div class="fg"><label>Date</label><input class="fc" type="date" id="ex-date" value="${e?.date||today()}"/></div>
        <div class="fg"><label>Payment Method</label><select class="fc" id="ex-meth">${['Credit Card','Debit Card','Bank Transfer','Cash','PayPal','Other'].map(m=>`<option ${e?.method===m?'selected':''}>${m}</option>`).join('')}</select></div>
        <div class="fg"><label>Project (optional)</label><select class="fc" id="ex-proj"><option value="">—</option>${(S.projects||[]).map(p=>`<option value="${p.id}" ${e?.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Tax Deductible?</label><select class="fc" id="ex-ded"><option value="true" ${e?.deductible!==false?'selected':''}>Yes</option><option value="false" ${e?.deductible===false?'selected':''}>No</option></select></div>
        <div class="fg s2"><label>Notes</label><input class="fc" id="ex-notes" value="${e?.notes||''}"/></div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      ${id?`<button class="btn btn-danger" onclick="delExp('${id}');closeModal()">Delete</button>`:''}
      <button class="btn btn-primary" onclick="saveExp()">Save Expense</button>
    </div>
  </div></div>`);
}

function saveExp(){
  const desc=document.getElementById('ex-desc')?.value.trim();
  const amt=parseFloat(document.getElementById('ex-amt')?.value);
  if(!desc||isNaN(amt)){toast('Description and amount required','e');return}
  const exp={id:editExId||uid(),desc,merchant:document.getElementById('ex-mer')?.value.trim(),cat:document.getElementById('ex-cat')?.value,amount:amt,tax:parseFloat(document.getElementById('ex-tax')?.value)||0,date:document.getElementById('ex-date')?.value,method:document.getElementById('ex-meth')?.value,projectId:document.getElementById('ex-proj')?.value||null,deductible:document.getElementById('ex-ded')?.value!=='false',notes:document.getElementById('ex-notes')?.value.trim()};
  if(!S.expenses)S.expenses=[];
  if(editExId){const i=S.expenses.findIndex(e=>e.id===editExId);if(i>=0)S.expenses[i]=exp;}
  else{S.expenses.push(exp);logAct('expense','logged',desc,exp.id,'💸')}
  saveAppData();closeModal();toast(editExId?'Expense updated':'Expense logged','s');renderExpenses();
}
function delExp(id){S.expenses=S.expenses.filter(e=>e.id!==id);saveAppData();renderExpenses();toast('Deleted')}
