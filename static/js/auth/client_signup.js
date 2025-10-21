document.addEventListener("DOMContentLoaded", () => {
  function showPopup(message, type = "success") {
    const popup = document.getElementById("popup");
    if (!popup) { alert(message); return; } // fallback

    popup.textContent = message;
    popup.className = "popup " + type + " show";
    setTimeout(() => { popup.className = "popup " + type; }, 3000);
  }

  const btn = document.getElementById("signup-button");
  btn.addEventListener("click", function () {
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!firstName || !lastName || !email || !password) {
      showPopup("All fields are required", "error");
      return;
    }

    fetch("/api/register-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password })
    })
    .then(res => res.json())
    .then(data => {
      showPopup(data.message, data.status === "success" ? "success" : "error");
      if (data.status === "success") {
        setTimeout(() => { window.location.href = "/login"; }, 1200);
      }
    })
    .catch(err => {
      console.error(err);
      showPopup("Server error. Please try again.", "error");
    });
  });

  // Password toggle
  const toggle = document.querySelector(".toggle-password");
  const pw = document.getElementById("password");
  const img = document.getElementById("client-toggle-img");

  toggle.addEventListener("click", function () {
    if (pw.type === "password") {
      pw.type = "text";
      img.src = '{{ url_for("static", filename="icons/see.png") }}';
    } else {
      pw.type = "password";
      img.src = '{{ url_for("static", filename="icons/unsee.png") }}';
    }
  });
});


