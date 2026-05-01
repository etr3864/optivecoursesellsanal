// ─── State ───────────────────────────────────────────────────
let users = [];
let editingId = null;
let searchTimeout = null;
let confirmCallback = null;

// ─── Init ────────────────────────────────────────────────────
(async function init() {
  const res = await apiFetch('/api/admin/me');
  if (res.ok) {
    showPanel();
    loadUsers();
  } else {
    showLogin();
  }
})();

function showLogin() {
  document.getElementById('loginScreen').style.display = '';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('loginUsername').focus();
}

function showPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = '';
  bindPanel();
}

// ─── Login ───────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');

  errorEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'מתחבר...';

  const res = await apiFetch('/api/admin/login', { method: 'POST', body: { username, password } });

  btn.disabled = false;
  btn.textContent = 'כניסה';

  if (res.ok) {
    showPanel();
    loadUsers();
  } else {
    errorEl.textContent = res.data?.error || 'שגיאה בכניסה';
    errorEl.style.display = '';
  }
}

// ─── Panel bindings ──────────────────────────────────────────
function bindPanel() {
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('addUserBtn').addEventListener('click', openAddForm);
  document.getElementById('formCancelBtn').addEventListener('click', closeForm);
  document.getElementById('formSubmitBtn').addEventListener('click', handleFormSubmit);
  document.getElementById('bulkDeleteBtn').addEventListener('click', handleBulkDelete);
  document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
  document.getElementById('confirmOk').addEventListener('click', () => { confirmCallback?.(); closeConfirm(); });
  document.getElementById('confirmCancel').addEventListener('click', closeConfirm);
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadUsers, 350);
  });
}

async function handleLogout() {
  await apiFetch('/api/admin/logout', { method: 'POST' });
  location.reload();
}

// ─── Load users ──────────────────────────────────────────────
async function loadUsers() {
  const search = document.getElementById('searchInput')?.value?.trim() || '';
  setLoading(true);

  const url = search
    ? `/api/admin/users?search=${encodeURIComponent(search)}`
    : '/api/admin/users';

  const res = await apiFetch(url);
  setLoading(false);

  if (!res.ok) { showToast('שגיאה בטעינת משתמשים', 'error'); return; }

  users = res.data;
  renderTable();
  updateBulkUI();
}

// ─── Table ───────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('usersTableBody');
  const empty = document.getElementById('emptyState');

  document.getElementById('userCount').textContent = `${users.length} משתמשים`;
  document.getElementById('selectAll').checked = false;

  if (!users.length) {
    tbody.innerHTML = '';
    empty.style.display = '';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = users.map(renderRow).join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => openEditForm(btn.dataset.edit))
  );
  tbody.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', () => handleDeleteUser(btn.dataset.delete))
  );
  tbody.querySelectorAll('[data-row-check]').forEach((cb) =>
    cb.addEventListener('change', updateBulkUI)
  );
}

function renderRow(user) {
  const date = new Date(user.createdAt).toLocaleDateString('he-IL');
  return `
    <tr data-id="${user.id}">
      <td class="admin-col-check"><input type="checkbox" data-row-check="${user.id}" /></td>
      <td class="admin-cell-name">${escHtml(user.name || '—')}</td>
      <td class="admin-cell-phone" dir="ltr">${escHtml(user.phone)}</td>
      <td class="admin-cell-date">${date}</td>
      <td class="admin-col-actions">
        <button class="admin-btn admin-btn-sm admin-btn-ghost" data-edit="${user.id}">עריכה</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger-ghost" data-delete="${user.id}">מחק</button>
      </td>
    </tr>
  `;
}

// ─── Form ────────────────────────────────────────────────────
function openAddForm() {
  editingId = null;
  document.getElementById('formPhone').value = '';
  document.getElementById('formName').value = '';
  document.getElementById('formSubmitBtn').textContent = 'הוסף';
  document.getElementById('formError').style.display = 'none';
  document.getElementById('userForm').style.display = '';
  document.getElementById('addUserBtn').style.display = 'none';
  document.getElementById('formPhone').focus();
}

function openEditForm(id) {
  const user = users.find((u) => u.id === id);
  if (!user) return;
  editingId = id;
  document.getElementById('formPhone').value = user.phone;
  document.getElementById('formName').value = user.name || '';
  document.getElementById('formSubmitBtn').textContent = 'שמור';
  document.getElementById('formError').style.display = 'none';
  document.getElementById('userForm').style.display = '';
  document.getElementById('addUserBtn').style.display = 'none';
  document.getElementById('formPhone').focus();
}

function closeForm() {
  editingId = null;
  document.getElementById('userForm').style.display = 'none';
  document.getElementById('addUserBtn').style.display = '';
}

async function handleFormSubmit() {
  const phone = document.getElementById('formPhone').value.trim();
  const name = document.getElementById('formName').value.trim();
  const errorEl = document.getElementById('formError');
  const btn = document.getElementById('formSubmitBtn');

  errorEl.style.display = 'none';
  btn.disabled = true;

  const res = editingId
    ? await apiFetch(`/api/admin/users/${editingId}`, { method: 'PATCH', body: { phone, name } })
    : await apiFetch('/api/admin/users', { method: 'POST', body: { phone, name } });

  btn.disabled = false;

  if (res.ok) {
    closeForm();
    showToast(editingId ? 'משתמש עודכן בהצלחה' : 'משתמש נוסף בהצלחה', 'success');
    loadUsers();
  } else {
    errorEl.textContent = res.data?.error || 'שגיאה';
    errorEl.style.display = '';
  }
}

// ─── Delete ──────────────────────────────────────────────────
function handleDeleteUser(id) {
  const user = users.find((u) => u.id === id);
  const label = user?.name || user?.phone || 'משתמש זה';
  openConfirm(`למחוק את ${label}? הפעולה אינה הפיכה.`, async () => {
    const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('משתמש נמחק', 'success'); loadUsers(); }
    else showToast(res.data?.error || 'שגיאה במחיקה', 'error');
  });
}

function handleBulkDelete() {
  const ids = getSelectedIds();
  openConfirm(`למחוק ${ids.length} משתמשים? הפעולה אינה הפיכה.`, async () => {
    const res = await apiFetch('/api/admin/users/bulk-delete', { method: 'POST', body: { ids } });
    if (res.ok) { showToast(`${ids.length} משתמשים נמחקו`, 'success'); loadUsers(); }
    else showToast(res.data?.error || 'שגיאה במחיקה', 'error');
  });
}

// ─── Select all ──────────────────────────────────────────────
function getSelectedIds() {
  return Array.from(document.querySelectorAll('[data-row-check]:checked')).map((cb) => cb.dataset.rowCheck);
}

function toggleSelectAll(e) {
  document.querySelectorAll('[data-row-check]').forEach((cb) => { cb.checked = e.target.checked; });
  updateBulkUI();
}

function updateBulkUI() {
  const ids = getSelectedIds();
  const bulkBtn = document.getElementById('bulkDeleteBtn');
  if (ids.length > 0) {
    document.getElementById('selectedCount').textContent = ids.length;
    bulkBtn.style.display = '';
  } else {
    bulkBtn.style.display = 'none';
  }
}

// ─── Confirm modal ───────────────────────────────────────────
function openConfirm(text, onOk) {
  document.getElementById('confirmText').textContent = text;
  document.getElementById('confirmModal').style.display = '';
  confirmCallback = onOk;
}

function closeConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
  confirmCallback = null;
}

// ─── Utils ───────────────────────────────────────────────────
function setLoading(on) {
  document.getElementById('loadingState').style.display = on ? '' : 'none';
  if (document.getElementById('usersTableBody')) {
    document.getElementById('usersTableBody').style.opacity = on ? '0.4' : '';
  }
}

let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `admin-toast admin-toast-${type}`;
  el.style.display = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

async function apiFetch(url, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
