document.addEventListener("DOMContentLoaded", () => {
  // --- Load sidebar dynamically ---
  const sidebarContainer = document.getElementById("client_sidebar");
  if (sidebarContainer) {
    fetch("/client-sidebar")
      .then(res => res.text())
      .then(html => {
        sidebarContainer.innerHTML = html;

        // --- Highlight active link ---
        const links = sidebarContainer.querySelectorAll(".sidebar-link");
        const currentPage = window.location.pathname.split("/").pop();
        links.forEach(link => {
          if (link.getAttribute("href") === currentPage) {
            link.classList.add("active");
          }
        });

        // --- Logout modal logic ---
        const logoutBtn = sidebarContainer.querySelector("#clientLogoutBtn");
        const logoutModal = sidebarContainer.querySelector("#clientLogoutModal");
        const confirmLogout = sidebarContainer.querySelector("#clientConfirmLogout");
        const cancelLogout = sidebarContainer.querySelector("#clientCancelLogout");

        if (logoutBtn && logoutModal && confirmLogout && cancelLogout) {
          // Open modal
          logoutBtn.addEventListener("click", () => {
            logoutModal.classList.remove("hidden");
          });

          // Confirm logout
          confirmLogout.addEventListener("click", () => {
            window.location.href = "/logout";
          });

          // Cancel logout
          cancelLogout.addEventListener("click", () => {
            logoutModal.classList.add("hidden");
          });

          // Close modal when clicking outside
          window.addEventListener("click", (e) => {
            if (e.target === logoutModal) {
              logoutModal.classList.add("hidden");
            }
          });
        } else if (logoutBtn) {
          
          logoutBtn.addEventListener("click", () => {
            window.location.href = "/logout";
          });
        }
      })
      .catch(err => console.error("Sidebar load error:", err));
  }
});
