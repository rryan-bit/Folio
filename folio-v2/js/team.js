// ═══════════════════════════════════════════════════════════════
// FOLIO — Team Management & Permissions
// ═══════════════════════════════════════════════════════════════

const MODULES = [
  { id:'dashboard', label:'Dashboard' },
  { id:'clients',   label:'Clients'   },
  { id:'leads',     label:'Pipeline'  },
  { id:'projects',  label:'Projects'  },
  { id:'tasks',     label:'Tasks'     },
  { id:'time',      label:'Time'      },
  { id:'invoices',  label:'Invoices'  },
  { id:'quotes',    label:'Quotes'    },
  { id:'expenses',  label:'Expenses'  },
  { id:'reports',   label:'Reports'   },
  { id:'calendar',  label:'Calendar'  },
  { id:'settings',  label:'Settings'  },
  { id:'team',      label:'Team'      },
];
const ACTIONS = ['view','create','edit','delete','export','approve','manage'];

const ROLE_LABELS = {
  owner: 'Owner', admin: 'Admin', manager: 'Manager',
  employee: 'Employee', accountant: 'Accountant', readonly: 'Read-only'
};
const ROLE_COLORS = {
  owner:'b-purple', admin:'b-blue', manager:'b-teal',
  employee:'b-green', accountant:'b-amber', readonly:'b-gray'
};
const STATUS_COLORS = { active:'b-green', invited:'b-amber', suspended:'b-red', inactive:'b-gray' };

let teamFilter = '';
let teamRoleF  = '';

function renderTeam() {
  if (!canView('team')) { renderAccessDenied('team'); return; }

  const members = getTeamMembers();
  let list = members;
  if (teamFilter) list = list.filter(m =>
    m.name.toLowerCase().includes(teamFilter) ||
    m.email.toLowerCase().includes(teamFilter)
  );
  if (teamRoleF) list = list.filter(m => m.role === teamRoleF);

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    invited: members.filter(m => m.status === 'invited').length,
    suspended: members.filter(m => m.status === 'suspended').length,
  };

  document.getElementById('page-team').innerHTML = `
  <div class="ph">
    <div class="ph-left">
      <h1>Team</h1>
      <p>${stats.total} member${stats.total !== 1 ? 's' : ''} · ${stats.active} active · ${stats.invited > 0 ? stats.invited + ' pending invite' + (stats.invited > 1 ? 's' : '') : ''}</p>
    </div>
    <div class="ph-right">
      ${canCreate('team') ? `<button class="btn btn-primary" onclick="openInviteModal()">+ Invite Member</button>` : ''}
    </div>
  </div>

  <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:18px">
    <div class="stat"><div class="stat-lbl">Total Members</div><div class="stat-val b">${stats.total}</div></div>
    <div class="stat"><div class="stat-lbl">Active</div><div class="stat-val g">${stats.active}</div></div>
    <div class="stat"><div class="stat-lbl">Pending Invites</div><div class="stat-val o">${stats.invited}</div></div>
    <div class="stat"><div class="stat-lbl">Suspended</div><div class="stat-val r">${stats.suspended}</div></div>
  </div>

  <div class="filters">
    <div class="fsearch"><span>🔍</span>
      <input placeholder="Search by name or email…" value="${teamFilter}"
        oninput="teamFilter=this.value.toLowerCase();renderTeam()"/>
    </div>
    <select class="fsel" onchange="teamRoleF=this.value;renderTeam()">
      <option value="">All Roles</option>
      ${Object.entries(ROLE_LABELS).map(([v,l]) => `<option value="${v}" ${teamRoleF===v?'selected':''}>${l}</option>`).join('')}
    </select>
  </div>

  <div class="card">
    ${list.length === 0 ? `
      <div class="empty">
        <div class="empty-ic">👥</div>
        <h3>No team members yet</h3>
        <p>Invite your team to collaborate on projects, track time, and manage clients.</p>
        ${canCreate('team') ? `<button class="btn btn-primary" onclick="openInviteModal()">+ Invite Member</button>` : ''}
      </div>
    ` : `
      <div class="tbl-wrap"><table>
        <thead><tr>
          <th>Member</th><th>Role</th><th>Status</th>
          <th>Last Active</th><th>Projects</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${list.map(m => {
            const isSelf = m.id === currentUser.id;
            const isCurrentOwner = m.role === 'owner';
            return `<tr>
              <td>
                <div class="flex items-c gap2">
                  <div class="av av-sm" style="background:${avColor(m.name)}">${initials(m.name)}</div>
                  <div>
                    <div class="td-bold">${m.name} ${isSelf ? '<span class="badge b-gray" style="font-size:10px">You</span>' : ''}</div>
                    <div class="td-muted">${m.email}</div>
                  </div>
                </div>
              </td>
              <td><span class="badge ${ROLE_COLORS[m.role]||'b-gray'}">${ROLE_LABELS[m.role]||m.role}</span></td>
              <td><span class="badge ${STATUS_COLORS[m.status]||'b-gray'}">${m.status}</span></td>
              <td class="td-muted">${m.lastActive ? fmtShort(m.lastActive.slice(0,10)) : '—'}</td>
              <td class="td-muted">${m.assignedProjects?.length || 0} project${(m.assignedProjects?.length||0) !== 1 ? 's' : ''}</td>
              <td>
                <div class="flex gap1 flex-wrap">
                  <button class="btn btn-xs btn-secondary" onclick="openMemberModal('${m.id}')">View</button>
                  ${canEdit('team') && !isSelf && !isCurrentOwner ? `
                    <button class="btn btn-xs btn-secondary" onclick="openPermissionsModal('${m.id}')">Permissions</button>
                    ${m.status !== 'suspended'
                      ? `<button class="btn btn-xs btn-danger" onclick="doSuspend('${m.id}')">Suspend</button>`
                      : `<button class="btn btn-xs btn-success" onclick="doActivate('${m.id}')">Restore</button>`}
                  ` : ''}
                  ${canDelete('team') && !isSelf && !isCurrentOwner
                    ? `<button class="btn btn-xs btn-danger" onclick="doRemoveMember('${m.id}')">Remove</button>`
                    : ''}
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
    `}
  </div>`;
}

function openInviteModal() {
  showModal(`<div class="modal-ov"><div class="modal">
    <div class="modal-hd"><h2>Invite Team Member</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid">
        <div class="fg"><label>Full Name</label><input class="fc" id="inv-name" placeholder="Jane Smith"/></div>
        <div class="fg"><label>Email <span class="req">*</span></label><input class="fc" id="inv-email" type="email" placeholder="jane@company.com"/></div>
        <div class="fg s2"><label>Role</label>
          <select class="fc" id="inv-role">
            ${Object.entries(ROLE_LABELS).filter(([v]) => v !== 'owner').map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
          </select>
        </div>
        <div class="fg s2"><label>Notes</label><textarea class="fc" id="inv-notes" rows="2" placeholder="Optional notes about this person…"></textarea></div>
      </div>
      <div class="alert alert-info" style="margin-top:12px">
        <span>ℹ</span> In this demo, the member will be added with a temporary password of <strong>Welcome1!</strong>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="doInvite()">Send Invitation</button>
    </div>
  </div></div>`);
}

function doInvite() {
  const email = document.getElementById('inv-email')?.value.trim();
  const name  = document.getElementById('inv-name')?.value.trim();
  const role  = document.getElementById('inv-role')?.value;
  const notes = document.getElementById('inv-notes')?.value.trim();
  if (!email) { toast('Email is required','e'); return; }
  try {
    inviteTeamMember({ name, email, role, notes });
    closeModal();
    toast(`${name || email} invited successfully`, 's');
    renderTeam();
  } catch(e) {
    toast(e.message, 'e');
  }
}

function openMemberModal(userId) {
  const member = getTeamMembers().find(m => m.id === userId);
  if (!member) return;
  const allProjects = S?.projects || [];

  showModal(`<div class="modal-ov"><div class="modal lg">
    <div class="modal-hd"><h2>Member Profile</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="flex items-c gap3 mb4" style="padding:14px;background:var(--surface2);border-radius:var(--r);border:1px solid var(--border)">
        <div class="av av-lg" style="background:${avColor(member.name)}">${initials(member.name)}</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:800;letter-spacing:-.02em">${member.name}</div>
          <div style="font-size:13px;color:var(--muted)">${member.email}</div>
          <div style="display:flex;gap:6px;margin-top:6px">
            <span class="badge ${ROLE_COLORS[member.role]||'b-gray'}">${ROLE_LABELS[member.role]||member.role}</span>
            <span class="badge ${STATUS_COLORS[member.status]||'b-gray'}">${member.status}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div class="fs12 tc-m">Last active</div>
          <div class="fw6 fs12">${member.lastActive ? fmtDate(member.lastActive.slice(0,10)) : 'Never'}</div>
          <div class="fs12 tc-m mt-1">Member since</div>
          <div class="fw6 fs12">${fmtDate(member.createdAt.slice(0,10))}</div>
        </div>
      </div>

      ${canEdit('team') && member.id !== currentUser.id && member.role !== 'owner' ? `
      <div class="fgrid" style="margin-bottom:14px">
        <div class="fg"><label class="form-label">Name</label><input class="fc" id="mp-name" value="${member.name}"/></div>
        <div class="fg"><label class="form-label">Role</label>
          <select class="fc" id="mp-role" onchange="onRoleChange(this.value)">
            ${Object.entries(ROLE_LABELS).filter(([v]) => v !== 'owner').map(([v,l]) => `<option value="${v}" ${member.role===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="fg s2"><label class="form-label">Notes</label><textarea class="fc" id="mp-notes" rows="2">${member.notes||''}</textarea></div>
        <div class="fg s2"><label class="form-label">Assigned Projects</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
            ${allProjects.map(p => `
              <label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer">
                <input type="checkbox" ${(member.assignedProjects||[]).includes(p.id)?'checked':''} onchange="toggleProjectAssign('${member.id}','${p.id}',this.checked)"/>
                ${p.name}
              </label>`).join('')}
            ${allProjects.length === 0 ? '<span class="tc-m fs12">No projects created yet</span>' : ''}
          </div>
        </div>
      </div>
      ` : ''}

      <div class="sec-div"></div>
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:10px">Permission Summary</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px">
        ${MODULES.map(mod => {
          const p = member.permissions?.[mod.id] || {};
          const granted = Object.values(p).filter(Boolean).length;
          return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 10px">
            <div style="font-size:12px;font-weight:600;margin-bottom:3px">${mod.label}</div>
            <div style="font-size:11px;color:${granted>0?'var(--green)':'var(--muted)'}">${granted > 0 ? granted + ' permission' + (granted !== 1 ? 's' : '') : 'No access'}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Close</button>
      ${canEdit('team') && member.id !== currentUser.id && member.role !== 'owner' ? `
        <button class="btn btn-secondary" onclick="openPermissionsModal('${userId}')">Edit Permissions</button>
        <button class="btn btn-primary" onclick="saveMemberProfile('${userId}')">Save Changes</button>
      ` : ''}
    </div>
  </div></div>`);
}

function saveMemberProfile(userId) {
  const name  = document.getElementById('mp-name')?.value.trim();
  const role  = document.getElementById('mp-role')?.value;
  const notes = document.getElementById('mp-notes')?.value.trim();
  if (!name) { toast('Name required', 'e'); return; }
  const updates = { name, notes };
  if (role) {
    const members = getTeamMembers();
    const m = members.find(m => m.id === userId);
    if (m && m.role !== role) {
      // Role changed — reset permissions to role defaults
      updates.role = role;
      updates.permissions = JSON.parse(JSON.stringify(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee));
    }
  }
  updateTeamMember(userId, updates);
  closeModal();
  toast('Profile updated', 's');
  renderTeam();
}

function toggleProjectAssign(userId, projectId, checked) {
  const member = getTeamMembers().find(m => m.id === userId);
  if (!member) return;
  let assigned = [...(member.assignedProjects || [])];
  if (checked) { if (!assigned.includes(projectId)) assigned.push(projectId); }
  else { assigned = assigned.filter(id => id !== projectId); }
  updateTeamMember(userId, { assignedProjects: assigned });
}

function openPermissionsModal(userId) {
  const member = getTeamMembers().find(m => m.id === userId);
  if (!member) return;

  showModal(`<div class="modal-ov"><div class="modal xl">
    <div class="modal-hd">
      <div>
        <h2>Permissions — ${member.name}</h2>
        <div style="font-size:12px;color:var(--muted);margin-top:2px">
          <span class="badge ${ROLE_COLORS[member.role]||'b-gray'}">${ROLE_LABELS[member.role]||member.role}</span>
          Customize this member's exact access rights
        </div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="flex gap2 mb4" style="flex-wrap:wrap">
        <span style="font-size:12px;color:var(--muted);padding-top:7px">Reset to role default:</span>
        ${Object.entries(ROLE_LABELS).filter(([v]) => v !== 'owner').map(([v,l]) =>
          `<button class="btn btn-xs btn-secondary" onclick="resetToRole('${userId}','${v}')">${l}</button>`
        ).join('')}
      </div>
      <div style="overflow-x:auto">
        <table style="min-width:700px">
          <thead>
            <tr>
              <th style="width:130px">Module</th>
              ${ACTIONS.map(a => `<th style="text-align:center;width:70px">${a.charAt(0).toUpperCase()+a.slice(1)}</th>`).join('')}
            </tr>
          </thead>
          <tbody id="perm-table-body">
            ${MODULES.map(mod => {
              const p = member.permissions?.[mod.id] || {};
              return `<tr>
                <td class="fw6" style="font-size:13px">${mod.label}</td>
                ${ACTIONS.map(action => `
                  <td style="text-align:center">
                    <input type="checkbox" class="perm-cb"
                      data-module="${mod.id}" data-action="${action}"
                      ${p[action] ? 'checked' : ''}
                      onchange="permCbChange(this)"/>
                  </td>`).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="alert alert-info" style="margin-top:12px">
        <span>ℹ</span> Changes take effect immediately. The user will see updated access on their next page load.
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="savePermissions('${userId}')">Save Permissions</button>
    </div>
  </div></div>`);
}

// Collect permissions from checkboxes
function permCbChange(cb) {
  // If un-checking 'view', also uncheck everything else for that module
  if (!cb.checked && cb.dataset.action === 'view') {
    const mod = cb.dataset.module;
    document.querySelectorAll(`.perm-cb[data-module="${mod}"]`).forEach(c => c.checked = false);
  }
  // If checking any action other than view, also check view
  if (cb.checked && cb.dataset.action !== 'view') {
    const viewCb = document.querySelector(`.perm-cb[data-module="${cb.dataset.module}"][data-action="view"]`);
    if (viewCb) viewCb.checked = true;
  }
}

function savePermissions(userId) {
  const perms = {};
  MODULES.forEach(mod => {
    perms[mod.id] = {};
    ACTIONS.forEach(action => {
      const cb = document.querySelector(`.perm-cb[data-module="${mod.id}"][data-action="${action}"]`);
      perms[mod.id][action] = cb ? cb.checked : false;
    });
  });
  updatePermissions(userId, perms);
  closeModal();
  toast('Permissions saved', 's');
  renderTeam();
}

function resetToRole(userId, role) {
  const defaultPerms = JSON.parse(JSON.stringify(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee));
  MODULES.forEach(mod => {
    ACTIONS.forEach(action => {
      const cb = document.querySelector(`.perm-cb[data-module="${mod.id}"][data-action="${action}"]`);
      if (cb) cb.checked = !!(defaultPerms[mod.id]?.[action]);
    });
  });
  toast(`Reset to ${ROLE_LABELS[role]} defaults`, 's');
}

function doSuspend(userId) {
  confirm2('Suspend this team member? They will lose access immediately.', () => {
    suspendTeamMember(userId);
    toast('Member suspended', 'w');
    renderTeam();
  });
}

function doActivate(userId) {
  updateTeamMember(userId, { status: 'active' });
  toast('Member restored', 's');
  renderTeam();
}

function doRemoveMember(userId) {
  const m = getTeamMembers().find(m => m.id === userId);
  confirm2(`Permanently remove ${m?.name || 'this member'}? This cannot be undone.`, () => {
    removeTeamMember(userId);
    toast('Member removed', 's');
    renderTeam();
  });
}

// ── Access Denied screen ──
function renderAccessDenied(module) {
  const page = document.getElementById('page-' + module);
  if (!page) return;
  page.innerHTML = `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px">
    <div style="font-size:48px;margin-bottom:16px;opacity:.3">🔒</div>
    <h2 style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:8px">Access Restricted</h2>
    <p style="color:var(--muted);font-size:14px;max-width:360px;line-height:1.6">
      You don't have permission to view this section.<br/>
      Contact your administrator to request access.
    </p>
    <div style="margin-top:20px">
      <span class="badge ${ROLE_COLORS[currentUser?.role]||'b-gray'}" style="font-size:13px;padding:5px 12px">${ROLE_LABELS[currentUser?.role]||currentUser?.role}</span>
    </div>
    <button class="btn btn-secondary" style="margin-top:16px" onclick="nav('dashboard')">← Back to Dashboard</button>
  </div>`;
}

// ── Audit Log page ──
function renderAuditLog() {
  if (!isAdmin()) { renderAccessDenied('audit'); return; }
  const logs = getAuditLogs(200);

  document.getElementById('page-audit').innerHTML = `
  <div class="ph">
    <div class="ph-left"><h1>Audit Log</h1><p>All activity across your workspace</p></div>
    <div class="ph-right">
      <button class="btn btn-secondary" onclick="exportAuditCSV()">⬇ Export CSV</button>
    </div>
  </div>
  <div class="card">
    ${logs.length === 0 ? `<div class="empty"><div class="empty-ic">📋</div><h3>No activity yet</h3><p>Actions taken in this workspace will appear here.</p></div>` : `
    <div class="tbl-wrap"><table>
      <thead><tr><th>User</th><th>Action</th><th>Module</th><th>Description</th><th>Timestamp</th><th>Device</th></tr></thead>
      <tbody>
        ${logs.map(l => `
          <tr>
            <td>
              <div class="td-bold">${l.userName}</div>
              <div class="td-muted">${l.userEmail}</div>
            </td>
            <td><span class="badge b-blue">${l.action}</span></td>
            <td><span class="badge b-gray">${l.module}</span></td>
            <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${l.description}">${l.description}</td>
            <td class="td-mono td-muted" style="white-space:nowrap">${l.timestamp ? new Date(l.timestamp).toLocaleString('en-AU') : '—'}</td>
            <td class="td-muted" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;font-size:11px" title="${l.device}">${l.device?.slice(0,40) || '—'}</td>
          </tr>`).join('')}
      </tbody>
    </table></div>`}
  </div>`;
}

function exportAuditCSV() {
  const logs = getAuditLogs(1000);
  const rows = [['Timestamp','User','Email','Module','Action','Description']];
  logs.forEach(l => rows.push([l.timestamp, l.userName, l.userEmail, l.module, l.action, l.description]));
  const csv = rows.map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `folio-audit-${today()}.csv`;
  a.click();
  toast('Audit log exported', 's');
}
