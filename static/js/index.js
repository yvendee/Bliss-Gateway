document.addEventListener("DOMContentLoaded", () => {

  const navMenu = document.getElementById("nav-menu");
  if (!navMenu) return; 
  
  const loginBtn = document.getElementById("login-btn");
  const registerDropdown = document.getElementById("register-dropdown");

  function updateHeader() {
    const userRole = localStorage.getItem("userRole");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    const existingAccountBtn = document.querySelector(".btnMyAccount");
    if (existingAccountBtn) existingAccountBtn.remove();

    if (isLoggedIn && userRole) {
      if (loginBtn) loginBtn.style.display = "none";
      if (registerDropdown) registerDropdown.style.display = "none";

      const accountBtn = document.createElement("button");
      accountBtn.textContent = "My Account";
      accountBtn.className = "btnLogin-popup btnMyAccount";
      accountBtn.addEventListener("click", () => {
        if (userRole === "admin") window.location.href = "/admin-dashboard";
        else window.location.href = "/client-notif";
      });

      navMenu.appendChild(accountBtn);
    } else {
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (registerDropdown) registerDropdown.style.display = "inline-flex";
    }
  }

  updateHeader();

  /*** POPUP FUNCTION ***/
  function showPopup(message, type = "success") {
    const popup = document.getElementById("popup");
    if (!popup) { alert(message); return; }
    popup.textContent = message;
    popup.className = "popup " + type + " show";
    setTimeout(() => { popup.className = "popup " + type; }, 3000);
  }

  /*** LOGIN FORM HANDLER ***/
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch("login.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (data.status === "success") {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userRole", data.role);

          showPopup("Login successful!", "success");
          updateHeader();

          setTimeout(() => {
            if (data.role === "admin") window.location.href = "/admin-dashboard";
            else window.location.href = "/client-notif";
          }, 1000);
        } else {
          showPopup(data.message, "error");
        }
      } catch (err) {
        showPopup("Login failed. Try again.", "error");
      }
    });
  }

});
