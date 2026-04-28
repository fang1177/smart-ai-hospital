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

  // Pre-select doctor if coming from triage or doctors page
  const fromTriage = new URLSearchParams(window.location.search).get('fromTriage');
  const pendingBooking = localStorage.getItem('sh_pending_booking');

  if (user?.role === 'patient') {
    await loadDoctorsForModal();
    
    if (fromTriage && pendingBooking) {
      const { doctorId, doctorName } = JSON.parse(pendingBooking);
      lockDoctorSelection(doctorId, doctorName);
      openModal('bookModal');
    } else {
      const preDoc = localStorage.getItem('sh_selected_doctor');
      const preDocName = localStorage.getItem('sh_selected_doctor_name');
      if (preDoc) {
        lockDoctorSelection(preDoc, preDocName || 'Selected Doctor');
        openModal('bookModal');
      }
    }
  }

  // Book form submit
  document.getElementById('bookForm')?.addEventListener('submit', handleBook);
});

function lockDoctorSelection(id, name) {
  const selGroup = document.getElementById('apptDoctor').closest('.form-group');
  const sel = document.getElementById('apptDoctor');
  
  if (sel) sel.value = id;
  
  // Create a display box for the locked doctor
  const displayId = 'lockedDoctorDisplay';
  if (!document.getElementById(displayId)) {
    const display = document.createElement('div');
    display.id = displayId;
    display.className = 'locked-doc-box glass-card';
    display.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.5rem">👨‍⚕️</span>
        <div style="flex:1">
          <div style="font-size:0.75rem; color:var(--primary); font-weight:700; text-transform:uppercase;">Booking with</div>
          <div style="font-weight:700; font-size:1.1rem;">Dr. ${name}</div>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="unlockDoctorSelection()" style="padding:4px 8px; font-size:0.7rem">Change</button>
      </div>
    `;
    selGroup.appendChild(display);
    sel.classList.add('hidden');
  }
}

window.unlockDoctorSelection = () => {
  const display = document.getElementById('lockedDoctorDisplay');
  const sel = document.getElementById('apptDoctor');
  if (display) display.remove();
  if (sel) {
    sel.classList.remove('hidden');
    sel.value = '';
  }
  localStorage.removeItem('sh_pending_booking');
  localStorage.removeItem('sh_selected_doctor');
  localStorage.removeItem('sh_selected_doctor_name');
};

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

// ── Book Appointment (With Payment) ───────────────────────────────────────────
async function handleBook(e) {
  e.preventDefault();
  const btn = document.querySelector('[form="bookForm"]') || e.target.querySelector('[type=submit]');
  if (btn) btn.disabled = true;
  if (btn) btn.innerHTML = `<span class="spinner"></span> Initiating…`;

  const { ok, data } = await api.post('/appointments/initiate', {
    doctorId: document.getElementById('apptDoctor').value,
    date:     document.getElementById('apptDate').value,
    time:     document.getElementById('apptTime').value,
    reason:   document.getElementById('apptReason').value,
  });

  if (!ok) { 
    if (btn) { btn.disabled = false; btn.innerHTML = '📅 Book Appointment'; }
    showToast('error', 'Booking Failed', data.message); 
    return; 
  }

  const { orderId, amount, appointmentId, keyId, isDemo } = data.data;

  if (isDemo) {
    showToast('success', 'Appointment Booked!', 'Demo Mode: Booking successful without real payment.');
    closeModal('bookModal');
    e.target.reset();
    await loadAppointments();
    if (btn) { btn.disabled = false; btn.innerHTML = '📅 Book Appointment'; }
    return;
  }

  const options = {
    key: keyId,
    amount: amount * 100,
    currency: 'INR',
    name: 'Smart Hospital AI',
    description: 'Consultation Fee Payment',
    order_id: orderId,
    handler: async function (response) {
      if (btn) btn.innerHTML = `<span class="spinner"></span> Verifying…`;
      const verifyRes = await api.post('/appointments/verify', {
        ...response,
        appointmentId
      });

      if (verifyRes.ok) {
        showToast('success', 'Appointment Booked!', 'Payment successful. Doctor will confirm soon.');
        closeModal('bookModal');
        e.target.reset();
        await loadAppointments();
      } else {
        showToast('error', 'Payment Verification Failed', verifyRes.data.message);
      }
      
      if (btn) { btn.disabled = false; btn.innerHTML = '📅 Book Appointment'; }
    },
    prefill: {
      name: api.getUser().name,
      email: api.getUser().email,
    },
    theme: { color: '#2563EB' },
    modal: {
      ondismiss: function() {
        if (btn) { btn.disabled = false; btn.innerHTML = '📅 Book Appointment'; }
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
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
