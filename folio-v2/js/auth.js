// ═══════════════════════════════════════════════════════════════
// FOLIO — Authentication System
// ═══════════════════════════════════════════════════════════════
//
// ARCHITECTURE NOTE:
// This file uses mock localStorage-based auth for GitHub Pages.
// To connect Firebase: replace mockAuth.* calls with firebase.auth.*
// To connect Supabase: replace mockAuth.* calls with supabase.auth.*
// The rest of the app reads from currentUser / currentBusiness only —
// so swapping the auth provider requires changes only in this file.
// ═══════════════════════════════════════════════════════════════

const AUTH_KEY = 'folio_auth_v1';
const USERS_KEY = 'folio_users_v1';
const BIZ_KEY   = 'folio_biz_v1';

// ── Current session (in-memory, populated on load) ──
let currentUser     = null;  // { id, email, name, businessId, role, permissions, ... }
let currentBusiness = null;  // { id, name, currency, ... }

// ── Mock auth store helpers ──
// REPLACE_WITH_BACKEND: These functions read/write to localStorage.
// With a real backend, these become API calls or SDK methods.
function _getUsers()    { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch(e) { return []; } }
function _saveUsers(u)  { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function _getBizList()  { try { return JSON.parse(localStorage.getItem(BIZ_KEY) || '[]'); } catch(e) { return []; } }
function _saveBizList(b){ localStorage.setItem(BIZ_KEY, JSON.stringify(b)); }
function _getSession()  { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch(e) { return null; } }
function _saveSession(s){ if(s) localStorage.setItem(AUTH_KEY, JSON.stringify(s)); else localStorage.removeItem(AUTH_KEY); }

// ── Permission defaults by role ──
const ROLE_PERMISSIONS = {
  owner: {
    dashboard:  { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    clients:    { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    leads:      { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    projects:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    tasks:      { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    time:       { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    invoices:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    quotes:     { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    expenses:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    reports:    { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    calendar:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    settings:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    team:       { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
  },
  admin: {
    dashboard:  { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    clients:    { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:false, manage:true  },
    leads:      { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:false, manage:true  },
    projects:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:false, manage:true  },
    tasks:      { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:false, manage:true  },
    time:       { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    invoices:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    quotes:     { view:true,  create:true,  edit:true,  delete:false, export:true,  approve:true,  manage:true  },
    expenses:   { view:true,  create:true,  edit:true,  delete:true,  export:true,  approve:true,  manage:true  },
    reports:    { view:true,  create:false, edit:false, delete:false, export:true,  approve:false, manage:false },
    calendar:   { view:true,  create:true,  edit:true,  delete:true,  export:false, approve:false, manage:false },
    settings:   { view:true,  create:false, edit:true,  delete:false, export:false, approve:false, manage:false },
    team:       { view:true,  create:true,  edit:true,  delete:false, export:false, approve:false, manage:false },
  },
  manager: {
    dashboard:  { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    clients:    { view:true,  create:true,  edit:true,  delete:false, export:false, approve:false, manage:false },
    leads:      { view:true,  create:true,  edit:true,  delete:false, export:false, approve:false, manage:false },
    projects:   { view:true,  create:true,  edit:true,  delete:false, export:false, approve:false, manage:true  },
    tasks:      { view:true,  create:true,  edit:true,  delete:true,  export:false, approve:true,  manage:true  },
    time:       { view:true,  create:true,  edit:true,  delete:false, export:true,  approve:false, manage:false },
    invoices:   { view:true,  create:true,  edit:true,  delete:false, export:true,  approve:false, manage:false },
    quotes:     { view:true,  create:true,  edit:true,  delete:false, export:true,  approve:false, manage:false },
    expenses:   { view:true,  create:true,  edit:false, delete:false, export:false, approve:false, manage:false },
    reports:    { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    calendar:   { view:true,  create:true,  edit:true,  delete:false, export:false, approve:false, manage:false },
    settings:   { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    team:       { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
  },
  employee: {
    dashboard:  { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    clients:    { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    leads:      { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    projects:   { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    tasks:      { view:true,  create:true,  edit:true,  delete:false, export:false, approve:false, manage:false },
    time:       { view:true,  create:true,  edit:true,  delete:false, export:false, approve:false, manage:false },
    invoices:   { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    quotes:     { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    expenses:   { view:true,  create:true,  edit:false, delete:false, export:false, approve:false, manage:false },
    reports:    { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    calendar:   { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    settings:   { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    team:       { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
  },
  accountant: {
    dashboard:  { view:true,  create:false, edit:false, delete:false, export:true,  approve:false, manage:false },
    clients:    { view:true,  create:false, edit:false, delete:false, export:true,  approve:false, manage:false },
    leads:      { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    projects:   { view:true,  create:false, edit:false, delete:false, export:true,  approve:false, manage:false },
    tasks:      { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    time:       { view:true,  create:false, edit:false, delete:false, export:true,  approve:false, manage:false },
    invoices:   { view:true,  create:false, edit:false, delete:false, export:true,  approve:true,  manage:false },
    quotes:     { view:true,  create:false, edit:false, delete:false, export:true,  approve:false, manage:false },
    expenses:   { view:true,  create:true,  edit:true,  delete:false, export:true,  approve:true,  manage:false },
    reports:    { view:true,  create:false, edit:false, delete:false, export:true,  approve:false, manage:false },
    calendar:   { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    settings:   { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    team:       { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
  },
  readonly: {
    dashboard:  { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    clients:    { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    leads:      { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    projects:   { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    tasks:      { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    time:       { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    invoices:   { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    quotes:     { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    expenses:   { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    reports:    { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    calendar:   { view:true,  create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    settings:   { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
    team:       { view:false, create:false, edit:false, delete:false, export:false, approve:false, manage:false },
  },
};

// ── Permission checking helpers ──
// USAGE: can('invoices', 'edit')  →  true/false
function can(module, action) {
  if (!currentUser) return false;
  if (currentUser.role === 'owner') return true; // owners always have access
  const perms = currentUser.permissions || {};
  return !!(perms[module] && perms[module][action]);
}

function canView(module)    { return can(module, 'view');   }
function canCreate(module)  { return can(module, 'create'); }
function canEdit(module)    { return can(module, 'edit');   }
function canDelete(module)  { return can(module, 'delete'); }
function canExport(module)  { return can(module, 'export'); }
function canApprove(module) { return can(module, 'approve');}
function canManage(module)  { return can(module, 'manage'); }
function isOwner()          { return currentUser?.role === 'owner'; }
function isAdmin()          { return ['owner','admin'].includes(currentUser?.role); }

// ── Auth operations ──
// REPLACE_WITH_BACKEND: These are mock implementations.

async function authSignUp({ name, businessName, email, password, businessType, country, currency }) {
  const users = _getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  const bizId = '_biz_' + Date.now();
  const userId = '_usr_' + Date.now();
  const now = new Date().toISOString();

  // Create business
  const business = {
    id: bizId,
    name: businessName,
    type: businessType,
    country,
    currency,
    currencySymbol: getCurrencySymbol(currency),
    ownerId: userId,
    taxRate: 10,
    paymentTerms: 14,
    invPrefix: 'INV',
    quotePrefix: 'QUO',
    nextInv: 1,
    nextQuote: 1,
    email: '',
    phone: '',
    website: '',
    abn: '',
    address: '',
    paymentDetails: '',
    onboardingComplete: false,
    createdAt: now,
  };

  // Create owner user
  const user = {
    id: userId,
    name,
    email,
    passwordHash: _hashPassword(password), // mock hash
    businessId: bizId,
    role: 'owner',
    status: 'active',
    permissions: ROLE_PERMISSIONS.owner,
    assignedProjects: [],
    assignedClients: [],
    avatar: null,
    notes: '',
    lastActive: now,
    createdAt: now,
  };

  const bizes = _getBizList();
  bizes.push(business);
  _saveBizList(bizes);
  users.push(user);
  _saveUsers(users);

  // Auto sign in
  _saveSession({ userId, businessId: bizId, loginAt: now });
  currentUser = user;
  currentBusiness = business;

  auditLog('auth', 'signed_up', 'Account created', { email });
  return { user, business };
}

async function authLogin({ email, password }) {
  const users = _getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('No account found with that email address.');
  if (user.status === 'suspended') throw new Error('Your account has been suspended. Contact your administrator.');
  if (!_checkPassword(password, user.passwordHash)) throw new Error('Incorrect password.');

  const bizes = _getBizList();
  const business = bizes.find(b => b.id === user.businessId);
  if (!business) throw new Error('Business account not found.');

  const now = new Date().toISOString();
  user.lastActive = now;
  _saveUsers(users);
  _saveSession({ userId: user.id, businessId: business.id, loginAt: now });
  currentUser = user;
  currentBusiness = business;

  auditLog('auth', 'signed_in', 'User signed in', { email });
  return { user, business };
}

function authLogout() {
  auditLog('auth', 'signed_out', 'User signed out', {});
  _saveSession(null);
  currentUser = null;
  currentBusiness = null;
  showAuthScreen();
}

function authRestoreSession() {
  // REPLACE_WITH_BACKEND: Check JWT token validity with server
  const session = _getSession();
  if (!session) return false;
  const users = _getUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user || user.status === 'suspended') { _saveSession(null); return false; }
  const bizes = _getBizList();
  const business = bizes.find(b => b.id === session.businessId);
  if (!business) { _saveSession(null); return false; }
  currentUser = user;
  currentBusiness = business;
  return true;
}

function authResetPassword(email) {
  // REPLACE_WITH_BACKEND: Send real reset email
  const users = _getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('No account found with that email.');
  // Mock: just show success toast
  return true;
}

function authUpdatePassword(userId, newPassword) {
  const users = _getUsers();
  const u = users.find(u => u.id === userId);
  if (!u) return;
  u.passwordHash = _hashPassword(newPassword);
  _saveUsers(users);
}

// ── Mock password helpers ──
// REPLACE_WITH_BACKEND: Use bcrypt or server-side hashing
function _hashPassword(pw) {
  // Simple obfuscation — NOT real security, just for demo
  return btoa(pw + '_folio_salt_2024');
}
function _checkPassword(pw, hash) {
  return _hashPassword(pw) === hash;
}

function getCurrencySymbol(code) {
  const map = { AUD:'$', USD:'$', GBP:'£', EUR:'€', NZD:'$', CAD:'$', SGD:'S$', HKD:'HK$', JPY:'¥', INR:'₹' };
  return map[code] || '$';
}

// ── Business helpers ──
function saveBusiness(updates) {
  const bizes = _getBizList();
  const idx = bizes.findIndex(b => b.id === currentBusiness.id);
  if (idx >= 0) {
    bizes[idx] = { ...bizes[idx], ...updates };
    currentBusiness = bizes[idx];
    _saveBizList(bizes);
  }
}

// ── User management (team) ──
function getTeamMembers() {
  return _getUsers().filter(u => u.businessId === currentBusiness?.id);
}

function inviteTeamMember({ name, email, role, notes }) {
  const users = _getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('A user with that email already exists.');
  }
  const now = new Date().toISOString();
  const user = {
    id: '_usr_' + Date.now() + Math.random().toString(36).slice(2,5),
    name: name || email.split('@')[0],
    email,
    passwordHash: _hashPassword('Welcome1!'), // temp password
    businessId: currentBusiness.id,
    role: role || 'employee',
    status: 'invited',
    permissions: JSON.parse(JSON.stringify(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee)),
    assignedProjects: [],
    assignedClients: [],
    avatar: null,
    notes: notes || '',
    lastActive: null,
    createdAt: now,
    invitedBy: currentUser.id,
  };
  users.push(user);
  _saveUsers(users);
  auditLog('team', 'member_invited', `Invited ${email}`, { email, role });
  return user;
}

function updateTeamMember(userId, updates) {
  const users = _getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx < 0) return;
  users[idx] = { ...users[idx], ...updates };
  _saveUsers(users);
  if (currentUser.id === userId) currentUser = users[idx];
  auditLog('team', 'member_updated', `Updated ${users[idx].name}`, { userId });
}

function suspendTeamMember(userId) {
  updateTeamMember(userId, { status: 'suspended' });
  auditLog('team', 'member_suspended', `Suspended user ${userId}`, { userId });
}

function removeTeamMember(userId) {
  const users = _getUsers();
  const user = users.find(u => u.id === userId);
  const filtered = users.filter(u => u.id !== userId);
  _saveUsers(filtered);
  auditLog('team', 'member_removed', `Removed ${user?.name || userId}`, { userId });
}

function updatePermissions(userId, newPerms) {
  updateTeamMember(userId, { permissions: newPerms });
  auditLog('team', 'permissions_changed', `Permissions updated for ${userId}`, { userId });
}

function setRole(userId, role) {
  const defaultPerms = JSON.parse(JSON.stringify(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee));
  updateTeamMember(userId, { role, permissions: defaultPerms });
  auditLog('team', 'role_changed', `Role changed to ${role} for ${userId}`, { userId, role });
}

// ── Audit log ──
const AUDIT_KEY = 'folio_audit_v1';

function auditLog(module, action, description, details = {}) {
  // REPLACE_WITH_BACKEND: Write to server audit log
  try {
    const logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    logs.unshift({
      id: '_log_' + Date.now(),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      userEmail: currentUser?.email || '',
      businessId: currentBusiness?.id || '',
      module,
      action,
      description,
      details,
      timestamp: new Date().toISOString(),
      device: navigator.userAgent.slice(0, 80),
      // REPLACE_WITH_BACKEND: Real IP from server
      ip: '—',
    });
    // Keep last 500 entries
    if (logs.length > 500) logs.splice(500);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
  } catch(e) {}
}

function getAuditLogs(limit = 100) {
  try {
    const all = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    return all.filter(l => l.businessId === currentBusiness?.id).slice(0, limit);
  } catch(e) { return []; }
}
