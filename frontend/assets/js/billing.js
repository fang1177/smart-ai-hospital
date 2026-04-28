/**
 * billing.js â€” Handling invoices and Razorpay payments
 */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  initSidebar();
  initNotifPanel();
  loadNotifBadge();
  loadBills();

  const user = api.getUser();
  if (['admin', 'doctor'].includes(user?.role)) {
    loadPatientsDropdown();
  }

  // Handle Create Bill
  const createBillForm = document.getElementById('createBillForm');
  if (createBillForm) {
    createBillForm.addEventListener('submit', handleCreateBill);
  }

  // Handle filtering
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadBills(btn.dataset.filter);
    });
  });

  // Handle auto-open create bill from URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('createBill') === 'true' && ['admin', 'doctor'].includes(user?.role)) {
    setTimeout(() => {
      const pId = urlParams.get('patientId');
      if (pId) {
        // Try to match patient ID in the dropdown. The value might be Patient _id not User _id.
        // We will just try setting it.
        const sel = document.getElementById('billPatient');
        if (sel) sel.value = pId;
      }
      
      const title = urlParams.get('title');
      if (title) document.getElementById('billTitle').value = title;
      
      const desc = urlParams.get('desc');
      if (desc) {
        const descInputs = document.querySelectorAll('.item-desc');
        if (descInputs.length > 0) descInputs[0].value = desc;
      }
      
      // Default due date to today
      document.getElementById('billDueDate').value = new Date().toISOString().split('T')[0];
      
      openModal('createBillModal');
      
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 1000); // Wait for patients to load
  }
});

async function loadBills(filter = 'all') {
  const list = document.getElementById('billingList');
  const empty = document.getElementById('emptyBills');
  if (!list) return;

  list.innerHTML = '<div class="spinner"></div>';
  empty.classList.add('hidden');

  const user = api.getUser();
  const endpoint = ['admin', 'doctor'].includes(user?.role) ? '/bills' : '/bills/my';

  const { ok, data } = await api.get(endpoint);
  if (!ok) {
    list.innerHTML = '';
    showToast('error', 'Error', 'Failed to load bills');
    return;
  }

  let bills = data.data || [];
  if (filter !== 'all') {
    bills = bills.filter(b => b.status === filter);
  }

  if (!bills.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  list.innerHTML = bills.map(b => `
    <div class="card glass-card bill-card animate-scale-in">
      <div class="bill-header">
        <div class="bill-type-icon ${b.status === 'paid' ? 'success' : 'pending'}">
          ${b.status === 'paid' ? 'âœ…' : 'â³'}
        </div>
        <div class="bill-main-info">
          <div class="bill-title">${b.title}</div>
          <div class="bill-meta">
            ${['admin', 'doctor'].includes(user?.role) 
              ? `Patient: <strong>${b.patientId?.userId?.name || b.patientId?.name || 'Unknown'}</strong>` 
              : `Issued by ${b.doctorId?.userId?.name ? 'Dr. ' + b.doctorId.userId.name : (b.createdBy?.name || 'Admin')}`} 
            &bull; ${formatDate(b.createdAt)}
          </div>
        </div>
        <div class="bill-total">&#8377;${b.totalAmount}</div>
      </div>
      <div class="bill-body">
        <div class="bill-items-summary">
          ${b.items.map(it => `
            <div class="bill-item">
              <span>${it.description}</span>
              <span>â‚¹${it.amount}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="bill-footer">
        <div class="bill-status-wrap">
          <span class="badge badge-${b.status}">${b.status.toUpperCase()}</span>
          ${b.status === 'pending' ? `<span class="due-tag">Due by ${formatDate(b.dueDate)}</span>` : ''}
        </div>
        ${b.status === 'pending' && user?.role === 'patient' ? `
          <button class="btn btn-primary btn-sm" onclick="payBill('${b._id}')">Pay Now</button>
        ` : b.status === 'paid' ? `
          <div class="paid-at">Paid on ${formatDate(b.paidAt)}</div>
        ` : `<div class="text-muted text-sm italic">Awaiting Payment</div>`}
      </div>
    </div>
  `).join('');
}

async function payBill(billId) {
  const res = await api.post(`/bills/${billId}/pay`);
  if (!res.ok) {
    showToast('error', 'Payment Failed', res.data?.message || 'Could not process payment');
    return;
  }

  const responseData = res.data.data;

  // Demo Mode — no Razorpay popup needed
  if (responseData?.isDemo) {
    showToast('success', '✅ Payment Successful (Demo)', 'Your bill has been marked as paid in demo mode.');
    loadBills();
    return;
  }

  const { orderId, amount, keyId } = responseData;

  const options = {
    key: keyId,
    amount: amount * 100,
    currency: 'INR',
    name: 'Smart Hospital AI',
    description: 'Medical Bill Payment',
    order_id: orderId,
    handler: async function (response) {
      const verifyRes = await api.post('/bills/verify', response);
      if (verifyRes.ok) {
        showToast('success', 'Payment Successful', 'Your bill has been marked as paid.');
        loadBills();
      } else {
        showToast('error', 'Verification Failed', verifyRes.data?.message);
      }
    },
    prefill: {
      name: api.getUser()?.name || '',
      email: api.getUser()?.email || '',
    },
    theme: { color: '#2563EB' }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

/**
 * â”€â”€â”€ Staff Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */
async function loadPatientsDropdown() {
  const res = await api.get('/admin/users?role=patient');
  const select = document.getElementById('billPatient');
  if (!select || !res.ok) return;

  const patients = res.data.data?.users || [];
  // Note: we need the patient profile ID, not User ID. 
  // For simplicity, lets assume we need a better endpoint or fetch patients list.
  // Actually, /api/patients handles lists.
  const patRes = await api.get('/patients');
  if (patRes.ok) {
    const list = patRes.data.data || [];
    select.innerHTML = '<option value="">Select Patient</option>' + 
      list.map(p => `<option value="${p._id}">${p.userId?.name} (${p.userId?.email})</option>`).join('');
  }
}

function addBillItemRow() {
  const wrap = document.getElementById('billItems');
  const div = document.createElement('div');
  div.className = 'bill-item-row';
  div.style = 'display:flex; gap:10px; margin-bottom:10px;';
  div.innerHTML = `
    <input type="text" placeholder="Description" class="form-control item-desc" required />
    <input type="number" placeholder="Amount" class="form-control item-amt" style="width:120px;" required />
    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">âœ–</button>
  `;
  wrap.appendChild(div);
}

async function handleCreateBill(e) {
  e.preventDefault();
  const patientId = document.getElementById('billPatient').value;
  const title = document.getElementById('billTitle').value;
  const dueDate = document.getElementById('billDueDate').value;
  
  const items = Array.from(document.querySelectorAll('.bill-item-row')).map(row => ({
    description: row.querySelector('.item-desc').value,
    amount: parseFloat(row.querySelector('.item-amt').value)
  }));

  const res = await api.post('/bills', { patientId, title, items, dueDate });
  if (res.ok) {
    showToast('success', 'Bill Generated', 'The patient has been notified.');
    closeModal('createBillModal');
    loadBills();
    e.target.reset();
  } else {
    showToast('error', 'Creation Failed', res.data.message);
  }
}
