// FOLIO — Settings

function renderSettings(){
  if (!canView('settings')) { renderAccessDenied('settings'); return; }
  auditLog('settings', 'viewed', 'Settings page viewed', {});
  
  const s=S.settings;
  document.getElementById('page-settings').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Settings</h1><p>Business profile, preferences, and data management</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="saveSettings()">Save All Changes</button></div>
  </div>
  <div style="max-width:680px;display:flex;flex-direction:column;gap:18px">

    <div class="card">
      <div class="card-hd"><div class="card-title">Business Profile</div></div>
      <div class="card-body">
        <div class="fgrid" style="gap:13px">
          <div class="fg"><label>Business Name</label><input class="fc" id="s-biz" value="${s.bizName||''}"/></div>
          <div class="fg"><label>Owner Name</label><input class="fc" id="s-owner" value="${s.ownerName||''}"/></div>
          <div class="fg"><label>Email</label><input class="fc" id="s-email" value="${s.email||''}"/></div>
          <div class="fg"><label>Phone</label><input class="fc" id="s-phone" value="${s.phone||''}"/></div>
          <div class="fg"><label>Website</label><input class="fc" id="s-web" value="${s.website||''}"/></div>
          <div class="fg"><label>ABN / Tax Number</label><input class="fc" id="s-abn" value="${s.abn||''}"/></div>
          <div class="fg s2"><label>Business Address</label><input class="fc" id="s-addr" value="${s.address||''}"/></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div class="card-title">Financial Defaults</div></div>
      <div class="card-body">
        <div class="fgrid" style="gap:13px">
          <div class="fg"><label>Default Tax Rate (%)</label><input class="fc" type="number" id="s-tax" value="${s.taxRate??10}" min="0" max="100"/></div>
          <div class="fg"><label>Default Payment Terms (days)</label><input class="fc" type="number" id="s-terms" value="${s.payTerms??14}" min="1"/></div>
          <div class="fg"><label>Currency</label>
            <select class="fc" id="s-cur">
              ${[['AUD','$'],['USD','$'],['GBP','£'],['EUR','€'],['NZD','$'],['CAD','$'],['SGD','$'],['HKD','$']].map(([c,sym])=>`<option value="${c}" data-sym="${sym}" ${s.currency===c?'selected':''}>${c} (${sym})</option>`).join('')}
            </select>
          </div>
          <div class="fg"><label>Invoice Number Prefix</label><input class="fc" id="s-invpfx" value="${s.invPrefix||'INV'}"/></div>
          <div class="fg"><label>Quote Number Prefix</label><input class="fc" id="s-qpfx" value="${s.quotePrefix||'QUO'}"/></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div class="card-title">Bank & Payment Details</div></div>
      <div class="card-body">
        <div class="fgrid" style="gap:13px">
          <div class="fg"><label>Bank Name</label><input class="fc" id="s-bank" value="${s.bankName||''}"/></div>
          <div class="fg"><label>BSB</label><input class="fc" id="s-bsb" value="${s.bsb||''}"/></div>
          <div class="fg"><label>Account Number</label><input class="fc" id="s-acct" value="${s.accountNo||''}"/></div>
          <div class="fg s2"><label>Payment Instructions (shown on invoices & PDFs)</label><textarea class="fc" id="s-pay" rows="3">${s.paymentDetails||''}</textarea></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div class="card-title">Appearance</div></div>
      <div class="card-body">
        <div class="flex gap2">
          <button class="btn ${s.theme!=='dark'?'btn-primary':'btn-secondary'}" onclick="setTheme('light');renderSettings()">☀️ Light Mode</button>
          <button class="btn ${s.theme==='dark'?'btn-primary':'btn-secondary'}" onclick="setTheme('dark');renderSettings()">🌙 Dark Mode</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><div class="card-title">Data Management</div></div>
      <div class="card-body">
        <div class="flex gap2 mb3" style="flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="exportBackup()">⬇ Export Backup (.json)</button>
          <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">⬆ Import Backup</button>
          <input type="file" id="import-file" style="display:none" accept=".json" onchange="importBackup(this.files[0])"/>
          <button class="btn btn-danger" onclick="resetApp()">🗑 Reset All Data</button>
        </div>
        <div class="fs12 tc-m">
          ${S.clients?.length||0} clients · ${S.projects?.length||0} projects · ${S.invoices?.length||0} invoices ·
          ${S.quotes?.length||0} quotes · ${S.expenses?.length||0} expenses · ${S.tasks?.length||0} tasks
        </div>
      </div>
    </div>

  </div>`;
}

function saveSettings(){
  const sel=document.getElementById('s-cur');
  S.settings={
    ...S.settings,
    bizName:document.getElementById('s-biz')?.value.trim()||S.settings.bizName,
    ownerName:document.getElementById('s-owner')?.value.trim()||S.settings.ownerName,
    email:document.getElementById('s-email')?.value.trim(),
    phone:document.getElementById('s-phone')?.value.trim(),
    website:document.getElementById('s-web')?.value.trim(),
    abn:document.getElementById('s-abn')?.value.trim(),
    address:document.getElementById('s-addr')?.value.trim(),
    taxRate:parseFloat(document.getElementById('s-tax')?.value)||10,
    payTerms:parseInt(document.getElementById('s-terms')?.value)||14,
    currency:sel?.value||'AUD',
    sym:sel?.options[sel?.selectedIndex]?.dataset?.sym||'$',
    invPrefix:document.getElementById('s-invpfx')?.value.trim()||'INV',
    quotePrefix:document.getElementById('s-qpfx')?.value.trim()||'QUO',
    bankName:document.getElementById('s-bank')?.value.trim(),
    bsb:document.getElementById('s-bsb')?.value.trim(),
    accountNo:document.getElementById('s-acct')?.value.trim(),
    paymentDetails:document.getElementById('s-pay')?.value.trim(),
  };
  saveAppData();updateSidebar();toast('Settings saved','s');
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
