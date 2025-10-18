document.addEventListener("DOMContentLoaded", () => {
    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
        fetch("/header")
            .then(res => res.text())
            .then(html => {
                headerContainer.innerHTML = html;

                headerContainer.style.width = "100%";
                headerContainer.style.alignSelf = "stretch";

                const headerEl = headerContainer.querySelector(".header");
                if (headerEl) {
                    headerEl.style.width = "100%";
                    headerEl.style.maxWidth = "100%";
                    headerEl.style.boxSizing = "border-box";
                }

                // Dropdown toggle
                const toggle = headerContainer.querySelector(".dropdown-toggle");
                const menu = headerContainer.querySelector(".dropdown-menu");
                if (toggle && menu) {
                    toggle.addEventListener("click", function (e) {
                        e.stopPropagation();
                        menu.classList.toggle("show");
                    });

                    document.addEventListener("click", function () {
                        menu.classList.remove("show");
                    });
                }

                // Check session AFTER header is injected
                // return fetch("/BlissGateways/check_session.php");
            })
            .then(res => res.json())
            .then(data => {
                const registerDropdown = document.getElementById("register-dropdown");
                const loginBtn = document.getElementById("login-btn");

                if (data.isLoggedIn) {  
                    // Save login state + role for use in services.js
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("userRole", (data.userRole || "client").toLowerCase());

                    if (registerDropdown) registerDropdown.style.display = "none";
                    if (loginBtn) {
                        loginBtn.textContent = "My Account";

                        // Redirect admins to dashboard, clients to profile
                        if (data.userRole && data.userRole.toLowerCase() === "admin") {
                            loginBtn.onclick = () => {
                                window.location.href = "/admin-dashboard";
                            };
                        } else {
                            loginBtn.onclick = () => {
                                window.location.href = "/client-notif";
                            };
                        }
                    }
                } else {
                    // Clear login state
                    localStorage.setItem("isLoggedIn", "false");
                    localStorage.removeItem("userRole");

                    if (registerDropdown) registerDropdown.style.display = "flex";
                    if (loginBtn) {
                        loginBtn.textContent = "Login";
                        loginBtn.onclick = () => {
                            window.location.href = "/login";
                        };
                    }
                }
            })
            .catch(err => console.error("Error loading header or session:", err));
    }
});
