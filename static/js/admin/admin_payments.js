document.addEventListener("DOMContentLoaded", () => {
  let paymentsData = [];

  fetchPayments();

  function fetchPayments() {
    fetch('admin_payments.php')
      .then(res => res.json())
      .then(data => {
        paymentsData = data;
        populateTable(paymentsData);
      })
      .catch(err => console.error(err));
  }

  function populateTable(payments) {
    const tbody = document.querySelector('#payments-table tbody');
    tbody.innerHTML = '';

    payments.forEach(payment => {
      let statusClass = '';
      if(payment.status === 'Pending') statusClass = 'status-pending';
      else if(payment.status === 'Verified') statusClass = 'status-verified';
      else if(payment.status === 'Rejected') statusClass = 'status-rejected';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${payment.client_name}</td>
        <td>${payment.booking_id}</td>
        <td>$${payment.amount_due}</td>
        <td>$${payment.amount_paid}</td>
        <td>${payment.payment_method}</td>
        <td>${payment.reference_no}</td>
        <td>${new Date(payment.payment_date).toLocaleString()}</td>
        <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
        <td>${payment.receipt_image ? `<a href="${payment.receipt_image}" target="_blank" class="receipt-link">View</a>` : 'N/A'}</td>
        <td>
          ${payment.status === 'Pending' 
            ? `<button class="action-btn verify-btn" data-id="${payment.id}">Verify</button>
               <button class="action-btn reject-btn" data-id="${payment.id}">Reject</button>` 
            : 'No Actions'}
        </td>
      `;
      tbody.appendChild(tr);
    });

    addActionListeners();
  }

  function addActionListeners() {
    document.querySelectorAll('.verify-btn').forEach(btn => {
      btn.addEventListener('click', e => updateStatus(e.target.dataset.id, 'Verified'));
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', e => updateStatus(e.target.dataset.id, 'Rejected'));
    });
  }

  function updateStatus(id, status) {
    fetch('update_payment_status.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id, status})
    })
    .then(res => res.json())
    .then(resp => {
      if(resp.status === 'success') fetchPayments();
      else alert('Failed to update status');
    });
  }

  // Filter functionality
  document.getElementById('apply-filters').addEventListener('click', () => {
    const status = document.getElementById('status-filter').value;
    const method = document.getElementById('method-filter').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;

    let filtered = paymentsData;
    if(status) filtered = filtered.filter(p => p.status === status);
    if(method) filtered = filtered.filter(p => p.payment_method === method);
    if(dateFrom) filtered = filtered.filter(p => new Date(p.payment_date) >= new Date(dateFrom));
    if(dateTo) filtered = filtered.filter(p => new Date(p.payment_date) <= new Date(dateTo));

    populateTable(filtered);
  });
});
