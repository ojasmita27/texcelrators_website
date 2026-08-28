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
    let project = (s.enterprise.projects || []).find(p => String(p._id) === String(projectId)) || null;

    try {
      const projectRes = await apiRequestWrapper(`/projects/${projectId}`, { method: 'GET' });
      if (projectRes && projectRes._id) {
        project = projectRes;
      }
    } catch (err) {
      console.warn('Extended project fetch fallback used:', err);
    }

    const memberSelect = document.getElementById('projectAddMemberSelect');
    if (memberSelect) {
      memberSelect.innerHTML = '<option value="">Select member</option>';
      // If state.members not populated, fetch dashboard data to get members list
      let membersList = (s.members || []).slice();
      if ((!membersList || membersList.length === 0) && typeof apiRequestWrapper === 'function') {
        try {
          const dash = await apiRequestWrapper('/dashboard/data', { method: 'GET' });
          membersList = Array.isArray(dash.members) ? dash.members : membersList;
        } catch (e) {
          // ignore: we'll fallback to state.members if dashboard fetch fails
        }
      }
      (membersList || []).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m._id || m.id || m.email;
        opt.textContent = (m.name || m.displayName || m.email);
        memberSelect.appendChild(opt);
      });
    }

    renderTeamList(project || {});
    renderMilestones(project || {});
    bindExtendedEventHandlers(projectId);
    renderExpensesActions(project || {});
    renderReimbursementsActions(project || {});
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
      const name = tm.name || tm.displayName || tm.email || 'Member';
      const initials = name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase() || 'MB';
      const role = tm.role || 'Member';
      const memberId = tm._id || tm.id || tm;
      card.innerHTML = `
        <div class="team-member-avatar">${initials}</div>
        <div class="team-member-name">${name}</div>
        <div class="team-member-role">${role}</div>
        <div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
          <button class="dashboard-button small" data-action="assignLead" data-member-id="${memberId}">Lead</button>
          <button class="dashboard-button small" data-action="removeMember" data-member-id="${memberId}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function renderMilestones(project) {
    const all = ['Design','Fabrication','Programming','Testing','Competition'];
    const list = document.getElementById('projectMilestonesList');
    if (!list) return;
    // Ensure checkboxes reflect project.milestones (project.milestones may be objects or array of completed titles)
    const projectMilestones = Array.isArray(project.milestones) ? project.milestones : [];
    const completedTitles = projectMilestones.map((m) => (typeof m === 'string' ? m : (m && m.title))).filter(Boolean).filter((t) => {
      // If milestone is object, only consider completed ones
      const raw = projectMilestones.find(x => (x && (x.title === t)) || x === t);
      if (typeof raw === 'string') return true;
      return raw && raw.status === 'completed';
    });
    const boxes = list.querySelectorAll('.milestone-checkbox');
    boxes.forEach(box => {
      const name = box.getAttribute('data-milestone');
      box.checked = completedTitles.includes(name);
      box.disabled = true; // default read-only
    });
    updateProgressFromMilestones(project);
  }

  function updateProgressFromMilestones(project) {
    const total = 5; // fixed set of known milestones
    const milestones = Array.isArray(project.milestones) ? project.milestones : [];
    const completed = milestones.filter((m) => {
      if (!m) return false;
      if (typeof m === 'string') return true; // saved as list of completed titles
      return m.status === 'completed';
    }).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    const progEl = document.getElementById('projectDisplayProgress');
    const bar = document.getElementById('projectBudgetBar');
    const usedEl = document.getElementById('projectBudgetUsedPercent');
    if (progEl) progEl.textContent = `${percent}%`;
    if (usedEl) usedEl.textContent = `${percent}%`;
    if (bar) bar.style.width = `${percent}%`;
  }

  function bindExtendedEventHandlers(projectId) {
    const addBtn = document.getElementById('addMemberToProjectBtn');
    const cancelBtn = document.getElementById('cancelAddMemberBtn');
    const addMemberForm = document.getElementById('projectAddMemberForm');

    if (!addBtn || !cancelBtn || !addMemberForm) return;

    if (addBtn.dataset.bound === 'true') return;
    addBtn.dataset.bound = 'true';
    cancelBtn.dataset.bound = 'true';
    addMemberForm.dataset.bound = 'true';

    addBtn.addEventListener('click', () => {
      addMemberForm.style.display = 'block';
    });
    cancelBtn.addEventListener('click', () => {
      addMemberForm.style.display = 'none';
    });
    addMemberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projId = window.currentProjectId || projectId;
      const memberId = document.getElementById('projectAddMemberSelect').value;
      const role = document.getElementById('projectAddMemberRole').value || 'member';
      if (!memberId) return alert('Select a member');
      await addMemberToProject(projId, memberId, role);
      addMemberForm.style.display = 'none';
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
      const title = document.getElementById('projectExpenseTitle').value.trim();
      const amount = Number(document.getElementById('projectExpenseAmount').value);
      const category = document.getElementById('projectExpenseCategory').value;
      const date = document.getElementById('projectExpenseDate').value;
      const notes = document.getElementById('projectExpenseNotes').value;
      const receiptInput = document.getElementById('projectExpenseReceiptInput');
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
        
        // Refresh details modal statistics
        const projects = (window.state?.enterprise?.projects || []);
        const project = projects.find(p => p._id === projId);
        if (project) {
          if (typeof window.openProjectDetailModal === 'function') {
            window.openProjectDetailModal(projId);
          }
        }
      } catch (err) {
        console.error('add expense failed', err);
        alert('Add expense failed: ' + err.message);
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
      const team = project.teamMembers ? project.teamMembers.map(m => m._id || m.id || m) : [];
      if (!team.includes(memberId)) {
        team.push(memberId);
      }
      await apiRequestWrapper(`/projects/${projectId}`, { method: 'PUT', body: { teamMemberIds: team } });
      showDashboardToast && showDashboardToast('Member added to project');
      await refreshDashboardFromApi?.();
      // Trigger modal re-open/render to get newly populated data from API/state
      if (typeof window.openProjectDetailModal === 'function') {
        window.openProjectDetailModal(projectId);
      }
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
      let path = '';
      let opts = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
      if (status === 'approved') {
        const adminNotes = prompt('Admin notes (optional):') || '';
        path = `/reimbursements/${txId}/approve`;
        opts.body = JSON.stringify({ adminNotes });
      } else if (status === 'rejected') {
        const reason = prompt('Rejection reason:');
        if (!reason || !reason.trim()) return;
        path = `/reimbursements/${txId}/reject`;
        opts.body = JSON.stringify({ reason: reason.trim() });
      } else if (status === 'reimbursed') {
        path = `/reimbursements/${txId}/process-reimbursement`;
        opts.body = JSON.stringify({ reimbursedVia: 'club_fund' });
      }

      const resp = await fetch(path, opts);
      if (resp.ok) {
        showDashboardToast && showDashboardToast(`Reimbursement ${status} successful`, 'success');
        await refreshDashboardFromApi?.();
        // Trigger global page renders if exist
        if (typeof renderReimbursements === 'function') renderReimbursements();
        if (typeof renderMemberReceiptStatus === 'function') renderMemberReceiptStatus();
        if (typeof renderExpenses === 'function') renderExpenses();
        if (typeof renderMemberExpenses === 'function') renderMemberExpenses();
        if (typeof renderFinance === 'function') renderFinance();
        if (typeof window.renderAllFundManagement === 'function') window.renderAllFundManagement();
        // Refresh details modal lists
        const projId = window.currentProjectId;
        if (projId) {
          if (typeof loadProjectReimbursements === 'function') await loadProjectReimbursements(projId);
          if (typeof loadProjectExpenses === 'function') await loadProjectExpenses(projId);
          // refresh details stats
          const projects = (window.state?.enterprise?.projects || []);
          const project = projects.find(p => p._id === projId);
          if (project) {
            const allocated = Number(project.budgetAllocated) || 0;
            const spent = Number(project.totalExpense) || 0;
            const remaining = allocated - spent;
            const usedPercent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
            const budgetAllocatedEl = document.getElementById('projectBudgetAllocated');
            const budgetSpentEl = document.getElementById('projectBudgetSpent');
            const budgetRemainingEl = document.getElementById('projectBudgetRemaining');
            const budgetUsedPercentEl = document.getElementById('projectBudgetUsedPercent');
            const budgetBarEl = document.getElementById('projectBudgetBar');
            if (budgetAllocatedEl) budgetAllocatedEl.textContent = formatCurrency(allocated);
            if (budgetSpentEl) budgetSpentEl.textContent = formatCurrency(spent);
            if (budgetRemainingEl) budgetRemainingEl.textContent = formatCurrency(remaining);
            if (budgetUsedPercentEl) budgetUsedPercentEl.textContent = `${usedPercent}%`;
            if (budgetBarEl) budgetBarEl.style.width = `${Math.min(usedPercent, 100)}%`;
          }
        }
      } else {
        const errObj = await resp.json().catch(() => ({}));
        throw new Error(errObj.message || 'Update failed');
      }
    } catch (err) {
      console.error('updateReimbursementStatus', err);
      alert('Update failed: ' + err.message);
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
