document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initSidebar();
  await initNotifPanel();
  await loadNotifBadge();
  
  const user = api.getUser();
  if (user?.role === 'admin') {
    document.getElementById('addUserBtn')?.classList.remove('hidden');
    document.getElementById('addUserForm')?.addEventListener('submit', handleAddUser);
  }

  loadPatients();
});

function toggleFormFields() {
  const role = document.getElementById('addRole').value;
  const docFields = document.querySelectorAll('.doctor-field');
  const patFields = document.querySelectorAll('.patient-field');

  if (role === 'doctor') {
    docFields.forEach(f => f.classList.remove('hidden'));
    patFields.forEach(f => f.classList.add('hidden'));
  } else if (role === 'patient') {
    docFields.forEach(f => f.classList.add('hidden'));
    patFields.forEach(f => f.classList.remove('hidden'));
  } else {
    docFields.forEach(f => f.classList.add('hidden'));
    patFields.forEach(f => f.classList.add('hidden'));
  }
}

async function handleAddUser(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating…';

  const role = document.getElementById('addRole').value;
  const payload = {
    name:     document.getElementById('addName').value,
    email:    document.getElementById('addEmail').value,
    password: document.getElementById('addPassword').value,
    role:     role,
    gender:   document.getElementById('addGender').value,
  };

  if (role === 'doctor') {
    payload.specialization  = document.getElementById('addSpec').value;
    payload.consultationFee = document.getElementById('addFee').value;
  } else if (role === 'patient') {
    payload.age        = document.getElementById('addAge').value;
    payload.bloodGroup = document.getElementById('addBlood').value;
  }

  const { ok, data } = await api.post('/admin/users', payload);
  
  btn.disabled = false;
  btn.innerHTML = 'Create User Account';

  if (!ok) {
    showToast('error', 'Creation Failed', data.message);
    return;
  }

  showToast('success', 'User Created', `Successfully added ${payload.name} as a ${role}.`);
  closeModal('userModal');
  e.target.reset();
  loadPatients();
}

async function loadPatients() {
  const tbody = document.getElementById('patientsTableBody');
  const user = api.getUser();
  
  if (user.role === 'admin') {
    const { ok, data } = await api.get('/patients');
    if (!ok) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">Failed to load patients</td></tr>`;
      return;
    }
    renderPatients(data.data || []);
  } else if (user.role === 'doctor') {
    const { ok, data } = await api.get('/appointments');
    if (!ok) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">Failed to load patients</td></tr>`;
      return;
    }
    
    // Deduplicate patients from appointments
    const patientMap = {};
    (data.data || []).forEach(apt => {
      if (apt.patientId && apt.patientId._id) {
        if (!patientMap[apt.patientId._id]) {
          patientMap[apt.patientId._id] = apt.patientId;
        }
      }
    });
    
    renderPatients(Object.values(patientMap));
  } else {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">Access Denied</td></tr>`;
  }
}

function renderPatients(list) {
  const tbody = document.getElementById('patientsTableBody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty" style="padding: 30px;"><div class="empty-ico">👥</div><h3>No patients found</h3></div></td></tr>`;
    return;
  }
  
  tbody.innerHTML = list.map(p => {
    const userObj = p.userId || {}; 
    const name = userObj.name || p.name || 'Unknown';
    const email = userObj.email || p.email || '—';
    return `
      <tr>
        <td><strong>${name}</strong></td>
        <td>${email}</td>
        <td>${p.age || '—'}</td>
        <td style="text-transform:capitalize">${p.gender || '—'}</td>
        <td><span class="badge ${p.bloodGroup ? 'badge-confirmed' : 'badge-pending'}">${p.bloodGroup || '—'}</span></td>
      </tr>
    `;
  }).join('');
}

window.toggleFormFields = toggleFormFields;
