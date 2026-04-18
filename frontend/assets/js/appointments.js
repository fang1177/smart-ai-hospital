/**
 * appointments.js — Appointments page logic
 */
let allDoctorsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initSidebar();
  await initNotifPanel();
  await loadNotifBadge();

  const user = api.getUser();

  // Show "Book" button only for patients
  if (user?.role === 'patient') {
    document.getElementById('bookBtn')?.classList.remove('hidden');
    await loadDoctorsForModal();
  }

  await loadAppointments();

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterAppointments();
    });
  });

  // Pre-select doctor if coming from doctors page
  const preDoc = localStorage.getItem('sh_selected_doctor');
  const preDocName = localStorage.getItem('sh_selected_doctor_name');
  if (preDoc && user?.role === 'patient') {
    openModal('bookModal');
    const sel = document.getElementById('apptDoctor');
    if (sel) sel.value = preDoc;
    localStorage.removeItem('sh_selected_doctor');
    localStorage.removeItem('sh_selected_doctor_name');
  }

  // Book form submit
  document.getElementById('bookForm')?.addEventListener('submit', handleBook);
});

async function loadDoctorsForModal() {
  const { ok, data } = await api.get('/doctors');
  allDoctorsList = ok ? data.data || [] : [];

  const sel = document.getElementById('apptDoctor');
  if (!sel) return;
  sel.innerHTML = `<option value="">Select Doctor</option>` +
    allDoctorsList.map(d => `<option value="${d._id}">Dr. ${d.userId?.name} — ${d.specialization}</option>`).join('');
}

let cachedAppointments = [];

async function loadAppointments() {
  const tbody = document.getElementById('apptTable');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6"><div class="skeleton" style="height:44px;margin:8px 16px;border-radius:8px"></div></td></tr>
                     <tr><td colspan="6"><div class="skeleton" style="height:44px;margin:8px 16px;border-radius:8px"></div></td></tr>`;

  const { ok, data } = await api.get('/appointments');
  if (!ok) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px" class="text-muted">Failed to load appointments</td></tr>`;
    return;
  }

  cachedAppointments = data.data || [];
  renderAppointments(cachedAppointments);
}

function filterAppointments() {
  const status = document.querySelector('.filter-pill.active')?.dataset.status || '';
  const filtered = status ? cachedAppointments.filter(a => a.status === status) : cachedAppointments;
  renderAppointments(filtered);
}

function renderAppointments(list) {
  const tbody = document.getElementById('apptTable');
  const user  = api.getUser();

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty" style="padding:48px">
      <div class="empty-ico">📅</div>
      <h3>No appointments found</h3>
      <p>${user?.role==='patient' ? 'Book your first appointment above.' : 'No appointments match this filter.'}</p>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(a => {
    const patient = a.patientId?.userId?.name || '—';
    const doctor  = a.doctorId?.userId?.name  || '—';
    const actions = buildActions(a, user?.role);

    return `<tr>
      <td><strong>${patient}</strong></td>
      <td>Dr. ${doctor}</td>
      <td>${formatDate(a.date)}</td>
      <td><span style="font-size:0.82rem">⏰ ${a.time}</span></td>
      <td>${a.reason || '<span class="text-muted">—</span>'}</td>
      <td>${statusBadge(a.status)}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('');
}

function buildActions(appt, role) {
  let btns = '';
  if (appt.status === 'pending' || appt.status === 'confirmed') {
    if (role === 'doctor' || role === 'admin') {
      if (appt.status === 'pending') {
        btns += `<button class="btn btn-sm btn-success" onclick="updateStatus('${appt._id}','confirmed')">✓ Confirm</button> `;
      }
      btns += `<button class="btn btn-sm btn-primary" onclick="updateStatus('${appt._id}','completed')">✔ Complete</button> `;
    }
    btns += `<button class="btn btn-sm btn-danger" onclick="cancelAppt('${appt._id}')">✕</button>`;
  }
  return btns || `<span class="text-muted text-sm">—</span>`;
}

// ── Book Appointment ───────────────────────────────────────────────────────────
async function handleBook(e) {
  e.preventDefault();
  const btn = document.querySelector('[form="bookForm"]') || e.target.querySelector('[type=submit]');
  if (btn) btn.disabled = true;
  if (btn) btn.innerHTML = `<span class="spinner"></span> Booking…`;

  const { ok, data } = await api.post('/appointments', {
    doctorId: document.getElementById('apptDoctor').value,
    date:     document.getElementById('apptDate').value,
    time:     document.getElementById('apptTime').value,
    reason:   document.getElementById('apptReason').value,
  });

  if (btn) btn.disabled = false;
  if (btn) btn.innerHTML = '📅 Book Appointment';

  if (!ok) { showToast('error', 'Booking Failed', data.message); return; }

  showToast('success', 'Appointment Booked!', 'Your appointment has been scheduled.');
  closeModal('bookModal');
  e.target.reset();
  await loadAppointments();
}

// ── Update Status ──────────────────────────────────────────────────────────────
async function updateStatus(id, status) {
  const { ok, data } = await api.patch(`/appointments/${id}/status`, { status });
  if (!ok) { showToast('error', 'Error', data.message); return; }
  showToast('success', 'Updated', `Appointment marked as ${status}.`);
  await loadAppointments();
}

// ── Cancel ────────────────────────────────────────────────────────────────────
async function cancelAppt(id) {
  if (!confirm('Cancel this appointment?')) return;
  const { ok, data } = await api.patch(`/appointments/${id}/cancel`);
  if (!ok) { showToast('error', 'Error', data.message); return; }
  showToast('warning', 'Cancelled', 'Appointment has been cancelled.');
  await loadAppointments();
}

// Set min date to today
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('apptDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
});
