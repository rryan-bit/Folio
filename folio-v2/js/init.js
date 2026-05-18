// ═══════════════════════════════════════════════════════════════
// FOLIO — App Bootstrap
// Runs last. Restores session or shows auth screen.
// ═══════════════════════════════════════════════════════════════

// ── App state (business data) ──
let S = {};

const DB = 'folio_v4';

function loadAppData() {
  try {
    const raw = localStorage.getItem(DB + '_' + currentBusiness.id);
    if (raw) {
      S = JSON.parse(raw);
    } else {
      // First time for this business — load sample data
      S = getSampleData();
      saveAppData();
    }
  } catch(e) {
    S = getSampleData();
  }
}

function saveAppData() {
  if (!currentBusiness) return;
  try {
    localStorage.setItem(DB + '_' + currentBusiness.id, JSON.stringify(S));
  } catch(e) {
    console.warn('Could not save app data:', e);
  }
}

// Legacy alias
function saveAppData() { saveAppData(); }

// ── Sample data ──
function getSampleData() {
  const dt = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
  const mo = (n) => { const d = new Date(); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0,10); };

  const clients = [
    { id:'c1', name:'Apex Digital',   company:'Apex Digital Pty Ltd',          email:'sarah@apexdigital.com', phone:'+61 400 001 001', website:'apexdigital.com',  address:'1 Tech Park, Sydney NSW 2000',       currency:'AUD', notes:'Long-term retainer. Pays on time.',  tags:['agency','tech'],     status:'active', createdAt:mo(-8) },
    { id:'c2', name:'Nova Brands',    company:'Nova Brands International',      email:'mike@novabrands.com',   phone:'+61 400 002 002', website:'novabrands.com',   address:'8 Brand Ave, Melbourne VIC 3000',    currency:'AUD', notes:'Requires NDA. Slow approvals.',      tags:['brand','marketing'], status:'active', createdAt:mo(-6) },
    { id:'c3', name:'Stellar Labs',   company:'Stellar Labs Inc',               email:'jane@stellarlabs.io',  phone:'+1 555 003 003',  website:'stellarlabs.io',   address:'100 Innovation Dr, San Francisco CA',currency:'USD', notes:'US startup. Fast-moving.',           tags:['startup','tech'],    status:'active', createdAt:mo(-4) },
    { id:'c4', name:'Green Earth Co', company:'Green Earth Co',                 email:'tom@greenearth.co',    phone:'+61 400 004 004', website:'greenearth.co',    address:'22 Eco Lane, Brisbane QLD 4000',     currency:'AUD', notes:'Sustainability brand.',              tags:['ecommerce'],         status:'active', createdAt:mo(-3) },
    { id:'c5', name:'Flux Agency',    company:'Flux Creative Agency',           email:'lisa@fluxagency.com',  phone:'+61 400 005 005', website:'fluxagency.com',   address:'5 Design St, Adelaide SA 5000',      currency:'AUD', notes:'Monthly retainer. Referred by Apex.', tags:['agency'],           status:'inactive',createdAt:mo(-12) },
  ];

  const leads = [
    { id:'l1', name:'James Wilson', company:'PulseMedia',  email:'j.wilson@pulse.com',     phone:'+61 400 100 001', value:12000, source:'Referral',     stage:'proposal',     prob:70, notes:'Full brand redesign + website.', followUp:dt(3),  createdAt:dt(-14) },
    { id:'l2', name:'Priya Sharma', company:'DataStack',   email:'priya@datastack.io',     phone:'+1 555 200 002',  value:8500,  source:'LinkedIn',     stage:'contacted',    prob:40, notes:'MVP design for SaaS product.',   followUp:dt(1),  createdAt:dt(-7)  },
    { id:'l3', name:'Carlos Mendez',company:'Viva Foods',  email:'carlos@vivafoods.com',   phone:'+61 400 300 003', value:5000,  source:'Website',      stage:'new',          prob:20, notes:'Packaging redesign.',            followUp:dt(5),  createdAt:dt(-3)  },
    { id:'l4', name:'Rachel Kim',   company:'FlowHR',      email:'r.kim@flowhr.com',       phone:'+61 400 400 004', value:18000, source:'Conference',   stage:'negotiation',  prob:85, notes:'UX audit + design system.',      followUp:dt(-1), createdAt:dt(-21) },
    { id:'l5', name:'Tom Baker',    company:'BlueSky',     email:'tom@bluesky.travel',     phone:'+61 400 500 005', value:7200,  source:'Cold Outreach', stage:'won',         prob:100,notes:'Won! Converting.',              followUp:null,   createdAt:dt(-30) },
  ];

  const projects = [
    { id:'p1', name:'Apex Website Redesign', clientId:'c1', desc:'Full redesign of Apex Digital website.', start:mo(-2), deadline:dt(14), budget:12000, rate:150, status:'active',   priority:'high',   progress:65,  tags:['web'],       notes:'Using Webflow.' },
    { id:'p2', name:'Nova Brand Identity',   clientId:'c2', desc:'Complete brand identity system.',        start:mo(-1), deadline:dt(21), budget:8500,  rate:140, status:'active',   priority:'high',   progress:40,  tags:['branding'],  notes:'Phase 1 approved.' },
    { id:'p3', name:'Stellar App UI',        clientId:'c3', desc:'UI/UX for SaaS dashboard.',              start:mo(-3), deadline:dt(-7), budget:9800,  rate:160, status:'complete', priority:'medium', progress:100, tags:['ui','saas'], notes:'Delivered.' },
    { id:'p4', name:'Green Earth Packaging', clientId:'c4', desc:'Eco-friendly packaging design.',         start:dt(-7), deadline:dt(30), budget:4500,  rate:120, status:'active',   priority:'low',    progress:20,  tags:['packaging'], notes:'Concepts in progress.' },
  ];

  const tasks = [
    { id:'t1', title:'Homepage wireframes',       projectId:'p1', clientId:'c1', desc:'Low-fi wireframes', priority:'high',   status:'done',       due:dt(-2), createdAt:dt(-10) },
    { id:'t2', title:'Mobile responsive review',  projectId:'p1', clientId:'c1', desc:'Fix all breakpoints',priority:'high',  status:'inprogress', due:dt(2),  createdAt:dt(-5)  },
    { id:'t3', title:'Logo concept A & B',        projectId:'p2', clientId:'c2', desc:'Two directions',    priority:'high',   status:'inprogress', due:dt(3),  createdAt:dt(-8)  },
    { id:'t4', title:'Colour palette sign-off',   projectId:'p2', clientId:'c2', desc:'Final approval',    priority:'medium', status:'todo',       due:dt(10), createdAt:dt(-3)  },
    { id:'t5', title:'Client feedback review',    projectId:'p1', clientId:'c1', desc:'Action comments',   priority:'medium', status:'todo',       due:dt(4),  createdAt:dt(-2)  },
    { id:'t6', title:'Packaging mock renders',    projectId:'p4', clientId:'c4', desc:'3D renders',        priority:'low',    status:'todo',       due:dt(15), createdAt:dt(-1)  },
    { id:'t7', title:'Follow up INV-004',         projectId:null, clientId:'c2', desc:'Chase payment',     priority:'high',   status:'todo',       due:dt(-3), createdAt:dt(-5)  },
  ];

  const timeEntries = [
    { id:'te1', projectId:'p1', clientId:'c1', desc:'Homepage wireframes',    date:dt(-2), duration:180, billable:true,  rate:150, billed:true  },
    { id:'te2', projectId:'p1', clientId:'c1', desc:'Mobile responsive fixes', date:dt(-1), duration:240, billable:true,  rate:150, billed:false },
    { id:'te3', projectId:'p2', clientId:'c2', desc:'Logo concept sketching',  date:dt(-1), duration:300, billable:true,  rate:140, billed:false },
    { id:'te4', projectId:'p1', clientId:'c1', desc:'Client call',             date:dt(0),  duration:60,  billable:true,  rate:150, billed:false },
    { id:'te5', projectId:null, clientId:null, desc:'Admin & emails',          date:dt(0),  duration:90,  billable:false, rate:0,   billed:false },
  ];

  const invoices = [
    { id:'inv1', number:'INV-001', clientId:'c1', projectId:'p1', date:mo(-5), due:mo(-4), status:'paid',   notes:'Phase 1.',           taxRate:10, discount:0,  items:[{id:'li1',desc:'Brand Strategy',    qty:1,rate:3500},{id:'li2',desc:'UX Workshop',qty:2,rate:1200}], payments:[{id:'p1',amount:5940,date:mo(-4),method:'Bank Transfer',ref:'REF-001'}] },
    { id:'inv2', number:'INV-002', clientId:'c5', projectId:null, date:mo(-4), due:mo(-3), status:'paid',   notes:'Monthly retainer.',  taxRate:10, discount:0,  items:[{id:'li3',desc:'Design Retainer',   qty:1,rate:4000}],                                               payments:[{id:'p2',amount:4400,date:mo(-3),method:'Bank Transfer',ref:'REF-002'}] },
    { id:'inv3', number:'INV-003', clientId:'c3', projectId:'p3', date:mo(-2), due:mo(-1), status:'paid',   notes:'Final delivery.',    taxRate:0,  discount:5,  items:[{id:'li4',desc:'UI Design System',  qty:1,rate:9800}],                                               payments:[{id:'p3',amount:9310,date:mo(-1),method:'PayPal',        ref:'PP-003'}]  },
    { id:'inv4', number:'INV-004', clientId:'c2', projectId:'p2', date:mo(-1), due:dt(-10),status:'sent',   notes:'Phase 1 branding.',  taxRate:10, discount:0,  items:[{id:'li5',desc:'Brand Identity',    qty:1,rate:4250},{id:'li6',desc:'Logo Design',qty:1,rate:1800}], payments:[] },
    { id:'inv5', number:'INV-005', clientId:'c1', projectId:'p1', date:dt(-7), due:dt(7),  status:'sent',   notes:'Phase 2 milestone.', taxRate:10, discount:0,  items:[{id:'li7',desc:'Website Design P2', qty:1,rate:6000},{id:'li8',desc:'Content',    qty:3,rate:400}],  payments:[] },
    { id:'inv6', number:'INV-006', clientId:'c4', projectId:'p4', date:dt(-2), due:dt(12), status:'draft',  notes:'Initial deposit.',   taxRate:10, discount:10, items:[{id:'li9',desc:'Packaging Phase 1', qty:1,rate:2250}],                                               payments:[] },
    { id:'inv7', number:'INV-007', clientId:'c1', projectId:'p1', date:dt(-1), due:dt(13), status:'unpaid', notes:'',                   taxRate:10, discount:0,  items:[{id:'li10',desc:'SEO Consultation',qty:4,rate:200}],                                                payments:[] },
  ];

  const quotes = [
    { id:'q1', number:'QUO-001', clientId:'c1', date:mo(-3), expiry:mo(-2), status:'accepted', notes:'Full website package.', taxRate:10, discount:0,  items:[{id:'qi1',desc:'Website Redesign Package',qty:1,rate:12000}] },
    { id:'q2', number:'QUO-002', clientId:'c2', date:mo(-2), expiry:mo(-1), status:'accepted', notes:'Brand identity.',       taxRate:10, discount:0,  items:[{id:'qi2',desc:'Brand Identity System',    qty:1,rate:8500 }] },
    { id:'q3', number:'QUO-003', clientId:null, leadId:'l1', date:dt(-5),  expiry:dt(25),     status:'sent',    notes:'Rebrand + web.',       taxRate:10, discount:5,  items:[{id:'qi3',desc:'Brand Strategy',qty:1,rate:3500},{id:'qi4',desc:'Web Design',qty:1,rate:8500}] },
    { id:'q4', number:'QUO-004', clientId:null, leadId:'l4', date:dt(-2),  expiry:dt(28),     status:'draft',   notes:'UX audit.',            taxRate:10, discount:0,  items:[{id:'qi5',desc:'UX Audit',      qty:1,rate:6000},{id:'qi6',desc:'Design System',qty:1,rate:12000}] },
  ];

  const expenses = [
    { id:'ex1', desc:'Adobe Creative Cloud', merchant:'Adobe',      cat:'Software',      amount:89.99, date:mo(-1), tax:9,     method:'Credit Card', projectId:null, deductible:true,  notes:'Annual sub' },
    { id:'ex2', desc:'Figma Professional',   merchant:'Figma',      cat:'Software',      amount:45,    date:mo(-1), tax:4.5,   method:'Credit Card', projectId:null, deductible:true,  notes:''           },
    { id:'ex3', desc:'Client lunch — Apex',  merchant:'Butter Rest', cat:'Meals',        amount:128.50,date:dt(-10),tax:12.85, method:'Credit Card', projectId:'p1', deductible:true,  notes:'Kickoff'    },
    { id:'ex4', desc:'Stock photos',         merchant:'Unsplash',   cat:'Subscriptions', amount:12,    date:dt(-5), tax:1.2,   method:'Credit Card', projectId:'p2', deductible:true,  notes:''           },
    { id:'ex5', desc:'Office supplies',      merchant:'Officeworks', cat:'Office',       amount:67.40, date:dt(-3), tax:6.74,  method:'Debit Card',  projectId:null, deductible:true,  notes:''           },
    { id:'ex6', desc:'Webflow Team',         merchant:'Webflow',    cat:'Software',      amount:58,    date:dt(-2), tax:5.8,   method:'Credit Card', projectId:'p1', deductible:true,  notes:''           },
    { id:'ex7', desc:'SYD→MEL flight',       merchant:'Qantas',     cat:'Travel',        amount:342,   date:dt(-15),tax:34.2,  method:'Credit Card', projectId:null, deductible:true,  notes:'Client trip'},
  ];

  const activity = [
    { id:'a1', type:'invoice', action:'marked as paid', entity:'INV-003', entityId:'inv3', date:dt(-1), icon:'💰' },
    { id:'a2', type:'project', action:'created',        entity:'Green Earth Packaging', entityId:'p4', date:dt(-7),  icon:'📁' },
    { id:'a3', type:'client',  action:'added',          entity:'Green Earth Co',        entityId:'c4', date:dt(-7),  icon:'👤' },
    { id:'a4', type:'invoice', action:'sent',           entity:'INV-005',               entityId:'inv5',date:dt(-7), icon:'📄' },
    { id:'a5', type:'quote',   action:'sent',           entity:'QUO-003',               entityId:'q3', date:dt(-5),  icon:'📋' },
    { id:'a6', type:'task',    action:'completed',      entity:'Homepage wireframes',   entityId:'t1', date:dt(-2),  icon:'✅' },
  ];

  return { clients, leads, projects, tasks, timeEntries, invoices, quotes, expenses, activity };
}

// ── Main app init (called after auth) ──
function initApp() {
  // Load this business's data
  loadAppData();

  // Apply theme
  setTheme(currentBusiness.theme || 'light');

  // Build UI
  updateSidebar();
  updateBadges();
  updateTopbarUser();

  // Show/hide mobile menu button
  const mb = document.getElementById('menu-btn');
  if (mb) mb.style.display = window.innerWidth <= 900 ? 'flex' : 'none';

  window.addEventListener('resize', () => {
    const mb = document.getElementById('menu-btn');
    if (mb) mb.style.display = window.innerWidth <= 900 ? 'flex' : 'none';
  });

  // Sidebar overlay click to close
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Navigate to dashboard
  currentPage = '';
  nav('dashboard');

  auditLog('app', 'app_loaded', 'App loaded', {});
}

// ── Bootstrap ──
(function bootstrap() {
  // Try to restore session
  if (authRestoreSession()) {
    // Session found — go straight to app
    hideAuthScreen();
    if (!currentBusiness.onboardingComplete) {
      showOnboarding();
    } else {
      initApp();
    }
  } else {
    // No session — show login
    showAuthScreen('login');
  }
})();
