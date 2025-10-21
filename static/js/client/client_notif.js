document.addEventListener("DOMContentLoaded", () => {
  const notificationsContainer = document.getElementById("notificationsContainer");
  const emptyMessage = document.querySelector(".empty-message");

  // Fetch notifications
  fetch("/api/get-notifications") 
    .then(res => res.json())
    .then(notifications => {
      notificationsContainer.innerHTML = '';

      if (notifications.error === "not_logged_in") {
        emptyMessage.textContent = "Please log in to see notifications.";
        emptyMessage.style.display = "block";
        return;
      }

      if (!notifications || notifications.length === 0) {
        emptyMessage.textContent = "No notifications yet.";
        emptyMessage.style.display = "block";
        return;
      }

      emptyMessage.style.display = "none";

      notifications.forEach(notification => {
        const category = notification.category ? notification.category.toLowerCase() : "account";

        const notificationItem = document.createElement("div");
        notificationItem.classList.add(
          "notification-item",
          category,
          notification.is_read == 0 ? "unread" : "read"
        );

        notificationItem.innerHTML = `
          <div class="notification-header">
            <span class="notification-title">${notification.title || "Notification"}</span>
            <span class="notification-time" data-time="${notification.created_at}"></span>
          </div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-actions">
            ${
              notification.is_read == 0
                ? `<button class="mark-read-btn" data-id="${notification.id}">Mark as Read</button>`
                : `<span class="read-label">Read</span>`
            }
          </div>
        `;
        notificationsContainer.appendChild(notificationItem);
      });

      formatNotificationTimes();
      attachMarkAsReadHandlers();
    })
    .catch(err => {
      console.error("Error loading notifications:", err);
      emptyMessage.textContent = "Error loading notifications.";
      emptyMessage.style.display = "block";
    });

  // Format time display
  function formatNotificationTimes() {
    document.querySelectorAll(".notification-time").forEach(span => {
      const timeString = span.getAttribute("data-time");
      if (!timeString) return;

      const notifDate = new Date(timeString);
      const today = new Date();

      if (notifDate.toDateString() === today.toDateString()) {
        span.textContent = notifDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else {
        span.textContent = notifDate.toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric"
        });
      }
    });
  }

  // Handle "Mark as Read"
  document.addEventListener("click", e => {
    if (e.target.classList.contains("mark-read-btn")) {
      const notifId = e.target.getAttribute("data-id");

      fetch("/api/mark-notification-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: parseInt(notifId) })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            e.target.closest(".notification-item").classList.remove("unread");
            e.target.closest(".notification-actions").innerHTML = `<span class="read-label">Read</span>`;
          }
        })
        .catch(err => console.error("Error marking notification:", err));
    }
  });

  // Filter buttons
  document.querySelectorAll(".filter-button").forEach(btn => {
    btn.addEventListener("click", e => {
      document.querySelectorAll(".filter-button").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");

      const category = e.target.textContent.toLowerCase();
      document.querySelectorAll(".notification-item").forEach(item => {
        if (category === "all" || item.classList.contains(category)) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  });
});
