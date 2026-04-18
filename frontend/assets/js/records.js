/**
 * records.js — Medical Records page logic
 */
let cachedRecords = [];
let patientsList  = [];

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth();
  initSidebar();
  await initNotifPanel();
  await loadNotifBadge();

  const user = api.getUser();

  if (user?.role === 'doctor' || user?.role === 'admin') {
    document.getElementById('uploadSection')?.classList.remove('hidden');
    await loadPatientsForUpload();
    setupDropZone();
    document.getElementById('uploadForm')?.addEventListener('submit', handleUpload);
  }

  await loadRecords();

  // Filter pills
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filterRecords();
    });
  });
});

async function loadPatientsForUpload() {
  const { ok, data } = await api.get('/patients');
  patientsList = ok ? data.data || [] : [];
  const sel = document.getElementById('uploadPatient');
  if (!sel) return;
  sel.innerHTML = `<option value="">Select Patient</option>` +
    patientsList.map(p => `<option value="${p._id}">${p.userId?.name || 'Unknown'}</option>`).join('');
}

async function loadRecords() {
  const grid = document.getElementById('recordsGrid');
  if (!grid) return;
  grid.innerHTML = Array(4).fill(`<div class="skeleton" style="height:140px;border-radius:12px"></div>`).join('');

  const user = api.getUser();
  let res;
  if (user?.role === 'patient') {
    res = await api.get('/records/my');
  } else {
    // Admin/doctor: not filtering by patient for now — show all via patient list
    res = await api.get('/records/my');
  }

  if (!res.ok) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-ico">📁</div><h3>Failed to load records</h3></div>`;
    return;
  }

  cachedRecords = res.data.data || [];
  document.getElementById('recordCount').textContent = cachedRecords.length;
  renderRecords(cachedRecords);
}

function filterRecords() {
  const type = document.querySelector('.filter-pill.active')?.dataset.type || '';
  const filtered = type ? cachedRecords.filter(r => r.type === type) : cachedRecords;
  document.getElementById('recordCount').textContent = filtered.length;
  renderRecords(filtered);
}

const typeIcons = { xray:'🩻', prescription:'💊', ecg:'💓', report:'📄', lab:'🧪' };
const typeBgs   = { xray:'#F0F9FF', prescription:'#F0FDF4', ecg:'#FFF7ED', report:'#FAF5FF', lab:'#FEF2F2' };
const typeColors= { xray:'#0369A1', prescription:'#15803D', ecg:'#C2410C', report:'#6D28D9', lab:'#B91C1C' };

function renderRecords(records) {
  const grid = document.getElementById('recordsGrid');

  if (!records.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="empty-ico">📋</div>
      <h3>No records found</h3>
      <p>Medical records uploaded by your doctor will appear here.</p>
    </div>`;
    return;
  }

  grid.innerHTML = records.map(r => {
    const doctor   = r.doctorId?.userId?.name ? `Dr. ${r.doctorId.userId.name}` : 'System';
    const fileUrl  = r.fileUrl?.startsWith('/') ? `http://localhost:5000${r.fileUrl}` : r.fileUrl;
    const bgcolor  = typeBgs[r.type]   || '#F1F5F9';
    const color    = typeColors[r.type] || '#64748B';
    const icon     = typeIcons[r.type]  || '📄';

    return `
      <div class="rec-card">
        <div class="rec-head">
          <div class="rec-type-ico" style="background:${bgcolor};color:${color}">${icon}</div>
          <div>
            <div class="rec-name">${r.fileName || 'Medical File'}</div>
            <div class="rec-date">${formatDate(r.uploadedAt)}</div>
          </div>
        </div>
        <div class="mb-4">${typeBadge(r.type)}</div>
        ${r.notes ? `<div class="rec-notes">${r.notes}</div>` : ''}
        <div class="rec-footer">
          <span class="text-sm text-muted">By ${doctor}</span>
          <a href="${fileUrl}" target="_blank" class="btn btn-sm btn-secondary">
            👁 View
          </a>
        </div>
      </div>`;
  }).join('');
}

// ── Upload ─────────────────────────────────────────────────────────────────────
async function handleUpload(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Uploading…`;

  const fd = new FormData();
  const fileInput = document.getElementById('uploadFile');

  if (!fileInput.files[0]) {
    showToast('warning', 'No File', 'Please select a file to upload.');
    btn.disabled = false; btn.innerHTML = '⬆ Upload Record'; return;
  }

  fd.append('file',      fileInput.files[0]);
  fd.append('patientId', document.getElementById('uploadPatient').value);
  fd.append('type',      document.getElementById('uploadType').value);
  fd.append('notes',     document.getElementById('uploadNotes').value);

  const { ok, data } = await api.upload('/records/upload', fd);
  btn.disabled = false; btn.innerHTML = '⬆ Upload Record';

  if (!ok) { showToast('error', 'Upload Failed', data.message); return; }

  showToast('success', 'Uploaded!', 'Medical record saved successfully.');
  e.target.reset();
  document.getElementById('dropZoneText').textContent = 'Click or drag file here';
  await loadRecords();
}

function setupDropZone() {
  const zone  = document.getElementById('dropZone');
  const input = document.getElementById('uploadFile');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      document.getElementById('dropZoneText').textContent = `📎 ${e.dataTransfer.files[0].name}`;
    }
  });
  input.addEventListener('change', () => {
    if (input.files[0]) {
      document.getElementById('dropZoneText').textContent = `📎 ${input.files[0].name}`;
    }
  });
}
