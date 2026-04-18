/**
 * auth.js â€” Login & Register page logic
 */
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (api.isLoggedIn()) {
    const user = api.getUser();
    window.location.href = 'pages/dashboard.html';
    return;
  }

  // â”€â”€ Tab Switching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tabs       = document.querySelectorAll('.auth-tab');
  const loginForm  = document.getElementById('loginForm');
  const regForm    = document.getElementById('registerForm');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      loginForm.style.display = target === 'login'    ? 'block' : 'none';
      regForm.style.display   = target === 'register' ? 'block' : 'none';
    });
  });

  // â”€â”€ Role â†’ Extra Fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const roleSelect      = document.getElementById('regRole');
  const patientFields   = document.getElementById('patientFields');
  const doctorFields    = document.getElementById('doctorFields');

  roleSelect?.addEventListener('change', () => {
    const role = roleSelect.value;
    patientFields.classList.toggle('show', role === 'patient');
    doctorFields.classList.toggle('show',  role === 'doctor');
  });

  // â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('[type=submit]');
    setLoading(btn, true);

    const { ok, data } = await api.post('/auth/login', {
      email:    document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPass').value,
    });

    setLoading(btn, false);

    if (!ok) {
      showToast('error', 'Login Failed', data.message); return;
    }

    api.setToken(data.data.token);
    api.setUser(data.data.user);
    showToast('success', 'Welcome back!', `Logged in as ${data.data.user.name}`);
    setTimeout(() => { window.location.href = 'pages/dashboard.html'; }, 800);
  });

  // â”€â”€ Register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = regForm.querySelector('[type=submit]');
    setLoading(btn, true);

    const role = roleSelect.value;
    const payload = {
      name:     document.getElementById('regName').value.trim(),
      email:    document.getElementById('regEmail').value.trim(),
      password: document.getElementById('regPass').value,
      role,
    };

    if (role === 'patient') {
      payload.age        = document.getElementById('regAge')?.value || undefined;
      payload.gender     = document.getElementById('regGender')?.value || undefined;
      payload.bloodGroup = document.getElementById('regBlood')?.value || 'unknown';
    } else if (role === 'doctor') {
      payload.specialization = document.getElementById('regSpec')?.value || 'General';
      payload.experience     = document.getElementById('regExp')?.value || 0;
    }

    const { ok, data } = await api.post('/auth/register', payload);
    setLoading(btn, false);

    if (!ok) {
      showToast('error', 'Registration Failed', data.message); return;
    }

    api.setToken(data.data.token);
    api.setUser(data.data.user);
    showToast('success', 'Account Created!', `Welcome, ${data.data.user.name}!`);
    setTimeout(() => { window.location.href = 'pages/dashboard.html'; }, 800);
  });

  // â”€â”€ Helper: Loading State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="spinner"></span> Please waitâ€¦`
      : btn.dataset.label || 'Submit';
  }

  // Save original labels
  document.querySelectorAll('[type=submit]').forEach(btn => {
    btn.dataset.label = btn.innerHTML;
  });
});
