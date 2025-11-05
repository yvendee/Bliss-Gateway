// ======================= EDITABLE FIELDS =======================
function makeEditable(element) {
  if (element.id === "minBookingsField") {
    const text = element.innerText.trim();
    const match = text.match(/(\d+)/);
    const currentValue = match ? match[1] : "";

    element.innerHTML = `Minimum number of bookings: 
      <input type="number" id="minBookingsInput" value="${currentValue}" min="1" style="width:80px;">`;

    document.getElementById("minBookingsInput").focus();
    return;
  }

  if (element.classList.contains("price")) {
    const text = element.innerText.replace(/[^\d.]/g, "");
    element.innerHTML = `<input type="number" id="priceInput" value="${text}" step="0.01" style="width:120px;">`;

    document.getElementById("priceInput").focus();

    document.getElementById("priceInput").addEventListener("blur", () => {
      const value = parseFloat(document.getElementById("priceInput").value) || 0;
      element.innerText =
        "₱" + value.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " ✎";
    });
    return;
  }

  const currentValue = element.innerText.replace("✎", "").trim();
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentValue;
  input.className = "edit-input";

  element.innerHTML = "";
  element.appendChild(input);
  input.focus();

  input.addEventListener("blur", () => {
    element.innerText = input.value + " ✎";
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") input.blur();
  });
}

// ======================= IMAGE HANDLING =======================
function previewImage(event, imageId, inputId) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function () {
    const img = document.getElementById(imageId);
    img.src = reader.result;
    img.style.display = "block";

    const input = document.getElementById(inputId);
    input.style.display = "none";
  };

  if (file) {
    reader.readAsDataURL(file);
  }
}

function removeImage(imageId, inputId) {
  const img = document.getElementById(imageId);
  const input = document.getElementById(inputId);

  img.src = "";
  img.style.display = "none";

  input.value = "";
  input.style.display = "block";
}

// ======================= RENDERING =======================
function renderTours(tours) {
  const toursContainer = document.getElementById("tours-container");
  const emptyPackage = document.getElementById("emptyPackage");
  const filterSection = document.querySelector(".filter-section");

  if (!toursContainer) return;

  toursContainer.innerHTML = "";

  if (!tours || tours.length === 0) {
    toursContainer.style.display = "none";
    if (emptyPackage) emptyPackage.style.display = "block";
    if (filterSection) filterSection.style.display = "none";
    return;
  }

  if (emptyPackage) emptyPackage.style.display = "none";
  toursContainer.style.display = "grid";
  if (filterSection) filterSection.style.display = "flex";

  tours.forEach((tour) => {
    const card = document.createElement("div");
    card.className = "tour-card";

    const image = tour.main_image && tour.main_image !== ""
      ? tour.main_image
      : '{{ url_for("static", filename="icons/no-image.png") }}';

    // Text-based inclusions/exclusions
    let inclusionsHTML = "";
    if (tour.inclusions && Array.isArray(tour.inclusions)) {
      inclusionsHTML = tour.inclusions.map(item => `
        <span class="tour-inclusion">${item}</span>
      `).join("");
    }

    let exclusionsHTML = "";
    if (tour.exclusions && Array.isArray(tour.exclusions)) {
      exclusionsHTML = tour.exclusions.map(item => `
        <span class="tour-exclusion">${item}</span>
      `).join("");
    }

    card.innerHTML = `
      <img src="${image}" alt="${tour.tour_name}" class="tour-image">

      <div class="tour-details">
        <h3>${tour.tour_name}</h3>
        <p class="tour-location">${tour.location}</p>
        <p class="tour-price">
          ₱${parseFloat(tour.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>

        <div class="tour-inclusions-container">
          <h4>Inclusions:</h4>
          ${inclusionsHTML || "<p>No inclusions listed</p>"}
        </div>

        <div class="tour-exclusions-container">
          <h4>Exclusions:</h4>
          ${exclusionsHTML || "<p>No exclusions listed</p>"}
        </div>
      </div>

      <button class="see-more-btn" onclick="viewTour(${tour.id})">See More</button>
    `;

    toursContainer.appendChild(card);
  });
}

// ======================= FETCH TOURS =======================
let allTours = [];

function get_tours() {
  fetch("/api/get-kabayan")
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        allTours = data;
        renderTours(allTours);
      } else {
        renderTours([]);
      }
    })
    .catch(error => {
      console.error("Error fetching tours:", error);
      renderTours([]);
    });
}

// ======================= FILTERING =======================
function filterPackages() {
  const filter = document.getElementById("tourFilter").value;

  if (filter === "all") {
    renderTours(allTours);
  } else {
    const filtered = allTours.filter(tour => tour.tour_type === filter);
    renderTours(filtered);
  }
}

// ======================= POPUP =======================
function showPopup(message, type = "success") {
  const popup = document.getElementById("popup");
  if (!popup) return;

  popup.textContent = message;
  popup.className = `popup ${type} show`;

  setTimeout(() => {
    popup.classList.remove("show");
  }, 3000);
}

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", function () {
  get_tours();

  const filterDropdown = document.getElementById("tourFilter");
  if (filterDropdown) {
    filterDropdown.addEventListener("change", filterPackages);
  }
});
