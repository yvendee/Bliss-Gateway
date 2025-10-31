document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("packages-container");
    const apiUrl = "https://bliss-gateway.vercel.app/show-table/tours";

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const { data } = await response.json();

        // Clear old content (in case)
        container.innerHTML = "";

        data.forEach((tour) => {
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

        // Optional: add click listeners to “See More” buttons
        document.querySelectorAll(".see-more-button").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const tourId = e.target.getAttribute("data-id");
                window.location.href = `/tour/${tourId}`;
            });
        });

    } catch (error) {
        console.error("Failed to fetch tours:", error);
        container.innerHTML = "<p>Unable to load tours at the moment.</p>";
    }
});
