/**
 * audit.js — Frontend logic for Audit Logs
 */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  if (api.getUser().role !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }
  initSidebar();
  initNotifPanel();
  loadLogs();
});

async function loadLogs() {
  const tbody = document.getElementById('logsTable');
  const res = await api.get('/audit');
  if (!res.ok) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Failed to load logs.</td></tr>';
    return;
  }

  const logs = res.data.data;
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No activity logs found.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td class="text-sm">${new Date(l.createdAt).toLocaleString()}</td>
      <td>
        <strong>${l.userId?.name || 'System'}</strong><br>
        <small class="text-muted">${l.userId?.role || ''}</small>
      </td>
      <td><span class="badge badge-info">${l.action}</span></td>
      <td class="text-sm">${l.details}</td>
      <td class="text-mono text-sm">${l.ipAddress || '—'}</td>
    </tr>
  `).join('');
}

window.loadLogs = loadLogs;
