document.addEventListener("DOMContentLoaded", () => {

  const sidebarContainer = document.getElementById("admin_sidebar");
  if (!sidebarContainer) return;

  fetch("/admin-sidebar")
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
      const logoutBtn = sidebarContainer.querySelector("#adminLogoutBtn");
      const logoutModal = sidebarContainer.querySelector("#adminLogoutModal");
      const confirmLogout = sidebarContainer.querySelector("#adminConfirmLogout");
      const cancelLogout = sidebarContainer.querySelector("#adminCancelLogout");

      if (logoutBtn && logoutModal && confirmLogout && cancelLogout) {
        logoutBtn.addEventListener("click", () => logoutModal.classList.remove("hidden"));
        confirmLogout.addEventListener("click", () => window.location.href = "/logout");
        cancelLogout.addEventListener("click", () => logoutModal.classList.add("hidden"));
        window.addEventListener("click", e => {
          if (e.target === logoutModal) logoutModal.classList.add("hidden");
        });
      } else if (logoutBtn) {
        logoutBtn.addEventListener("click", () => window.location.href = "/logout");
      }

      // --- Profile upload preview & sidebar sync ---
      const profileUpload = document.getElementById("profileUpload");
      const profilePreview = document.getElementById("profilePreview");
      const sidebarAvatar = sidebarContainer.querySelector(".admin-avatar");

      // Live preview when user selects new file
      if (profileUpload && profilePreview) {
        profileUpload.addEventListener("change", () => {
          const file = profileUpload.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = e => {
            const src = e.target.result;
            profilePreview.src = src;
            if (sidebarAvatar) sidebarAvatar.src = src;
          };
          reader.readAsDataURL(file);
        });
      }

      // --- Fetch stored avatar from server ---
      if (sidebarAvatar) {
        fetch("/api/get-admin-avatar")
          .then(res => res.json())
          .then(data => {
            if (data.avatar_url) {
              sidebarAvatar.src = data.avatar_url;
              if (profilePreview) profilePreview.src = data.avatar_url;
            }
          })
          .catch(err => console.error("Error loading avatar:", err));
      }
    })
    .catch(err => console.error("Sidebar load error:", err));
});
