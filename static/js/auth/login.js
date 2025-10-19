document.addEventListener('DOMContentLoaded', () => {
  function showPopup(message, type = "success") {
    const popup = document.getElementById("popup");
    if (!popup) { alert(message); return; } 
    popup.textContent = message;
    popup.className = "popup " + type + " show";
    setTimeout(() => { popup.className = "popup " + type; }, 3000);
  }

  const btn = document.getElementById('login-button');
  if (!btn) return;

  btn.addEventListener('click', function () {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      showPopup("All fields are required", "error");
      return;
    }

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(async res => {
      const text = await res.text();
      try { return JSON.parse(text); }
      catch { showPopup("Server returned invalid response", "error"); throw new Error(text); }
    })
    .then(data => {
      showPopup(data.message, data.status === "success" ? "success" : "error");
      if (data.status === "success") {
        // Save login state
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", data.role);

        // Redirect user back to index.html after login
        setTimeout(() => {
          window.location.href = "/"; 
        }, 1200);
      }
    })
    .catch(err => {
      console.error(err);
      showPopup("Server error. Please try again.", "error");
    });
  });

  // Password toggle
  const toggle = document.getElementById("toggle-password");
  const pw = document.getElementById("password");
  const img = document.getElementById("login-toggle-img");
  if (toggle && pw && img) {
    toggle.addEventListener("click", function () {
      if (pw.type === "password") { 
        pw.type = "text"; 
        img.src = '{{ url_for("static", filename="icons/see.png") }}'; 
      } else { 
        pw.type = "password"; 
        img.src = '{{ url_for("static", filename="icons/unsee.png") }}'; 
      }
    });
  }
});

