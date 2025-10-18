document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const confirmPopup = document.getElementById("confirmPopup");
  const confirmLogout = document.getElementById("confirmLogout");
  const cancelLogout = document.getElementById("cancelLogout");

  if (logoutBtn && confirmPopup) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      confirmPopup.style.display = "block"; 
    });
  }

  if (cancelLogout) {
    cancelLogout.addEventListener("click", () => {
      confirmPopup.style.display = "none"; 
    });
  }

  if (confirmLogout) {
    confirmLogout.addEventListener("click", () => {
      window.location.href = "/BlissGateways/logout.php"; 
    });
  }
});
