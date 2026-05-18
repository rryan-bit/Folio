// ═══════════════════════════════════════════════════════════════
// FOLIO — Auth UI: Login, Sign Up, Onboarding screens
// ═══════════════════════════════════════════════════════════════

function showAuthScreen(tab = 'login') {
  document.getElementById('app').style.display = 'none';
  let el = document.getElementById('auth-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-root';
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
  el.innerHTML = buildAuthShell(tab);
  bindAuthEvents(tab);
}

function hideAuthScreen() {
  const el = document.getElementById('auth-root');
  if (el) el.style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

function buildAuthShell(tab) {
  return `
  <div class="auth-wrap">
    <div class="auth-brand">
      <div class="auth-logo-mark">F</div>
      <div class="auth-logo-name">Folio</div>
      <div class="auth-logo-tag">Freelance Business OS</div>
      <div class="auth-brand-copy">
        <div class="auth-feature">✓ Invoices & Quotes</div>
        <div class="auth-feature">✓ Client & Project Management</div>
        <div class="auth-feature">✓ Time Tracking</div>
        <div class="auth-feature">✓ Reports & Analytics</div>
        <div class="auth-feature">✓ Team Access Controls</div>
      </div>
    </div>
    <div class="auth-panel">
      <div class="auth-card" id="auth-card">
        ${tab === 'login'  ? buildLoginForm()  : ''}
        ${tab === 'signup' ? buildSignupForm() : ''}
        ${tab === 'forgot' ? buildForgotForm() : ''}
      </div>
    </div>
  </div>`;
}

function buildLoginForm() {
  return `
  <div class="auth-form-wrap">
    <h1 class="auth-title">Welcome back</h1>
    <p class="auth-sub">Sign in to your Folio account</p>
    <div id="auth-error" class="auth-error" style="display:none"></div>
    <div class="auth-field">
      <label>Email address</label>
      <input type="email" id="a-email" class="auth-input" placeholder="you@example.com" autocomplete="email"/>
    </div>
    <div class="auth-field">
      <label>Password</label>
      <div class="auth-pw-wrap">
        <input type="password" id="a-password" class="auth-input" placeholder="Your password" autocomplete="current-password"/>
        <button type="button" class="pw-toggle" onclick="togglePw('a-password',this)">👁</button>
      </div>
    </div>
    <div class="auth-row">
      <label class="auth-check-label"><input type="checkbox" id="a-remember"/> Remember me</label>
      <a href="#" class="auth-link" onclick="showAuthScreen('forgot');return false">Forgot password?</a>
    </div>
    <button class="auth-btn" id="auth-submit" onclick="handleLogin()">
      <span id="auth-btn-text">Sign In</span>
      <span id="auth-btn-spin" style="display:none" class="spin-icon">↻</span>
    </button>
    <div class="auth-divider"><span>or</span></div>
    <div class="auth-switch">Don't have an account? <a href="#" class="auth-link" onclick="showAuthScreen('signup');return false">Create one free</a></div>
    <div class="auth-demo-hint">
      <strong>Demo:</strong> Sign up to create an account, or use the demo button below.
      <br/><button class="auth-demo-btn" onclick="loadDemoAccount()">Load Demo Account</button>
    </div>
  </div>`;
}

function buildSignupForm() {
  const bizTypes = ['Freelancer','Design Agency','Development Agency','Marketing Agency','Consulting','Photography','Copywriting','Architecture','Legal','Accounting','Other'];
  const countries = [
    ['AU','Australia'],['US','United States'],['GB','United Kingdom'],['NZ','New Zealand'],
    ['CA','Canada'],['SG','Singapore'],['DE','Germany'],['FR','France'],['IN','India'],['Other','Other'],
  ];
  const currencies = [['AUD','AUD — Australian Dollar'],['USD','USD — US Dollar'],['GBP','GBP — British Pound'],['EUR','EUR — Euro'],['NZD','NZD — New Zealand Dollar'],['CAD','CAD — Canadian Dollar'],['SGD','SGD — Singapore Dollar'],['INR','INR — Indian Rupee']];

  return `
  <div class="auth-form-wrap">
    <h1 class="auth-title">Create your account</h1>
    <p class="auth-sub">Set up Folio for your business — free forever</p>
    <div id="auth-error" class="auth-error" style="display:none"></div>
    <div class="auth-grid-2">
      <div class="auth-field">
        <label>Full name <span class="req">*</span></label>
        <input type="text" id="s-name" class="auth-input" placeholder="Alex Morgan"/>
      </div>
      <div class="auth-field">
        <label>Business name <span class="req">*</span></label>
        <input type="text" id="s-biz" class="auth-input" placeholder="Folio Studio"/>
      </div>
    </div>
    <div class="auth-field">
      <label>Email address <span class="req">*</span></label>
      <input type="email" id="s-email" class="auth-input" placeholder="you@yourbusiness.com"/>
    </div>
    <div class="auth-grid-2">
      <div class="auth-field">
        <label>Password <span class="req">*</span></label>
        <div class="auth-pw-wrap">
          <input type="password" id="s-pw" class="auth-input" placeholder="Min. 8 characters" oninput="checkPwStrength(this.value)"/>
          <button type="button" class="pw-toggle" onclick="togglePw('s-pw',this)">👁</button>
        </div>
        <div class="pw-strength-bar"><div id="pw-strength-fill" class="pw-strength-fill"></div></div>
        <div id="pw-strength-label" class="pw-strength-label"></div>
      </div>
      <div class="auth-field">
        <label>Confirm password <span class="req">*</span></label>
        <div class="auth-pw-wrap">
          <input type="password" id="s-pw2" class="auth-input" placeholder="Repeat password"/>
          <button type="button" class="pw-toggle" onclick="togglePw('s-pw2',this)">👁</button>
        </div>
      </div>
    </div>
    <div class="auth-grid-2">
      <div class="auth-field">
        <label>Business type</label>
        <select id="s-type" class="auth-input auth-select">
          ${bizTypes.map(t=>`<option>${t}</option>`).join('')}
        </select>
      </div>
      <div class="auth-field">
        <label>Country</label>
        <select id="s-country" class="auth-input auth-select">
          ${countries.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="auth-field">
      <label>Currency</label>
      <select id="s-currency" class="auth-input auth-select">
        ${currencies.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
      </select>
    </div>
    <label class="auth-check-label" style="margin-bottom:14px">
      <input type="checkbox" id="s-terms"/>
      I agree to the <a href="#" class="auth-link">Terms of Service</a> and <a href="#" class="auth-link">Privacy Policy</a>
    </label>
    <button class="auth-btn" id="auth-submit" onclick="handleSignup()">
      <span id="auth-btn-text">Create Account</span>
      <span id="auth-btn-spin" style="display:none" class="spin-icon">↻</span>
    </button>
    <div class="auth-switch">Already have an account? <a href="#" class="auth-link" onclick="showAuthScreen('login');return false">Sign in</a></div>
  </div>`;
}

function buildForgotForm() {
  return `
  <div class="auth-form-wrap">
    <h1 class="auth-title">Reset your password</h1>
    <p class="auth-sub">We'll send a reset link to your email address.</p>
    <div id="auth-error" class="auth-error" style="display:none"></div>
    <div id="auth-success" class="auth-success" style="display:none"></div>
    <div class="auth-field">
      <label>Email address</label>
      <input type="email" id="f-email" class="auth-input" placeholder="you@example.com"/>
    </div>
    <button class="auth-btn" onclick="handleForgot()">Send Reset Link</button>
    <div class="auth-switch"><a href="#" class="auth-link" onclick="showAuthScreen('login');return false">← Back to sign in</a></div>
  </div>`;
}

function bindAuthEvents(tab) {
  // Enter key submits
  document.querySelectorAll('.auth-input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (tab === 'login') handleLogin();
        if (tab === 'signup') handleSignup();
        if (tab === 'forgot') handleForgot();
      }
    });
  });
}

function togglePw(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

function checkPwStrength(pw) {
  const fill = document.getElementById('pw-strength-fill');
  const label = document.getElementById('pw-strength-label');
  if (!fill || !label) return;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { w:'15%', bg:'var(--red)',    text:'Too short' },
    { w:'30%', bg:'var(--red)',    text:'Weak' },
    { w:'60%', bg:'var(--orange)', text:'Fair' },
    { w:'80%', bg:'var(--amber)',  text:'Good' },
    { w:'100%',bg:'var(--green)',  text:'Strong' },
  ];
  const l = levels[Math.min(score, 4)];
  fill.style.width = pw.length === 0 ? '0%' : l.w;
  fill.style.background = l.bg;
  label.textContent = pw.length === 0 ? '' : l.text;
  label.style.color = l.bg;
}

function setAuthLoading(on) {
  const btn = document.getElementById('auth-submit');
  const txt = document.getElementById('auth-btn-text');
  const spin = document.getElementById('auth-btn-spin');
  if (btn) btn.disabled = on;
  if (txt) txt.style.opacity = on ? '0' : '1';
  if (spin) spin.style.display = on ? 'inline-block' : 'none';
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearAuthError() {
  const el = document.getElementById('auth-error');
  if (el) el.style.display = 'none';
}

async function handleLogin() {
  clearAuthError();
  const email = document.getElementById('a-email')?.value.trim();
  const password = document.getElementById('a-password')?.value;
  if (!email || !password) { showAuthError('Please enter your email and password.'); return; }
  setAuthLoading(true);
  // Simulate async for UX
  await new Promise(r => setTimeout(r, 600));
  try {
    await authLogin({ email, password });
    hideAuthScreen();
    if (!currentBusiness.onboardingComplete) {
      showOnboarding();
    } else {
      initApp();
    }
  } catch(e) {
    showAuthError(e.message);
    setAuthLoading(false);
  }
}

async function handleSignup() {
  clearAuthError();
  const name     = document.getElementById('s-name')?.value.trim();
  const bizName  = document.getElementById('s-biz')?.value.trim();
  const email    = document.getElementById('s-email')?.value.trim();
  const pw       = document.getElementById('s-pw')?.value;
  const pw2      = document.getElementById('s-pw2')?.value;
  const bizType  = document.getElementById('s-type')?.value;
  const country  = document.getElementById('s-country')?.value;
  const currency = document.getElementById('s-currency')?.value;
  const terms    = document.getElementById('s-terms')?.checked;

  if (!name)    { showAuthError('Please enter your full name.'); return; }
  if (!bizName) { showAuthError('Please enter your business name.'); return; }
  if (!email || !email.includes('@')) { showAuthError('Please enter a valid email address.'); return; }
  if (!pw || pw.length < 8) { showAuthError('Password must be at least 8 characters.'); return; }
  if (pw !== pw2) { showAuthError('Passwords do not match.'); return; }
  if (!terms) { showAuthError('Please accept the Terms of Service to continue.'); return; }

  setAuthLoading(true);
  await new Promise(r => setTimeout(r, 700));
  try {
    await authSignUp({ name, businessName: bizName, email, password: pw, businessType: bizType, country, currency });
    hideAuthScreen();
    showOnboarding();
  } catch(e) {
    showAuthError(e.message);
    setAuthLoading(false);
  }
}

function handleForgot() {
  clearAuthError();
  const email = document.getElementById('f-email')?.value.trim();
  if (!email) { showAuthError('Please enter your email address.'); return; }
  try {
    authResetPassword(email);
    const s = document.getElementById('auth-success');
    if (s) { s.textContent = `Reset link sent to ${email} (mock — check your console in a real app).`; s.style.display = 'block'; }
  } catch(e) {
    showAuthError(e.message);
  }
}

// ── Demo account ──
function loadDemoAccount() {
  // Create demo account if not already there
  try {
    const users = _getUsers();
    const demo = users.find(u => u.email === 'demo@folio.app');
    if (!demo) {
      // Auto signup
      document.getElementById('s-name') || document.querySelector('.auth-form-wrap');
      // Quick direct creation
      const bizId = '_biz_demo';
      const userId = '_usr_demo';
      const now = new Date().toISOString();
      const bizes = _getBizList();
      if (!bizes.find(b => b.id === bizId)) {
        bizes.push({
          id: bizId, name: 'Folio Studio', type: 'Design Agency',
          country: 'AU', currency: 'AUD', currencySymbol: '$',
          ownerId: userId, taxRate: 10, paymentTerms: 14,
          invPrefix: 'INV', quotePrefix: 'QUO', nextInv: 8, nextQuote: 5,
          email: 'alex@foliostudio.com', phone: '+61 400 123 456', website: 'foliostudio.com',
          abn: '12 345 678 901', address: '42 Collins St, Melbourne VIC 3000',
          paymentDetails: 'BSB: 063-000\nAccount: 12345678\nAccount Name: Folio Studio',
          onboardingComplete: true, createdAt: now,
        });
        _saveBizList(bizes);
      }
      if (!users.find(u => u.id === userId)) {
        users.push({
          id: userId, name: 'Alex Morgan', email: 'demo@folio.app',
          passwordHash: _hashPassword('demo123'), businessId: bizId,
          role: 'owner', status: 'active', permissions: ROLE_PERMISSIONS.owner,
          assignedProjects: [], assignedClients: [], lastActive: now, createdAt: now,
        });
        _saveUsers(users);
      }
    }
    document.getElementById('a-email') ? null : showAuthScreen('login');
    setTimeout(() => {
      const em = document.getElementById('a-email');
      const pw = document.getElementById('a-password');
      if (em) em.value = 'demo@folio.app';
      if (pw) pw.value = 'demo123';
      handleLogin();
    }, 100);
  } catch(e) {
    console.error(e);
  }
}

// ── Onboarding ──
let onboardingStep = 1;

function showOnboarding() {
  document.getElementById('app').style.display = 'none';
  let el = document.getElementById('onboarding-root');
  if (!el) { el = document.createElement('div'); el.id = 'onboarding-root'; document.body.appendChild(el); }
  el.style.display = 'flex';
  onboardingStep = 1;
  renderOnboardingStep();
}

function hideOnboarding() {
  const el = document.getElementById('onboarding-root');
  if (el) el.style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

function renderOnboardingStep() {
  const el = document.getElementById('onboarding-root');
  if (!el) return;
  const steps = ['Business Profile','Financial Settings','Invoice Branding','All Set!'];
  el.innerHTML = `
  <div class="ob-wrap">
    <div class="ob-header">
      <div class="ob-logo"><div class="logo-mark">F</div> <span>Folio</span></div>
      <div class="ob-steps">
        ${steps.map((s,i) => `<div class="ob-step ${onboardingStep > i+1 ? 'done' : onboardingStep === i+1 ? 'active' : ''}">
          <div class="ob-step-dot">${onboardingStep > i+1 ? '✓' : i+1}</div>
          <div class="ob-step-label">${s}</div>
        </div>`).join('<div class="ob-step-line"></div>')}
      </div>
    </div>
    <div class="ob-body">
      ${onboardingStep === 1 ? buildObStep1() : ''}
      ${onboardingStep === 2 ? buildObStep2() : ''}
      ${onboardingStep === 3 ? buildObStep3() : ''}
      ${onboardingStep === 4 ? buildObStep4() : ''}
    </div>
  </div>`;
}

function buildObStep1() {
  const b = currentBusiness;
  return `
  <div class="ob-card">
    <h2>Tell us about your business</h2>
    <p>This information will appear on your invoices and quotes.</p>
    <div class="ob-form">
      <div class="auth-grid-2">
        <div class="auth-field"><label>Business name</label><input class="auth-input" id="ob-biz" value="${b.name||''}"/></div>
        <div class="auth-field"><label>Owner name</label><input class="auth-input" id="ob-owner" value="${currentUser.name||''}"/></div>
      </div>
      <div class="auth-grid-2">
        <div class="auth-field"><label>Email</label><input class="auth-input" id="ob-email" value="${b.email||currentUser.email}"/></div>
        <div class="auth-field"><label>Phone</label><input class="auth-input" id="ob-phone" value="${b.phone||''}"/></div>
      </div>
      <div class="auth-grid-2">
        <div class="auth-field"><label>Website</label><input class="auth-input" id="ob-web" value="${b.website||''}"/></div>
        <div class="auth-field"><label>ABN / Tax Number</label><input class="auth-input" id="ob-abn" value="${b.abn||''}"/></div>
      </div>
      <div class="auth-field"><label>Business address</label><input class="auth-input" id="ob-addr" value="${b.address||''}"/></div>
    </div>
    <div class="ob-actions">
      <button class="auth-btn" onclick="obNext1()">Continue →</button>
    </div>
  </div>`;
}

function buildObStep2() {
  const b = currentBusiness;
  return `
  <div class="ob-card">
    <h2>Financial settings</h2>
    <p>Set your default tax rate and payment terms.</p>
    <div class="ob-form">
      <div class="auth-grid-2">
        <div class="auth-field"><label>Default tax rate (%)</label><input class="auth-input" type="number" id="ob-tax" value="${b.taxRate ?? 10}" min="0" max="100"/></div>
        <div class="auth-field"><label>Payment terms (days)</label><input class="auth-input" type="number" id="ob-terms" value="${b.paymentTerms ?? 14}" min="1"/></div>
      </div>
      <div class="auth-grid-2">
        <div class="auth-field"><label>Invoice prefix</label><input class="auth-input" id="ob-invpfx" value="${b.invPrefix || 'INV'}"/></div>
        <div class="auth-field"><label>Quote prefix</label><input class="auth-input" id="ob-qpfx" value="${b.quotePrefix || 'QUO'}"/></div>
      </div>
    </div>
    <div class="ob-actions">
      <button class="ob-back-btn" onclick="onboardingStep=1;renderOnboardingStep()">← Back</button>
      <button class="auth-btn" onclick="obNext2()">Continue →</button>
    </div>
  </div>`;
}

function buildObStep3() {
  const b = currentBusiness;
  return `
  <div class="ob-card">
    <h2>Payment & banking details</h2>
    <p>These will appear on your invoices so clients know how to pay you.</p>
    <div class="ob-form">
      <div class="auth-grid-2">
        <div class="auth-field"><label>Bank name</label><input class="auth-input" id="ob-bank" value="${b.bankName||''}"/></div>
        <div class="auth-field"><label>BSB / Sort code</label><input class="auth-input" id="ob-bsb" value="${b.bsb||''}"/></div>
      </div>
      <div class="auth-field"><label>Account number</label><input class="auth-input" id="ob-acct" value="${b.accountNo||''}"/></div>
      <div class="auth-field"><label>Payment instructions (shown on invoices)</label><textarea class="auth-input" id="ob-pay" rows="3">${b.paymentDetails||''}</textarea></div>
    </div>
    <div class="ob-actions">
      <button class="ob-back-btn" onclick="onboardingStep=2;renderOnboardingStep()">← Back</button>
      <button class="auth-btn" onclick="obNext3()">Continue →</button>
    </div>
  </div>`;
}

function buildObStep4() {
  return `
  <div class="ob-card ob-finish">
    <div class="ob-finish-icon">🎉</div>
    <h2>You're all set, ${currentUser.name.split(' ')[0]}!</h2>
    <p>Your Folio workspace is ready. Start by creating your first invoice or adding a client.</p>
    <div class="ob-finish-actions">
      <button class="auth-btn" onclick="finishOnboarding()">Go to Dashboard →</button>
    </div>
  </div>`;
}

function obNext1() {
  saveBusiness({
    name: document.getElementById('ob-biz')?.value.trim() || currentBusiness.name,
    email: document.getElementById('ob-email')?.value.trim(),
    phone: document.getElementById('ob-phone')?.value.trim(),
    website: document.getElementById('ob-web')?.value.trim(),
    abn: document.getElementById('ob-abn')?.value.trim(),
    address: document.getElementById('ob-addr')?.value.trim(),
  });
  updateTeamMember(currentUser.id, { name: document.getElementById('ob-owner')?.value.trim() || currentUser.name });
  onboardingStep = 2; renderOnboardingStep();
}

function obNext2() {
  saveBusiness({
    taxRate: parseFloat(document.getElementById('ob-tax')?.value) || 10,
    paymentTerms: parseInt(document.getElementById('ob-terms')?.value) || 14,
    invPrefix: document.getElementById('ob-invpfx')?.value.trim() || 'INV',
    quotePrefix: document.getElementById('ob-qpfx')?.value.trim() || 'QUO',
  });
  onboardingStep = 3; renderOnboardingStep();
}

function obNext3() {
  saveBusiness({
    bankName: document.getElementById('ob-bank')?.value.trim(),
    bsb: document.getElementById('ob-bsb')?.value.trim(),
    accountNo: document.getElementById('ob-acct')?.value.trim(),
    paymentDetails: document.getElementById('ob-pay')?.value.trim(),
  });
  onboardingStep = 4; renderOnboardingStep();
}

function finishOnboarding() {
  saveBusiness({ onboardingComplete: true });
  hideOnboarding();
  initApp();
}
