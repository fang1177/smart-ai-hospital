/**
 * triage.js — Frontend logic for AI Symptom Triage
 */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initSidebar();
  initNotifPanel();

  const user = api.getUser();
  if (user?.role !== 'patient') {
    document.querySelector('.triage-container').innerHTML = `
      <div class="empty" style="padding:100px 20px">
        <div class="empty-ico">🔒</div>
        <h3>Patient Access Only</h3>
        <p>The AI Symptom Triage is exclusively for patient assessments.</p>
        <a href="dashboard.html" class="btn btn-primary" style="margin-top:20px">Go to Dashboard</a>
      </div>`;
    return;
  }
  
  const form = document.getElementById('triageForm');
  const loader = document.getElementById('triageLoading');
  const resultBox = document.getElementById('resultBox');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const symptoms = document.getElementById('symptoms').value;
    const age      = document.getElementById('age').value;
    const duration = document.getElementById('duration').value;
    const severity = document.getElementById('severity').value;

    loader.style.display = 'flex';
    resultBox.style.display = 'none';

    const res = await api.post('/ai/triage', { symptoms, age, duration, severity });
    
    loader.style.display = 'none';

    if (res.ok) {
      const data = res.data.data;
      
      document.getElementById('resConcern').textContent = data.concernLevel;
      document.getElementById('resConcern').className = `urgency-badge urgency-${data.concernLevel}`;
      
      document.getElementById('resDept').textContent = data.suggestedDepartment;
      document.getElementById('resUrgency').textContent = data.urgencyLevel;
      document.getElementById('resRec').textContent = data.recommendation;

      resultBox.style.display = 'block';
      form.style.display = 'none';
      
      showToast('success', 'Assessment Complete', 'AI has analyzed your symptoms.');
      
      // Load Specialists
      loadSuggestedDoctors(data.suggestedDepartment);
    } else {
      showToast('error', 'Analysis Failed', res.data.message || 'Something went wrong');
    }
  });
});

async function loadSuggestedDoctors(dept) {
  const container = document.getElementById('recommendedDoctors');
  const list = document.getElementById('doctorsList');
  const deptName = document.getElementById('suggestedDeptName');

  if (!container || !list) return;

  deptName.textContent = dept;
  list.innerHTML = '<div class="spinner"></div>';
  container.classList.remove('hidden');

  // We filter doctors by specialization (department)
  const res = await api.get('/doctors');
  if (res.ok) {
    const doctors = (res.data.data || []).filter(d => 
      d.specialization.toLowerCase().includes(dept.toLowerCase()) || 
      dept.toLowerCase().includes(d.specialization.toLowerCase())
    );

    if (doctors.length === 0) {
      list.innerHTML = '<p class="text-muted">No specialists found in this department at the moment.</p>';
      return;
    }

    list.innerHTML = doctors.map(doc => `
      <div class="doc-mini-card glass-card">
        <div class="doc-mini-avatar">👨‍⚕️</div>
        <div class="doc-mini-info">
          <div class="doc-mini-name">Dr. ${doc.userId.name}</div>
          <div class="doc-mini-spec">${doc.specialization}</div>
          <div class="doc-mini-fee">Fee: ₹${doc.consultationFee}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="bookFromTriage('${doc._id}', '${doc.userId.name}')">Book Now</button>
      </div>
    `).join('');
  } else {
    list.innerHTML = '<p class="text-danger">Failed to load specialists.</p>';
  }
}

window.bookFromTriage = (doctorId, doctorName) => {
  localStorage.setItem('sh_pending_booking', JSON.stringify({ doctorId, doctorName }));
  window.location.href = 'appointments.html?fromTriage=true';
};

