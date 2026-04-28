/**
 * beds.js — Frontend logic for Bed Management
 */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initSidebar();
  initNotifPanel();
  
  loadBeds();
  loadStats();

  const user = api.getUser();
  const isStaff = ['admin', 'doctor'].includes(user?.role);

  // Hide admin controls for patients, show for staff
  if (isStaff) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    const addBtn = document.getElementById('addBedBtnTop');
    if (addBtn) addBtn.style.display = '';
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  if (isStaff) {
    document.getElementById('addBedForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        bedNumber: document.getElementById('bedNumber').value,
        wardType: document.getElementById('wardType').value
      };
      const res = await api.post('/beds', data);
      if (res.ok) {
        showToast('success', 'Bed Added', 'New bed created.');
        closeModal('addBedModal');
        loadBeds();
        loadStats();
      }
    });

    document.getElementById('manageStatus')?.addEventListener('change', (e) => {
      document.getElementById('patientAssignGroup').style.display = e.target.value === 'occupied' ? 'block' : 'none';
    });

    document.getElementById('manageBedForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('manageBedId').value;
      const data = {
        status: document.getElementById('manageStatus').value,
        patientId: document.getElementById('managePatientId').value || null
      };
      const res = await api.put(`/beds/${id}/status`, data);
      if (res.ok) {
        showToast('success', 'Updated', 'Bed status updated.');
        closeModal('manageBedModal');
        loadBeds();
        loadStats();
      }
    });

    document.getElementById('deleteBedBtn')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this bed?')) return;
      const id = document.getElementById('manageBedId').value;
      const res = await api.del(`/beds/${id}`);
      if (res.ok) {
        showToast('success', 'Deleted', 'Bed removed.');
        closeModal('manageBedModal');
        loadBeds();
        loadStats();
      }
    });
  }

  document.getElementById('filterWard')?.addEventListener('change', () => loadBeds());
});

async function loadBeds() {
  const grid = document.getElementById('bedGrid');
  const filter = document.getElementById('filterWard').value;
  
  const res = await api.get('/beds');
  if (!res.ok) return;

  let beds = res.data.data;
  if (filter !== 'all') {
    beds = beds.filter(b => b.wardType === filter);
  }

  const isStaffView = ['admin', 'doctor'].includes(api.getUser()?.role);

  grid.innerHTML = beds.map(b => `
    <div class="card glass-card bed-card bed-${b.status} animate-scale-in" ${isStaffView ? `onclick="openManageModal('${b._id}', '${b.bedNumber}', '${b.status}', '${b.patientId?._id || ''}')" style="cursor:pointer"` : ''}>
      <div class="bed-icon">${b.status === 'occupied' ? '🛌' : b.status === 'maintenance' ? '🔧' : '🛏️'}</div>
      <div class="bed-number">${b.bedNumber}</div>
      <div class="bed-ward">${b.wardType}</div>
      <div class="bed-status">${statusBadge(b.status)}</div>
      ${isStaffView && b.patientId ? `<div style="font-size:0.7rem; margin-top:5px; color:var(--primary)">${b.patientId.name}</div>` : ''}
    </div>
  `).join('');

  if (!beds.length) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1; padding:60px"><div class="empty-ico">🛏️</div><h3>No beds found</h3><p>Admin needs to add beds first.</p></div>';
  }
}

async function loadStats() {
  const res = await api.get('/beds/stats');
  if (res.ok) {
    const s = res.data.data;
    animateNumber('totalBeds', s.total);
    animateNumber('availBeds', s.available);
    animateNumber('occBeds', s.occupied);
    animateNumber('maintBeds', s.maintenance);
  }
}

function openManageModal(id, num, status, patientId) {
  if (api.getUser().role === 'patient') return;
  
  document.getElementById('manageBedId').value = id;
  document.getElementById('manageBedTitle').textContent = num;
  document.getElementById('manageStatus').value = status;
  document.getElementById('managePatientId').value = patientId;
  document.getElementById('patientAssignGroup').style.display = status === 'occupied' ? 'block' : 'none';
  
  const billBtn = document.getElementById('generateBillBtn');
  if (billBtn) {
    if (status === 'occupied' && patientId) {
      billBtn.style.display = 'flex';
      billBtn.dataset.patientId = patientId;
      billBtn.dataset.bedNum = num;
    } else {
      billBtn.style.display = 'none';
    }
  }
  
  openModal('manageBedModal');
}

function generateBedBill() {
  const btn = document.getElementById('generateBillBtn');
  const patientId = btn.dataset.patientId;
  const bedNum = btn.dataset.bedNum;
  if (patientId) {
    window.location.href = `billing.html?createBill=true&patientId=${patientId}&title=Bed%20Charge%20${bedNum}&desc=Bed%20Assignment%20Fee`;
  }
}

window.openManageModal = openManageModal;
window.generateBedBill = generateBedBill;
