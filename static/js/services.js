document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userRole = (localStorage.getItem("userRole") || "").toLowerCase();

  const services = [
    { clientHref: "flights.html", adminHref: "flights.html" },
    { clientHref: "tour_booking.html", adminHref: "tours/create.html" },
    { clientHref: "kabayan.html", adminHref: "create copy.html" },
    { clientHref: "itinerary.html", adminHref: "itinerary.html" }
  ];

  const actionButtons = document.querySelectorAll(".select-button");

  // Popup Notification
  function showPopup(message, type = "success", redirectUrl = null) {
    const oldPopup = document.querySelector(".popup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.className = `popup ${type}`;
    popup.textContent = message;
    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add("show"), 50);

    setTimeout(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }, 1500);

    setTimeout(() => popup.remove(), 2000);
  }

  // 🔹 Assign buttons
  actionButtons.forEach((btn, index) => {
    const service = services[index];

    // Base styling
    btn.style.backgroundColor = "#008EC4";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "20px";
    btn.style.fontWeight = "500";

    // Admin → "Select"
    if (userRole === "admin" && isLoggedIn) {
      btn.textContent = "Select";
      btn.addEventListener("click", () => {
        window.location.href = service.adminHref;
      });
    } 
    // Client (logged in) → "Book Now"
    else if (userRole === "client" && isLoggedIn) {
      btn.textContent = "Book Now";
      btn.addEventListener("click", () => {
        window.location.href = service.clientHref;
      });
    } 
    // Guest (not logged in) → "Book Now" but redirect to login
    else {
      btn.textContent = "Book Now";
      btn.addEventListener("click", () => {
        showPopup("Please log in to book a service.", "error", "/login");
      });
    }

    // Hover effect
    btn.addEventListener("mouseover", () => {
      btn.style.backgroundColor = "#091d46";
      btn.style.color = "#fff";
    });

    btn.addEventListener("mouseout", () => {
      btn.style.backgroundColor = "#008EC4";
      btn.style.color = "#fff";
    });
  });
});
