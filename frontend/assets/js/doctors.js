/**
 * doctors.js — Doctors list page
 */
let allDoctors = [];

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initSidebar();
  await initNotifPanel();
  await loadNotifBadge();
  await loadDoctors();

  // Search
  document.getElementById('doctorSearch')?.addEventListener('input', filterDoctors);

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterDoctors();
    });
  });
});

async function loadDoctors() {
  const grid = document.getElementById('doctorGrid');
  grid.innerHTML = Array(6).fill(`<div class="skeleton" style="height:220px;border-radius:16px"></div>`).join('');

  const { ok, data } = await api.get('/doctors');
  if (!ok) {
    showToast('error', 'Error', data.message);
    grid.innerHTML = `<div class="empty"><div class="empty-ico">👨‍⚕️</div><h3>Failed to load doctors</h3></div>`;
    return;
  }

  allDoctors = data.data || [];
  document.getElementById('doctorCount').textContent = allDoctors.length;
  renderDoctors(allDoctors);
}

function filterDoctors() {
  const search = document.getElementById('doctorSearch')?.value.toLowerCase() || '';
  const activeSpec = document.querySelector('.filter-pill.active')?.dataset.spec || '';

  const filtered = allDoctors.filter(d => {
    const name = d.userId?.name?.toLowerCase() || '';
    const spec = d.specialization?.toLowerCase() || '';
    const matchSearch = !search || name.includes(search) || spec.includes(search);
    const matchSpec   = !activeSpec || spec.includes(activeSpec.toLowerCase());
    return matchSearch && matchSpec;
  });

  document.getElementById('doctorCount').textContent = filtered.length;
  renderDoctors(filtered);
}

function renderDoctors(doctors) {
  const grid = document.getElementById('doctorGrid');
  if (!doctors.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-ico">🔍</div><h3>No doctors found</h3><p>Try a different search or filter.</p></div>`;
    return;
  }

  const user = api.getUser();
  grid.innerHTML = doctors.map(d => {
    const name    = d.userId?.name || 'Dr. Unknown';
    const initials= name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const slots   = d.availability?.reduce((acc, av) => acc + av.slots.length, 0) || 0;
    const fee     = d.consultationFee ? `₹${d.consultationFee}` : 'Free';
    const bio     = d.bio || 'Experienced medical professional dedicated to quality patient care.';

    return `
      <div class="doctor-card" onclick="viewDoctor('${d._id}')">
        <div class="doctor-card-top"></div>
        <div class="doctor-card-body">
          <div class="doctor-header">
            <div class="doc-avatar">${initials}</div>
            <div>
              <div class="doc-name">${name}</div>
              <div class="doc-spec">${d.specialization}</div>
            </div>
          </div>
          <div class="doctor-stats">
            <div class="doc-stat">
              <div class="doc-stat-val">${d.experience || 0}</div>
              <div class="doc-stat-lbl">Yrs Exp</div>
            </div>
            <div class="doc-stat">
              <div class="doc-stat-val">${slots}</div>
              <div class="doc-stat-lbl">Slots</div>
            </div>
            <div class="doc-stat">
              <div class="doc-stat-val">${d.rating || '—'}</div>
              <div class="doc-stat-lbl">Rating</div>
            </div>
          </div>
          <div class="doc-bio">${bio}</div>
          <div class="doc-fee">
            <span class="doc-fee-label">Consultation Fee</span>
            <span class="doc-fee-val">${fee}</span>
          </div>
          ${user?.role === 'patient' ? `
          <button class="btn btn-primary w-full mt-4" style="margin-top:14px"
            onclick="event.stopPropagation(); bookWithDoctor('${d._id}','${name}')">
            📅 Book Appointment
          </button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function viewDoctor(id) {
  // Navigate to appointment booking with this doctor pre-selected
  localStorage.setItem('sh_selected_doctor', id);
  window.location.href = 'appointments.html';
}

function bookWithDoctor(doctorId, doctorName) {
  localStorage.setItem('sh_selected_doctor', doctorId);
  localStorage.setItem('sh_selected_doctor_name', doctorName);
  window.location.href = 'appointments.html';
}
