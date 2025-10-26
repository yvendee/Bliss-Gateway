document.addEventListener("DOMContentLoaded", () => {
  const profileUpload = document.getElementById("profileUpload");
  const profilePreview = document.getElementById("profilePreview");
  const sidebarAvatar = document.getElementById("sidebarAvatar");

  // Handle avatar upload
  profileUpload.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        profilePreview.src = e.target.result;
        sidebarAvatar.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Reset to default placeholder
      profilePreview.src = '{{ url_for("static", filename="uploads/default.png") }}';
      sidebarAvatar.src = '{{ url_for("static", filename="uploads/default.png") }}';
    }
  });

  // Form validation
  const form = document.getElementById("profileForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Password match check
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Contact number validation
    const contact = document.getElementById("contact").value;
    if (!/^\d+$/.test(contact)) {
      alert("Contact number must contain only digits.");
      return;
    }

    form.submit();
  });
});
