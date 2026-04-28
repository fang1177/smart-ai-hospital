/**
 * ui.js — Shared UI utilities (toast, modal helpers, sidebar init)
 * Loaded on every page after api.js
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
  });
}

// ── Toast Notifications ────────────────────────────────────────────────────────
const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };

function showToast(type = 'info', title, message, duration = 3800) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `
    <span class="toast-ico">${icons[type] || '💬'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>`;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(110%)'; t.style.transition='0.3s'; setTimeout(()=>t.remove(), 320); }, duration);
}

// ── Modal Helpers ─────────────────────────────────────────────────────────────
function openModal(id)  {
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); document.body.style.overflow='hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('active'); document.body.style.overflow=''; }
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ── Time Formatter ────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Status Badge HTML ─────────────────────────────────────────────────────────
function statusBadge(status) {
  return `<span class="badge badge-${status}">${status}</span>`;
}

function typeBadge(type) {
  const labels = { xray:'X-Ray', prescription:'Prescription', ecg:'ECG', report:'Report', lab:'Lab' };
  return `<span class="badge badge-${type}">${labels[type] || type}</span>`;
}

// ── Sidebar: inject user info + handle logout ─────────────────────────────────
function initSidebar() {
  const user = api.getUser();
  if (!user) return;

  // Role-based hard removal (Early)
  document.body.classList.add(`role-${user.role}`);

  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    // We can inject/update the nav items dynamically here to keep them consistent
    const nav = sidebar.querySelector('.sidebar-nav');
    if (nav) {
      const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
      
      const navItems = [
        { href: 'dashboard.html', icon: '📊', label: 'Dashboard', roles: ['admin', 'doctor', 'patient'] },
        { href: 'triage.html', icon: '🤖', label: 'AI Triage', roles: ['patient'] },
        { href: 'emergency.html', icon: '🚨', label: 'Emergency SOS', roles: ['admin', 'doctor', 'patient'] },
        { href: 'doctors.html', icon: '👨‍⚕️', label: 'Doctors', roles: ['admin', 'doctor', 'patient'] },
        { href: 'appointments.html', icon: '📅', label: 'Appointments', roles: ['admin', 'doctor', 'patient'] },
        { href: 'records.html', icon: '📋', label: 'Medical Records', roles: ['admin', 'doctor', 'patient'] },
        { href: 'billing.html', icon: '💳', label: 'Billing', roles: ['admin', 'doctor', 'patient'] },
        
        { section: 'Staff Only', roles: ['admin', 'doctor'] },
        { href: 'beds.html', icon: '🛏️', label: 'Bed Availability', roles: ['admin', 'doctor', 'patient'] },
        { href: 'patients.html', icon: '👥', label: 'Patients', roles: ['admin', 'doctor'] },
        
        { section: 'System', roles: ['admin'] },
        { href: 'users.html', icon: '🛡️', label: 'Manage Users', roles: ['admin'] },
        { href: 'analytics.html', icon: '📈', label: 'Analytics', roles: ['admin'] },
        { href: 'auditlogs.html', icon: '📜', label: 'Audit Logs', roles: ['admin'] },
        
        { section: 'AI', roles: ['patient'] },
        { href: 'voice.html', icon: '🎙️', label: 'Voice AI', roles: ['patient'] },
      ];

      nav.innerHTML = navItems.map(item => {
        if (item.section) {
          return item.roles.includes(user.role) ? `<div class="nav-section">${item.section}</div>` : '';
        }
        if (!item.roles.includes(user.role)) return '';
        const isActive = currentPath === item.href ? 'active' : '';
        return `<a href="${item.href}" class="nav-item ${isActive}"><span class="nav-icon">${item.icon}</span> ${item.label}</a>`;
      }).join('');
    }
  }

  // Role pill
  const rolePill = document.getElementById('sidebarRole');
  if (rolePill) rolePill.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  // Avatar initials
  document.querySelectorAll('.sidebar-avatar, .topbar-avatar').forEach(el => {
    el.textContent = (user.name || 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  });

  // Names
  document.querySelectorAll('.sidebar-user-name').forEach(el => el.textContent = user.name || '');
  document.querySelectorAll('.sidebar-user-role').forEach(el => el.textContent = user.role);
  document.querySelectorAll('.topbar-user-name').forEach(el => el.textContent = user.name || '');

  // Logout
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      api.redirectToLogin();
    });
  });

  // Sidebar brand navigation
  const sidebarBrand = document.querySelector('.sidebar-brand');
  if (sidebarBrand) {
    sidebarBrand.style.cursor = 'pointer';
    sidebarBrand.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }

  // Topbar dropdown toggle
  const userProfileBtn = document.getElementById('userProfileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  if (userProfileBtn && profileDropdown) {
    userProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', (e) => {
      if (!userProfileBtn.contains(e.target)) {
        profileDropdown.classList.remove('show');
      }
    });
  }

  initDarkMode();
  initLanguage();
}

// ── Dark Mode ───────────────────────────────────────────────────────────────
function initDarkMode() {
  const isDark = localStorage.getItem('sh_theme') === 'dark';
  if (isDark) document.body.classList.add('dark-mode');

  // Add toggle to topbar if it doesn't exist
  const topbarActions = document.querySelector('.topbar-actions');
  if (topbarActions && !document.getElementById('themeToggle')) {
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'topbar-icon-btn';
    btn.title = 'Toggle Dark Mode';
    btn.innerHTML = isDark ? '🌙' : '☀️';
    btn.onclick = () => {
      const isNowDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('sh_theme', isNowDark ? 'dark' : 'light');
      btn.innerHTML = isNowDark ? '🌙' : '☀️';
    };
    topbarActions.prepend(btn);
  }
}

// ── Multi-Language Support ──────────────────────────────────────────────────
const translations = {
  en: { dashboard: 'Dashboard', appointments: 'Appointments', doctors: 'Doctors', triage: 'AI Triage', logout: 'Logout', emergency: 'Emergency' },
  te: { dashboard: 'డాష్‌బోర్డ్', appointments: 'నియామకాలు', doctors: 'వైద్యులు', triage: 'AI ట్రియేజ్', logout: 'లాగ్ అవుట్', emergency: 'అత్యవసర' },
  hi: { dashboard: 'डैशबोर्ड', appointments: 'नियुक्ति', doctors: 'डॉक्टर', triage: 'एआई ट्राइएज', logout: 'लॉग आउट', emergency: 'आपातकालीन' }
};

function initLanguage() {
  const lang = localStorage.getItem('sh_lang') || 'en';
  applyLanguage(lang);

  const topbarActions = document.querySelector('.topbar-actions');
  if (topbarActions && !document.getElementById('langSelector')) {
    const wrap = document.createElement('div');
    wrap.id = 'langSelector';
    wrap.style = 'margin-right: 10px;';
    wrap.innerHTML = `
      <select class="form-control form-control-sm" style="width:70px; padding:2px 5px;" onchange="applyLanguage(this.value); localStorage.setItem('sh_lang', this.value);">
        <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
        <option value="te" ${lang === 'te' ? 'selected' : ''}>TE</option>
        <option value="hi" ${lang === 'hi' ? 'selected' : ''}>HI</option>
      </select>
    `;
    topbarActions.prepend(wrap);
  }
}

function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;
  // This is a basic implementation, in a real app we'd use data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
}

// ── Notification badge updater ─────────────────────────────────────────────────
async function loadNotifBadge() {
  const res = await api.get('/notifications');
  if (res.ok) {
    const count = res.data.data?.unreadCount || 0;
    document.querySelectorAll('.notif-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    return count;
  }
  return 0;
}

// ── Notification panel toggle ─────────────────────────────────────────────────
// ── Notification panel toggle ─────────────────────────────────────────────────
async function initNotifPanel() {
  const btn   = document.getElementById('notifBtn');
  const panel = document.getElementById('notifPanel');
  if (!btn || !panel) return;

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    if (isOpen) await renderNotifPanel(panel);
  });

  document.addEventListener('click', () => panel.classList.remove('open'));
  panel.addEventListener('click', e => e.stopPropagation());

  const markAll = panel.querySelector('.mark-all');
  if (markAll) {
    markAll.addEventListener('click', async () => {
      await api.patch('/notifications/read-all');
      await renderNotifPanel(panel);
      await loadNotifBadge();
    });
  }

  // Start background polling for new notifications
  startNotifPolling();
}

async function renderNotifPanel(panel) {
  const list = panel.querySelector('.notif-list');
  if (!list) return;
  list.innerHTML = `<div class="notif-item"><div class="text-muted text-sm" style="padding:8px">Loading…</div></div>`;

  const res = await api.get('/notifications');
  if (!res.ok || !res.data.data) { list.innerHTML = ''; return; }

  const { notifications } = res.data.data;
  if (!notifications.length) {
    list.innerHTML = `<div class="empty" style="padding:30px"><div class="empty-ico">🔔</div><p>No notifications yet</p></div>`;
    return;
  }

  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n._id}',this)">
      <div class="notif-ico ${n.type}">${{appointment:'📅',reminder:'⏰',system:'🏥',record:'📋'}[n.type]||'🔔'}</div>
      <div class="notif-text">
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${timeAgo(n.timestamp)}</div>
      </div>
      ${!n.read ? '<div class="unread-dot"></div>' : ''}
    </div>`).join('');
}

async function markNotifRead(id, el) {
  await api.patch(`/notifications/${id}/read`);
  el.classList.remove('unread');
  el.querySelector('.unread-dot')?.remove();
  await loadNotifBadge();
}

// ── Notification Polling ────────────────────────────────────────────────────────
let notifInterval;
let lastUnreadCount = -1;

function startNotifPolling(intervalMs = 15000) {
  if (notifInterval) clearInterval(notifInterval);
  
  // Initial load
  loadNotifBadge().then(count => { lastUnreadCount = count; });

  notifInterval = setInterval(async () => {
    if (api.isLoggedIn()) {
      const res = await api.get('/notifications');
      if (!res.ok) return;

      const { notifications, unreadCount } = res.data.data;
      
      // Check for high-intensity alerts
      const highAlert = notifications.find(n => n.isHighIntensity && !n.read);
      const sosAlert = notifications.find(n => n.message.includes('🚨 EMERGENCY SOS') && !n.read);

      if (sosAlert && ['admin', 'doctor'].includes(api.getUser().role)) {
        showEmergencyAlert(sosAlert);
      } else if (highAlert) {
        showMedicalAlert(highAlert);
      } else if (lastUnreadCount !== -1 && unreadCount > lastUnreadCount) {
        showToast('info', 'New Notification', 'You have received a new update.');
      }
      
      lastUnreadCount = unreadCount;
      document.querySelectorAll('.notif-count').forEach(el => {
        el.textContent = unreadCount;
        el.style.display = unreadCount > 0 ? 'flex' : 'none';
      });
    }
  }, intervalMs);
}

// ── Medical Alert (High Intensity) ───────────────────────────────────────────
function showMedicalAlert(notif) {
  // Prevent duplicate alerts
  if (document.getElementById('medicalAlertOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'medicalAlertOverlay';
  overlay.className = 'medical-alert-overlay active';
  overlay.innerHTML = `
    <div class="medical-alert-card animate-scale-in">
      <div class="alert-icon-wrap">
        <div class="alert-icon">💊</div>
        <div class="alert-pulse"></div>
      </div>
      <h2 class="alert-title">MEDICINE REMINDER</h2>
      <p class="alert-msg">${notif.message}</p>
      <div class="alert-btns">
        <button class="btn btn-success btn-lg" onclick="handleAlertAction('${notif._id}', 'taken')">✅ Already Taken</button>
        <button class="btn btn-secondary btn-lg" onclick="handleAlertAction('${notif._id}', 'snooze')">⏰ Remind in 5m</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Play alert sound
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-medical-ring-tone-of-a-hospital-cardiac-monitor-1153.mp3');
  audio.loop = true;
  audio.play().catch(e => console.warn('Audio play failed:', e));
  overlay.dataset.audioPlaying = 'true';
  window._alertAudio = audio;
}

// ── Emergency SOS Alert (Staff Only) ─────────────────────────────────────────
function showEmergencyAlert(notif) {
  if (document.getElementById('emergencyAlertOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'emergencyAlertOverlay';
  overlay.className = 'medical-alert-overlay active';
  overlay.style.zIndex = '9999';
  overlay.innerHTML = `
    <div class="medical-alert-card animate-scale-in" style="border: 4px solid #EF4444; background: rgba(0,0,0,0.95);">
      <div class="alert-icon-wrap">
        <div class="alert-icon" style="background:#EF4444">🚨</div>
        <div class="alert-pulse" style="background:#EF4444"></div>
      </div>
      <h2 class="alert-title" style="color:#EF4444">🚨 EMERGENCY SOS 🚨</h2>
      <p class="alert-msg" style="color:#FFF; font-weight:700">${notif.message}</p>
      <div class="alert-btns">
        <a href="emergency.html" class="btn btn-danger btn-lg" onclick="handleEmergencyAction('${notif._id}')">🚑 DISPATCH AMBULANCE</a>
        <button class="btn btn-secondary btn-lg" onclick="handleEmergencyAction('${notif._id}', 'close')">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-emergency-siren-1582.mp3');
  audio.loop = true;
  audio.play().catch(e => console.warn('Audio play failed:', e));
  window._emergencyAudio = audio;
}

async function handleEmergencyAction(notifId, action) {
  const overlay = document.getElementById('emergencyAlertOverlay');
  if (window._emergencyAudio) {
    window._emergencyAudio.pause();
    window._emergencyAudio = null;
  }
  if (action !== 'close') {
    await api.patch(`/notifications/${notifId}/read`);
  }
  overlay?.remove();
}

async function handleAlertAction(notifId, action) {
  const overlay = document.getElementById('medicalAlertOverlay');
  if (window._alertAudio) {
    window._alertAudio.pause();
    window._alertAudio = null;
  }

  if (action === 'taken') {
    await api.patch(`/notifications/${notifId}/read`);
    showToast('success', 'Confirmed', 'Medicine record updated.');
    overlay?.remove();
  } else {
    // Snooze — just close and it will reappear in next polling if unread
    overlay?.remove();
  }
  loadNotifBadge();
}

// ── Guard: redirect if not logged in ─────────────────────────────────────────
function requireAuth() {
  if (!api.isLoggedIn()) api.redirectToLogin();
}

/**
 * Smoothly animate a number from 0 to target
 */
function animateNumber(id, target, duration = 1200) {
  const el = document.getElementById(id);
  if (!el || target === 0) {
    if (el) el.textContent = target;
    return;
  }
  
  let start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(easeProgress * target);
    
    el.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target; // Ensure exact final value
    }
  }
  
  requestAnimationFrame(update);
}

// ── Expose globally ───────────────────────────────────────────────────────────
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.statusBadge = statusBadge;
window.typeBadge = typeBadge;
window.initSidebar = initSidebar;
window.loadNotifBadge = loadNotifBadge;
window.initNotifPanel = initNotifPanel;
window.markNotifRead = markNotifRead;
window.requireAuth = requireAuth;
window.startNotifPolling = startNotifPolling;
window.animateNumber = animateNumber;
window.showMedicalAlert = showMedicalAlert;
window.handleAlertAction = handleAlertAction;
window.showEmergencyAlert = showEmergencyAlert;
window.handleEmergencyAction = handleEmergencyAction;
