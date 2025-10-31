document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("packages-container");
    const apiUrl = "https://bliss-gateway.vercel.app/show-table/tours";

    const locationInput = document.getElementById("location");
    const dateInput = document.getElementById("date");
    const searchButton = document.querySelector(".search-button");

    let allTours = []; // store all fetched tours

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const { data } = await response.json();
        allTours = data;

        // Initial render
        renderTours(allTours);
    } catch (error) {
        console.error("Failed to fetch tours:", error);
        container.innerHTML = "<p>Unable to load tours at the moment.</p>";
    }

    /**
     * Render tours into the container
     */
    function renderTours(tours) {
        container.innerHTML = "";

        if (tours.length === 0) {
            container.innerHTML = "<p>No tours match your search criteria.</p>";
            return;
        }

        tours.forEach((tour) => {
            const packageDiv = document.createElement("div");
            packageDiv.classList.add("package");

            packageDiv.innerHTML = `
                <img src="${tour.main_image}" alt="${tour.location}" class="package-image">
                <h3>${tour.location}</h3>
                <p class="price">₱${tour.price}</p>
                <button class="see-more-button" data-id="${tour.id}">See More</button>
            `;

            container.appendChild(packageDiv);
        });

        // Optional: handle "See More" clicks
        document.querySelectorAll(".see-more-button").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const tourId = e.target.getAttribute("data-id");
                window.location.href = `/tour/${tourId}`;
            });
        });
    }

    /**
     * Filters tours by location and/or date
     */
    function filterTours() {
        const locationQuery = locationInput.value.trim().toLowerCase();
        const dateQuery = dateInput.value ? new Date(dateInput.value) : null;

        const filtered = allTours.filter((tour) => {
            const matchesLocation =
                !locationQuery ||
                tour.location.toLowerCase().includes(locationQuery);

            const matchesDate =
                !dateQuery ||
                (new Date(tour.check_in_date) <= dateQuery &&
                    new Date(tour.check_out_date) >= dateQuery);

            return matchesLocation && matchesDate;
        });

        renderTours(filtered);
    }

    // 🔍 Real-time filtering as user types (debounced)
    let debounceTimer;
    locationInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterTours, 250); // delay to avoid excessive re-rendering
    });

    // 🗓️ Filter immediately when date changes
    dateInput.addEventListener("change", filterTours);

    // 🔘 Also allow manual click (optional redundancy)
    searchButton.addEventListener("click", (e) => {
        e.preventDefault();
        filterTours();
    });
});
