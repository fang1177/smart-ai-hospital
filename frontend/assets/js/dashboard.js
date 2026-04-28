/**
 * dashboard.js — Dashboard page logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initSidebar();
  await initNotifPanel();
  await loadNotifBadge();

  const user = api.getUser();
  document.getElementById('welcomeName').textContent = user?.name?.split(' ')[0] || 'User';
  document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday:'long', day:'numeric', month:'long', year:'numeric'
  });

  // Show Book Appointment only for patients
  if (user?.role === 'patient') {
    document.getElementById('dashBookBtn').style.display = '';
    document.getElementById('welcomeSub').textContent = "Here's your health overview for today.";
  } else if (user?.role === 'admin') {
    document.getElementById('welcomeSub').textContent = 'Manage hospital operations, staff, and patient care.';
  } else if (user?.role === 'doctor') {
    document.getElementById('welcomeSub').textContent = 'Review your appointments and patient records.';
  }

  await Promise.all([loadStats(), loadRecentAppointments()]);

  if (user?.role === 'admin') {
    document.getElementById('adminPendingApprovals')?.classList.remove('hidden');
    loadPendingDoctors();
  } else {
    document.getElementById('adminPendingApprovals')?.remove();
  }
});

// ── Stats ──────────────────────────────────────────────────────────────────────
async function loadStats() {
  // Stats removed from UI as per user request
  return;
}

// ── Recent Appointments ────────────────────────────────────────────────────────
async function loadRecentAppointments() {
  const tbody = document.getElementById('recentAppointments');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5"><div class="skeleton" style="height:40px;margin:8px 0"></div></td></tr>`;

  const { ok, data } = await api.get('/appointments');
  if (!ok) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-muted text-sm" style="text-align:center;padding:24px">Failed to load appointments</td></tr>`;
    return;
  }

  const list = (data.data || []).slice(0, 8);
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="empty-ico">📅</div><h3>No appointments yet</h3></div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => {
    const patient = a.patientId?.userId?.name || '—';
    const doctor  = a.doctorId?.userId?.name  || '—';
    return `
      <tr>
        <td><strong>${patient}</strong></td>
        <td>Dr. ${doctor}</td>
        <td>${formatDate(a.date)} &nbsp; <span class="text-muted">${a.time}</span></td>
        <td>${a.reason || '<span class="text-muted">—</span>'}</td>
        <td>${statusBadge(a.status)}</td>
      </tr>`;
  }).join('');
}

// ── Admin: Pending Doctors ───────────────────────────────────────────────────
async function loadPendingDoctors() {
  const tbody = document.getElementById('pendingDoctorsList');
  if (!tbody) return;

  const { ok, data } = await api.get('/admin/pending-doctors');
  if (!ok) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center">Failed to load pending doctors</td></tr>`;
    return;
  }

  const list = data.data?.doctors || [];
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty"><p>No pending doctors requires approval.</p></div></td></tr>`;
    return;
  }

  window.approveDoctor = async (id) => {
    if (!confirm('Approve this doctor?')) return;
    const res = await api.patch('/admin/doctors/' + id + '/approve');
    if (res.ok) {
      showToast('success', 'Doctor Approved');
      loadPendingDoctors();
    } else {
      showToast('error', 'Approval Failed', res.data.message);
    }
  };

  tbody.innerHTML = list.map(d => `
    <tr>
      <td><strong>Dr. ${d.name}</strong></td>
      <td>${d.email}</td>
      <td>Doctor</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="approveDoctor('${d._id}')">Approve</button>
      </td>
    </tr>
  `).join('');
}

// ── Admin: Add User ────────────────────────────────────────────────────────
const addUserForm = document.getElementById('addUserForm');
if (addUserForm) {
  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.getElementById('addRole').value;
    const payload = {
      name: document.getElementById('addName').value,
      email: document.getElementById('addEmail').value,
      password: document.getElementById('addPassword').value,
      role: role
    };
    if (role === 'doctor') {
      payload.specialization = document.getElementById('addSpec').value;
      payload.experience = document.getElementById('addExp').value;
    } else if (role === 'patient') {
      payload.age = document.getElementById('addAge').value;
      payload.gender = document.getElementById('addGender').value;
    }

    const { ok, data } = await api.post('/admin/users', payload);
    if (ok) {
      showToast('success', 'User Created', data.message);
      closeModal('addUserModal');
      addUserForm.reset();
      loadStats(); // refresh stats
    } else {
      showToast('error', 'Error', data.message);
    }
  });
}
