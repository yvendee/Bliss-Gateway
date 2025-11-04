document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("packages-container");
    const apiUrl = "https://bliss-gateway.vercel.app/show-table/tours";

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
        container.innerHTML = `<div class="empty-message">Unable to load tours at the moment.</div>`;
    }

    /**
     * Render tours into the container
     */
    function renderTours(tours) {
        container.innerHTML = "";

        if (tours.length === 0) {
            container.innerHTML = `<div class="empty-message">No tours available.</div>`;
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

        // // Optional: handle "See More" clicks
        // document.querySelectorAll(".see-more-button").forEach((btn) => {
        //     btn.addEventListener("click", (e) => {
        //         const tourId = e.target.getAttribute("data-id");
        //         window.location.href = `/tour/${tourId}`;
        //     });
        // });
    }

    // 🔘 Trigger initial render without filters
    searchButton.addEventListener("click", (e) => {
        e.preventDefault();
        renderTours(allTours); // just render all tours without filtering
    });
});
