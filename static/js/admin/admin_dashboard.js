document.addEventListener("DOMContentLoaded", () => {
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    const currentPage = window.location.pathname.split("/").pop();

    // Highlight the current page in the sidebar
    sidebarLinks.forEach(link => {
        const linkPage = link.getAttribute("href");
        if (linkPage === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Fetch dashboard data
    fetch("/BlissGateways/admin/admin_dashboard.php")
        .then(async res => {
            if (!res.ok) {
                throw new Error("Network response was not ok: " + res.statusText);
            }
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid JSON received from admin_dashboard.php:\n" + text);
            }
        })
        .then(data => {
            if (!data) return;

            // Update cards
            document.querySelector(".stats-cards .card:nth-child(1) h3").textContent = data.total_users ?? 0;
            document.querySelector(".stats-cards .card:nth-child(2) h3").textContent = data.flight_bookings?.length ?? 0;
            document.querySelector(".stats-cards .card:nth-child(3) h3").textContent = data.tour_bookings?.length ?? 0;
            document.querySelector(".stats-cards .card:nth-child(4) h3").textContent = data.kabayan_bookings?.length ?? 0;
            document.querySelector(".stats-cards .card:nth-child(5) h3").textContent =
                data.total_revenue ? `₱${Number(data.total_revenue).toLocaleString()}` : "₱0";

            // Render tables
            renderBookings("flight-bookings-body", data.flight_bookings);
            renderBookings("tour-bookings-body", data.tour_bookings);
            renderBookings("kabayan-bookings-body", data.kabayan_bookings);
            renderBookings("itinerary-bookings-body", data.itinerary_bookings);
        })
        .catch(err => console.error("Error fetching dashboard data:", err));
});

// Render function
function renderBookings(tableBodyId, bookings) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!bookings || bookings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No bookings yet.</td></tr>`;
        return;
    }

    bookings.forEach(booking => {
        const row = `
            <tr>
                <td>${booking.booking_id || '-'}</td>
                <td>${booking.destination || '-'}</td>
                <td>${booking.date ? new Date(booking.date).toLocaleDateString() : '-'}</td>
                <td>${booking.amount_due ? `₱${Number(booking.amount_due).toLocaleString()}` : '-'}</td>
                <td>${booking.amount_paid ? `₱${Number(booking.amount_paid).toLocaleString()}` : '-'}</td>
                <td>
                    ${booking.payment_status 
                        ? `<span class="status ${booking.payment_status.toLowerCase()}">${booking.payment_status}</span>` 
                        : booking.status || '-'}
                </td>
                <td>
                    <button class="action-btn" onclick="viewBooking('${booking.booking_id}')">View</button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Example action handler
function viewBooking(bookingId) {
    alert("View booking details for: " + bookingId);
}
