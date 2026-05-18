// FOLIO — Tasks

const TASK_COLS=[{id:'todo',lbl:'To Do',col:'gray'},{id:'inprogress',lbl:'In Progress',col:'blue'},{id:'review',lbl:'Review',col:'orange'},{id:'done',lbl:'Done',col:'green'}];

function renderTasks(){
  if (!canView('tasks')) { renderAccessDenied('tasks'); return; }
  auditLog('tasks', 'viewed', 'Tasks page viewed', {});
  
  const tasks=S.tasks||[];
  const open=tasks.filter(t=>t.status!=='done').length;
  const over=tasks.filter(t=>t.status!=='done'&&isOver(t.due)).length;

  document.getElementById('page-tasks').innerHTML=`
  <div class="ph">
    <div class="ph-left"><h1>Tasks</h1><p>${open} open${over>0?` · <span style="color:var(--red)">${over} overdue</span>`:''}</p></div>
    <div class="ph-right"><button class="btn btn-primary" onclick="openTaskModal()">+ New Task</button></div>
  </div>
  <div class="kanban">
    ${TASK_COLS.map(col=>{
      const colTasks=tasks.filter(t=>t.status===col.id);
      return`<div class="kb-col" data-col="${col.id}" ondragover="event.preventDefault()" ondrop="dropTask(event,'${col.id}')">
        <div class="kb-hd"><div class="kb-title">${col.lbl}</div><span class="kb-count">${colTasks.length}</span></div>
        <div class="kb-cards">
          ${colTasks.map(t=>{
            const over=t.status!=='done'&&isOver(t.due);
            const pcol={high:'red',medium:'orange',low:'gray'};
            return`<div class="kb-card" draggable="true" ondragstart="dragTask(event,'${t.id}')" onclick="openTaskModal('${t.id}')">
              ${over?`<div style="height:3px;background:var(--red);border-radius:3px 3px 0 0;margin:-11px -11px 9px"></div>`:''}
              <div class="kb-ct">${t.title}</div>
              <div class="kb-meta">
                ${t.priority?`<span class="badge b-${pcol[t.priority]||'gray'}" style="font-size:10px">${t.priority}</span>`:''}
                ${t.due?`<span style="font-size:11px;color:${over?'var(--red)':'var(--muted)'}">${over?'⚠ ':''}${fmtShort(t.due)}</span>`:''}
                ${t.projectId?`<span style="font-size:11px;color:var(--muted)">${projName(t.projectId).slice(0,15)}</span>`:''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

let dragTId=null;
function dragTask(e,id){dragTId=id}
function dropTask(e,col){e.preventDefault();if(!dragTId)return;const t=S.tasks?.find(t=>t.id===dragTId);if(t){t.status=col;if(col==='done')logAct('task','completed',t.title,t.id,'✅');saveAppData();renderTasks();updateBadges()}dragTId=null}

let editTId=null;
function openTaskModal(id){
  editTId=id||null;
  const t=id?S.tasks?.find(t=>t.id===id):null;
  showModal(`<div class="modal-ov"><div class="modal">
    <div class="modal-hd"><h2>${id?'Edit Task':'New Task'}</h2><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">
      <div class="fgrid">
        <div class="fg s2"><label>Title <span class="req">*</span></label><input class="fc" id="t-title" value="${t?.title||''}"/></div>
        <div class="fg"><label>Project</label><select class="fc" id="t-proj"><option value="">— No project —</option>${(S.projects||[]).map(p=>`<option value="${p.id}" ${t?.projectId===p.id?'selected':''}>${p.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Client</label><select class="fc" id="t-cl"><option value="">— No client —</option>${(S.clients||[]).map(c=>`<option value="${c.id}" ${t?.clientId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></div>
        <div class="fg"><label>Status</label><select class="fc" id="t-st">${TASK_COLS.map(c=>`<option value="${c.id}" ${(t?.status||'todo')===c.id?'selected':''}>${c.lbl}</option>`).join('')}</select></div>
        <div class="fg"><label>Priority</label><select class="fc" id="t-pri">${['high','medium','low'].map(p=>`<option value="${p}" ${(t?.priority||'medium')===p?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`).join('')}</select></div>
        <div class="fg"><label>Due Date</label><input class="fc" type="date" id="t-due" value="${t?.due||''}"/></div>
        <div class="fg s2"><label>Description</label><textarea class="fc" id="t-desc">${t?.desc||''}</textarea></div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      ${id?`<button class="btn btn-danger" onclick="delTask('${id}')">Delete</button>`:''}
      <button class="btn btn-primary" onclick="saveTask()">Save Task</button>
    </div>
  </div></div>`);
}

function saveTask(){
  const title=document.getElementById('t-title')?.value.trim();
  if(!title){toast('Title required','e');return}
  const task={id:editTId||uid(),title,projectId:document.getElementById('t-proj')?.value||null,clientId:document.getElementById('t-cl')?.value||null,status:document.getElementById('t-st')?.value,priority:document.getElementById('t-pri')?.value,due:document.getElementById('t-due')?.value,desc:document.getElementById('t-desc')?.value.trim(),createdAt:editTId?(S.tasks.find(t=>t.id===editTId)?.createdAt||today()):today()};
  if(editTId){const i=S.tasks.findIndex(t=>t.id===editTId);if(i>=0)S.tasks[i]=task;}
  else S.tasks.push(task);
  saveAppData();closeModal();toast(editTId?'Task updated':'Task created','s');renderTasks();updateBadges();
}
function delTask(id){S.tasks=S.tasks.filter(t=>t.id!==id);saveAppData();closeModal();toast('Task deleted');renderTasks();updateBadges()}
