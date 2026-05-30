// project-management-extensions.js
// Enhances the project detail modal with team, milestones, expense edit/delete, and reimbursement actions.

(function () {
  const hasApiRequest = typeof window.apiRequest === 'function';

  async function apiRequestWrapper(path, opts = {}) {
    if (hasApiRequest) return window.apiRequest(path, opts);
    // Basic fetch fallback
    const method = (opts.method || 'GET').toUpperCase();
    const headers = { 'Content-Type': 'application/json' };
    if (opts.headers) Object.assign(headers, opts.headers);
    const fetchOpts = { method, headers };
    if (opts.body) fetchOpts.body = JSON.stringify(opts.body);
    const res = await fetch(path, fetchOpts);
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    try { return await res.json(); } catch (e) { return {}; }
  }

  function safeGetState() {
    return window.state && state.enterprise ? state : { enterprise: { projects: [] }, members: [] };
  }

  // Wrap existing openProjectDetailModal so we can load extended data after it populates the modal
  const originalOpen = window.openProjectDetailModal;
  if (typeof originalOpen === 'function') {
    window.openProjectDetailModal = async function (projectId) {
      try {
        await originalOpen(projectId);
      } catch (e) {
        console.error('Original openProjectDetailModal failed', e);
      }
      try {
        await loadExtendedProjectData(projectId);
      } catch (err) {
        console.error('loadExtendedProjectData error', err);
      }
    };
  }

  async function loadExtendedProjectData(projectId) {
    const s = safeGetState();
    const projects = s.enterprise.projects || [];
    const project = projects.find(p => p._id === projectId) || {};

    // Populate team select
    const memberSelect = document.getElementById('projectAddMemberSelect');
    if (memberSelect) {
      memberSelect.innerHTML = '<option value="">Select member</option>';
      (s.members || []).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m._id || m.id || m.email;
        opt.textContent = (m.name || m.displayName || m.email);
        memberSelect.appendChild(opt);
      });
    }

    renderTeamList(project);
    renderMilestones(project);
    bindExtendedEventHandlers(projectId);
    renderExpensesActions(project);
    renderReimbursementsActions(project);
  }

  function renderTeamList(project) {
    const container = document.getElementById('projectTeamList');
    if (!container) return;
    container.innerHTML = '';
    const members = (project.teamMembers && project.teamMembers.length) ? project.teamMembers : [];
    if (members.length === 0) {
      container.innerHTML = '<div class="empty-state-text">No team members assigned.</div>';
      return;
    }
    members.forEach(tm => {
      const card = document.createElement('div');
      card.className = 'team-member-card';
      const initials = (tm.name || tm.displayName || tm.memberName || '').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() || 'MB';
      card.innerHTML = `
        <div class="team-member-avatar">${initials}</div>
        <div class="team-member-name">${tm.name || tm.displayName || tm.memberName || tm.memberId || 'Member'}</div>
        <div class="team-member-role">${tm.role || 'Member'}</div>
        <div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
          <button class="dashboard-button small" data-action="assignLead" data-member-id="${tm.memberId || tm._id || ''}">Lead</button>
          <button class="dashboard-button small" data-action="removeMember" data-member-id="${tm.memberId || tm._id || ''}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function renderMilestones(project) {
    const all = ['Design','Fabrication','Programming','Testing','Competition'];
    const list = document.getElementById('projectMilestonesList');
    if (!list) return;
    // Ensure checkboxes reflect project.milestones
    const projectMilestones = (project.milestones && project.milestones.length) ? project.milestones : [];
    const boxes = list.querySelectorAll('.milestone-checkbox');
    boxes.forEach(box => {
      const name = box.getAttribute('data-milestone');
      box.checked = projectMilestones.includes(name);
      box.disabled = true; // default read-only
    });
    updateProgressFromMilestones(project);
  }

  function updateProgressFromMilestones(project) {
    const total = 5; // fixed set
    const completed = (project.milestones || []).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    const progEl = document.getElementById('projectDisplayProgress');
    const bar = document.getElementById('projectBudgetBar');
    const usedEl = document.getElementById('projectBudgetUsedPercent');
    if (progEl) progEl.textContent = `${percent}%`;
    if (usedEl) usedEl.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
  }

  function bindExtendedEventHandlers(projectId) {
    // Add Member button
    const addBtn = document.getElementById('addMemberToProjectBtn');
    addBtn?.addEventListener('click', () => {
      document.getElementById('projectAddMemberForm').style.display = 'block';
    });
    document.getElementById('cancelAddMemberBtn')?.addEventListener('click', () => {
      document.getElementById('projectAddMemberForm').style.display = 'none';
    });
    document.getElementById('projectAddMemberForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projId = window.currentProjectId || projectId;
      const memberId = document.getElementById('projectAddMemberSelect').value;
      const role = document.getElementById('projectAddMemberRole').value || 'member';
      if (!memberId) return alert('Select a member');
      await addMemberToProject(projId, memberId, role);
      document.getElementById('projectAddMemberForm').style.display = 'none';
    });

    // Milestones edit toggle
    document.getElementById('toggleMilestoneEditBtn')?.addEventListener('click', () => {
      const boxes = document.querySelectorAll('.milestone-checkbox');
      const editable = !boxes[0].disabled;
      boxes.forEach(b => b.disabled = editable);
      // If turning off edit, save changes
      if (editable) {
        saveMilestones(projectId);
      }
    });

    // Expense actions delegation
    document.getElementById('expensesTableBody')?.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const expenseId = btn.dataset.expenseId;
      if (action === 'delete') await deleteProjectExpense(projectId, expenseId);
      if (action === 'edit') await editProjectExpense(projectId, expenseId);
      if (action === 'download') window.open(btn.dataset.url, '_blank');
    });

    // Reimbursement actions delegation
    document.getElementById('reimbursementsTableBody')?.addEventListener('click', async (ev) => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const txId = btn.dataset.txId;
      if (action === 'approve') await updateReimbursementStatus(txId, 'approved');
      if (action === 'reject') await updateReimbursementStatus(txId, 'rejected');
      if (action === 'paid') await updateReimbursementStatus(txId, 'reimbursed');
    });

    // Expense form submit with receipt upload
    document.getElementById('projectExpenseForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projId = window.currentProjectId || projectId;
      const title = document.getElementById('expenseTitle').value.trim();
      const amount = Number(document.getElementById('expenseAmount').value);
      const category = document.getElementById('expenseCategory').value;
      const date = document.getElementById('expenseDate').value;
      const notes = document.getElementById('expenseNotes').value;
      const receiptInput = document.getElementById('expenseReceiptInput');
      const fd = new FormData();
      fd.append('title', title);
      fd.append('amount', amount);
      fd.append('category', category);
      fd.append('expenseDate', date);
      fd.append('notes', notes);
      if (receiptInput && receiptInput.files && receiptInput.files[0]) fd.append('receipt', receiptInput.files[0]);

      try {
        // Try existing add-expense endpoint with formdata
        const resp = await fetch(`/projects/${projId}/add-expense`, { method: 'POST', body: fd });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Failed to add expense');
        }
        showDashboardToast && showDashboardToast('Expense added');
        await refreshDashboardFromApi?.();
        // reload expenses table via existing code path if available
        if (typeof loadProjectExpenses === 'function') await loadProjectExpenses(projId);
      } catch (err) {
        console.error('add expense failed', err);
        alert('Add expense failed. Backend endpoint may not support file uploads; fallback used.');
      }
      // hide form
      document.getElementById('projectExpenseForm').style.display = 'none';
    });
  }

  async function addMemberToProject(projectId, memberId, role) {
    try {
      // Fetch project, modify teamMembers array and PUT update
      const s = safeGetState();
      const project = (s.enterprise.projects || []).find(p => p._id === projectId) || {};
      const team = project.teamMembers ? project.teamMembers.slice() : [];
      team.push({ memberId, role, name: null });
      await apiRequestWrapper(`/projects/${projectId}`, { method: 'PUT', body: { teamMembers: team } });
      showDashboardToast && showDashboardToast('Member added to project');
      await refreshDashboardFromApi?.();
      renderTeamList(Object.assign({}, project, { teamMembers: team }));
    } catch (err) {
      console.error('addMemberToProject', err);
      alert('Failed to add member. Ensure backend allows updating project team via PUT /projects/:id');
    }
  }

  async function deleteProjectExpense(projectId, expenseId) {
    if (!confirm('Delete this expense?')) return;
    try {
      const resp = await fetch(`/projects/${projectId}/expenses/${expenseId}`, { method: 'DELETE' });
      if (resp.ok) {
        showDashboardToast && showDashboardToast('Expense deleted');
        await refreshDashboardFromApi?.();
        if (typeof loadProjectExpenses === 'function') await loadProjectExpenses(projectId);
      } else {
        // Endpoint may not exist
        const text = await resp.text();
        throw new Error(text || 'Delete failed');
      }
    } catch (err) {
      console.error('deleteProjectExpense', err);
      alert('Delete expense failed. Backend may not expose DELETE endpoint.');
    }
  }

  async function editProjectExpense(projectId, expenseId) {
    // Simple prompt-based edit as fallback
    const newTitle = prompt('New title (leave blank to keep)');
    const newAmount = prompt('New amount (leave blank to keep)');
    const payload = {};
    if (newTitle) payload.title = newTitle;
    if (newAmount) payload.amount = Number(newAmount);
    if (Object.keys(payload).length === 0) return;
    try {
      const resp = await fetch(`/projects/${projectId}/expenses/${expenseId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (resp.ok) {
        showDashboardToast && showDashboardToast('Expense updated');
        await refreshDashboardFromApi?.();
        if (typeof loadProjectExpenses === 'function') await loadProjectExpenses(projectId);
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('editProjectExpense', err);
      alert('Edit expense failed. Backend may not support expense edit endpoint.');
    }
  }

  async function updateReimbursementStatus(txId, status) {
    if (!confirm(`Set reimbursement ${txId} to ${status}?`)) return;
    try {
      // Try a generic update endpoint on member-transactions
      const resp = await fetch(`/member-transactions/${txId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (resp.ok) {
        showDashboardToast && showDashboardToast('Reimbursement status updated');
        await refreshDashboardFromApi?.();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('updateReimbursementStatus', err);
      alert('Update failed. Backend may not provide a direct update endpoint for reimbursements.');
    }
  }

  async function saveMilestones(projectId) {
    try {
      const boxes = document.querySelectorAll('.milestone-checkbox');
      const selected = [];
      boxes.forEach(b => { if (b.checked) selected.push(b.getAttribute('data-milestone')); });
      await apiRequestWrapper(`/projects/${projectId}`, { method: 'PUT', body: { milestones: selected } });
      showDashboardToast && showDashboardToast('Milestones saved');
      await refreshDashboardFromApi?.();
      // update progress display
      const s = safeGetState();
      const project = (s.enterprise.projects || []).find(p => p._id === projectId) || {};
      updateProgressFromMilestones(project);
    } catch (err) {
      console.error('saveMilestones', err);
      alert('Saving milestones failed. Ensure backend allows updating milestones');
    }
  }

  function renderExpensesActions(project) {
    // Add action buttons to expenses rows if not present (this is defensive; original code may already add them)
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      if (tr.querySelector('button[data-action]')) return; // already has actions
      const id = tr.dataset.expenseId;
      const actionsTd = tr.querySelector('td:last-child');
      if (!actionsTd) return;
      actionsTd.innerHTML = `
        <button class="dashboard-button small" data-action="edit" data-expense-id="${id}"><i class="fas fa-pen"></i></button>
        <button class="dashboard-button small" data-action="delete" data-expense-id="${id}"><i class="fas fa-trash"></i></button>
      `;
    });
  }

  function renderReimbursementsActions(project) {
    const tbody = document.getElementById('reimbursementsTableBody');
    if (!tbody) return;
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      if (tr.querySelector('button[data-action]')) return;
      const txId = tr.dataset.txId;
      const actionsTd = tr.querySelector('td:last-child');
      if (!actionsTd) return;
      actionsTd.innerHTML = `
        <button class="dashboard-button small" data-action="approve" data-tx-id="${txId}">Approve</button>
        <button class="dashboard-button small" data-action="reject" data-tx-id="${txId}">Reject</button>
        <button class="dashboard-button small" data-action="paid" data-tx-id="${txId}">Mark Paid</button>
      `;
    });
  }

  // Expose some helpers for manual testing
  window.projectManagementExtensions = {
    addMemberToProject,
    deleteProjectExpense,
    editProjectExpense,
    updateReimbursementStatus,
    saveMilestones
  };

})();
