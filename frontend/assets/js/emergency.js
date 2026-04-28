/**
 * emergency.js — Frontend logic for Emergency SOS
 */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initSidebar();
  initNotifPanel();

  const user = api.getUser();
  if (user.role === 'patient') {
    document.getElementById('patientEmergencyView').classList.remove('hidden');
    initPatientView();
  } else {
    document.getElementById('staffEmergencyView').classList.remove('hidden');
    initStaffView();
  }
});

async function initPatientView() {
  const sosBtn = document.getElementById('sosBtn');
  const sosForm = document.getElementById('sosForm');
  const confirmBtn = document.getElementById('confirmSos');

  sosBtn.addEventListener('click', () => {
    sosForm.style.display = 'block';
    sosBtn.style.display = 'none';
  });

  confirmBtn.addEventListener('click', async () => {
    const data = {
      emergencyType: document.getElementById('emergencyType').value,
      issueDescription: document.getElementById('issueDescription').value,
      locationText: document.getElementById('locationText').value,
      ambulanceRequested: document.getElementById('requestAmbulance').checked
    };

    if (!data.locationText) return showToast('warning', 'Location Required', 'Please specify your location');

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Sending...';

    const res = await api.post('/emergencies', data);
    if (res.ok) {
      showToast('success', 'SOS Sent', 'Help is on the way. Stay calm.');
      location.reload();
    } else {
      showToast('error', 'Failed', res.data.message);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'CONFIRM SOS REQUEST';
    }
  });

  loadPatientEmergencies();
}

async function loadPatientEmergencies() {
  // We'll just reuse the staff endpoint but it will be filtered by user in backend if we implemented it so.
  // Actually, let's just fetch all and filter here for now if needed, or better, we have a patient specific one.
  // For simplicity, let's use the list from the general endpoint if allowed.
  const res = await api.get('/emergencies'); // In real app, this should be /emergencies/my
  const container = document.getElementById('myEmergencies');
  if (!res.ok) { container.innerHTML = '<p>Failed to load.</p>'; return; }

  const list = res.data.data.filter(e => e.patientId._id === api.getUser()._id || e.patientId === api.getUser()._id);
  if (!list.length) { container.innerHTML = '<div class="empty" style="padding:20px">No recent requests.</div>'; return; }

  container.innerHTML = list.map(e => `
    <div class="notif-item status-card status-${e.status}">
      <div class="notif-ico" style="background:#ff4d4d; color:white">🚨</div>
      <div class="notif-text">
        <div class="notif-msg"><strong>${e.emergencyType}</strong> at ${e.locationText}</div>
        <div class="notif-time">${formatDate(e.createdAt)} — ${statusBadge(e.status)}</div>
      </div>
    </div>
  `).join('');
}

async function initStaffView() {
  loadStaffEmergencies();
  setInterval(loadStaffEmergencies, 10000); // Refresh every 10s
}

async function loadStaffEmergencies() {
  const res = await api.get('/emergencies/active');
  const tbody = document.getElementById('staffEmergenciesList');
  if (!res.ok) return;

  const list = res.data.data;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">No active emergencies.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr class="animate-fly-in">
      <td>${timeAgo(e.createdAt)}</td>
      <td><strong>${e.patientId?.name || 'Unknown'}</strong><br><small>${e.patientId?.phone || ''}</small></td>
      <td><span class="badge badge-error">${e.emergencyType}</span></td>
      <td>${e.locationText} ${e.ambulanceRequested ? '🚑' : ''}</td>
      <td>${statusBadge(e.status)}</td>
      <td>
        ${e.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="updateStatus('${e._id}', 'accepted')">Accept</button>` : ''}
        ${e.status === 'accepted' ? `<button class="btn btn-sm btn-success" onclick="updateStatus('${e._id}', 'resolved')">Resolve</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function updateStatus(id, status) {
  const res = await api.put(`/emergencies/${id}/status`, { status });
  if (res.ok) {
    showToast('success', 'Updated', `Emergency marked as ${status}`);
    loadStaffEmergencies();
  }
}

window.updateStatus = updateStatus;
