document.addEventListener('DOMContentLoaded', function () {

    const toggle = document.querySelector(".dropdown-toggle");
    const menu = document.querySelector(".dropdown-menu");
    if (toggle && menu) {
        toggle.addEventListener("click", function (e) {
            e.stopPropagation();
            menu.classList.toggle("show");
        });

        document.addEventListener("click", function () {
            menu.classList.remove("show");
        });
    }

    // Password toggle
    document.querySelectorAll('.password-wrapper').forEach(wrapper => {
        const passwordInput = wrapper.querySelector('input[type="password"], input[type="text"]');
        const toggle = wrapper.querySelector('.toggle-password');
        const toggleImg = wrapper.querySelector('img');

        if (passwordInput && toggle && toggleImg) {
            toggle.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                toggleImg.src = type === 'password' ? '{{ url_for("static", filename="icons/unsee.png") }}' : '{{ url_for("static", filename="icons/see.png") }}';
            });
        }
    });
});

// Popup
function showPopup(message, type = "success") {
  let container = document.querySelector('.popup-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'popup-container';
    document.body.appendChild(container);
  }

  const popup = document.createElement('div');
  popup.className = `popup ${type}`;
  popup.textContent = message;
  container.appendChild(popup);

  // Trigger animation
  requestAnimationFrame(() => popup.classList.add('show'));

  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => popup.remove(), 350);
  }, 3000);
}


