// admin_signup.js
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('signup-button');
  if (!btn) return;

  btn.addEventListener('click', async function () {
    const first_name  = document.getElementById('first-name')?.value.trim();
    const last_name   = document.getElementById('last-name')?.value.trim();
    const employee_id = document.getElementById('employee-id')?.value.trim();
    const email       = document.getElementById('email')?.value.trim();
    const password    = document.getElementById('password')?.value.trim();
    const position    = document.getElementById('position')?.value.trim();

    // Required fields validation
    if (!first_name || !last_name || !employee_id || !email || !password || !position) {
      showPopup('All fields are required!', 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost/BlissGateways/auth/admin_signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          employee_id,
          email,
          password,
          position
        })
      });

      // Handle response 
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Non-JSON response from server:', text);
        showPopup('Server error. Please check PHP output/console.', 'error');
        return;
      }

      if (data.status === 'success') {
        showPopup('You successfully created an account!', 'success');
        setTimeout(() => { 
          window.location.href = '/login'; 
        }, 1000);
      } else {
        const msg = (data.message || '').toLowerCase();
        if (msg.includes('invalid employee id')) {
          showPopup('Employee ID not valid or already used!', 'error');
        } else if (msg.includes('email already exists')) {
          showPopup('Email is already registered!', 'error');
        } else if (msg.includes('all fields')) {
          showPopup('All fields are required!', 'error');
        } else {
          showPopup('Error: ' + (data.message || 'Unknown error'), 'error');
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showPopup('Network error. Is Apache running?', 'error');
    }
  });

  // Password toggle (same as login.js)
  const toggle = document.getElementById("toggle-password");
  const pw = document.getElementById("password");
  const img = document.getElementById("signup-toggle-img"); // ⚡️ Ensure you have <img> in HTML

  if (toggle && pw && img) {
    toggle.addEventListener("click", function () {
      if (pw.type === "password") { 
        pw.type = "text"; 
        img.src = '{{ url_for("static", filename="icons/see.png") }}' ; 
      } else { 
        pw.type = "password"; 
        img.src = '{{ url_for("static", filename="icons/unsee.png") }}'; 
      }
    });
  }
});

// Reusable popup function
function showPopup(message, type) {
  const popup = document.createElement('div');
  popup.className = `popup ${type}`;
  popup.textContent = message;
  document.body.appendChild(popup);

  requestAnimationFrame(() => popup.classList.add('show'));

  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 300);
  }, 3000);
}
