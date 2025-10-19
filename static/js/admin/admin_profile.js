document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  const profileUpload = document.getElementById("profileUpload");
  const profilePreview = document.getElementById("profilePreview");
  const confirmPassword = document.getElementById("confirmPassword");
  const password = document.getElementById("password");

  const editBtn = document.querySelector(".edit-button");
  const saveBtn = document.querySelector(".save-button");

  // Create Cancel button dynamically
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "cancel-button";
  cancelBtn.style.display = "none";
  saveBtn.parentElement.insertBefore(cancelBtn, saveBtn);

  const inputs = form.querySelectorAll("input, select");

  let initialData = {};

  function saveInitialData() {
    initialData = {};
    inputs.forEach((input) => {
      initialData[input.id] = input.value;
    });
    if (profilePreview) initialData.avatar = profilePreview.src;
  }

  function revertData() {
    inputs.forEach((input) => {
      if (input.id in initialData) input.value = initialData[input.id];
    });
    if (profilePreview && initialData.avatar)
      profilePreview.src = initialData.avatar;
  }

  // Disable inputs initially
  inputs.forEach((input) => {
    if (input.type !== "hidden") input.disabled = true;
  });

  const positionInput = document.getElementById("position");
  const employeeInput = document.getElementById("employeeID");
  if (positionInput) positionInput.disabled = true;
  if (employeeInput) employeeInput.disabled = true;

  saveBtn.style.display = "none";

  // --- Fetch and prefill profile data ---
  fetch("get_admin_profile.php")
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        document.getElementById("firstName").value = data.firstName || "";
        document.getElementById("lastName").value = data.lastName || "";
        document.getElementById("birthday").value = data.birthday || "";
        document.getElementById("gender").value = data.gender || "";
        document.getElementById("address").value = data.address || "";
        document.getElementById("contact").value = data.contact || "";
        if (employeeInput) employeeInput.value = data.employeeID || "";
        if (positionInput) positionInput.value = formatPosition(data.position || "");
        document.getElementById("email").value = data.email || "";

        if (data.avatar && profilePreview) {
          profilePreview.src = data.avatar;
          const sidebarAvatar = document.querySelector(".admin-avatar");
          if (sidebarAvatar) sidebarAvatar.src = data.avatar;
        }
        saveInitialData();
      } else {
        console.error("Profile fetch failed:", data.message);
      }
    })
    .catch((err) => {
      console.error("Profile fetch error:", err);
    });

  // --- Avatar edit icon (outside container) ---
  if (profilePreview) {
    const avatarContainer = profilePreview.parentElement;

    const editIcon = document.createElement("div");
    editIcon.innerHTML = "&#9998;";
    editIcon.className = "profile-edit-icon";

    // place outside bottom-right of avatar circle
    editIcon.style.position = "absolute";
    editIcon.style.bottom = "-10px";
    editIcon.style.right = "-10px";
    editIcon.style.background = "#007bff";
    editIcon.style.color = "#fff";
    editIcon.style.padding = "6px";
    editIcon.style.borderRadius = "50%";
    editIcon.style.cursor = "pointer";
    editIcon.style.fontSize = "14px";
    editIcon.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

    avatarContainer.style.position = "relative";
    avatarContainer.appendChild(editIcon);

    editIcon.addEventListener("click", () => profileUpload.click());

    profileUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        profilePreview.src = url;

        // update sidebar instantly
        const sidebarAvatar = document.querySelector(".admin-avatar");
        if (sidebarAvatar) sidebarAvatar.src = url;
      }
    });
  }

  // --- Enable editing ---
  editBtn.addEventListener("click", () => {
    inputs.forEach((input) => {
      if (input !== positionInput && input !== employeeInput) input.disabled = false;
    });
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
  });

  // --- Cancel editing ---
  cancelBtn.addEventListener("click", () => {
    revertData();
    inputs.forEach((input) => {
      if (input !== positionInput && input !== employeeInput) input.disabled = true;
    });
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
  });

  // --- Submit profile update ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (password.value || confirmPassword.value) {
      if (password.value !== confirmPassword.value) {
        showPopup("Passwords do not match!", "error");
        return;
      }

      if (!validatePassword(password.value)) {
        showPopup(
          "Password must be at least 8 chars with uppercase, number, special char.",
          "error"
        );
        return;
      }
    }

    const formData = new FormData(form);
    try {
      const res = await fetch("admin_profile.php", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        showPopup(data.message, "success");

        if (data.avatar && profilePreview) {
          profilePreview.src = data.avatar;
          const sidebarAvatar = document.querySelector(".admin-avatar");
          if (sidebarAvatar) sidebarAvatar.src = data.avatar;
        }

        if (data.employeeID && employeeInput)
          employeeInput.value = data.employeeID;
        if (data.position && positionInput)
          positionInput.value = formatPosition(data.position);

        saveInitialData();
        inputs.forEach((input) => {
          if (input !== positionInput && input !== employeeInput) input.disabled = true;
        });
        editBtn.style.display = "inline-block";
        saveBtn.style.display = "none";
        cancelBtn.style.display = "none";
      } else {
        showPopup(data.message || "Error updating profile", "error");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      showPopup("Error updating profile", "error");
    }
  });

  // --- Helpers ---
  function showPopup(message, type = "success") {
    const popup = document.createElement("div");
    popup.className = `popup ${type} show`;
    popup.textContent = message;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3500);
  }

  function formatPosition(pos) {
    return pos
      .replace(/-/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  function validatePassword(pwd) {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(pwd);
  }
});
