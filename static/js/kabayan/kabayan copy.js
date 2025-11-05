// ======================= kabayan.js =======================
// Behaves like create.js but specific to Kabayan packages

// ======================= EDITABLE FIELDS =======================
function makeKabayanEditable(element) {
  if (element.id === "kabayanMinBookingsField") {
    const text = element.innerText.trim();
    const match = text.match(/(\d+)/);
    const currentValue = match ? match[1] : "";

    element.innerHTML = `Minimum number of bookings: 
      <input type="number" id="kabayanMinBookingsInput" value="${currentValue}" min="1" style="width:80px;">`;
    document.getElementById("kabayanMinBookingsInput").focus();
    return;
  }

  if (element.classList.contains("price")) {
    const text = element.innerText.replace(/[^\d.]/g, "");
    element.innerHTML = `<input type="number" id="kabayanPriceInput" value="${text}" step="0.01" style="width:120px;">`;
    document.getElementById("kabayanPriceInput").focus();

    document.getElementById("kabayanPriceInput").addEventListener("blur", () => {
      const value = parseFloat(document.getElementById("kabayanPriceInput").value) || 0;
      element.innerText = "₱" + value.toLocaleString("en-PH", { minimumFractionDigits: 2 }) + " ✎";
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

// ======================= IMAGE PREVIEW =======================
function previewKabayanImage(event, imageId, inputId) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    const img = document.getElementById(imageId);
    const input = document.getElementById(inputId);
    img.src = reader.result;
    img.style.display = "block";
    if (input && input.closest(".file-input-wrapper")) {
      input.closest(".file-input-wrapper").style.display = "none";
    }
    const removeBtn = img.nextElementSibling;
    if (removeBtn) removeBtn.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function removeKabayanImage(imageId, inputId) {
  const img = document.getElementById(imageId);
  const input = document.getElementById(inputId);
  if (img) { img.src = ""; img.style.display = "none"; }
  if (input) {
    input.value = "";
    if (input.closest(".file-input-wrapper")) {
      input.closest(".file-input-wrapper").style.display = "block";
    }
  }
  const removeBtn = img?.nextElementSibling;
  if (removeBtn) removeBtn.style.display = "none";
}

// ======================= ON LOAD =======================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const kabayanId = params.get("id");

  if (kabayanId) {
    fetch(`get_kabayan.php?id=${kabayanId}`)
      .then(res => res.json())
      .then(json => {
        if (!json.success || !json.data) return;
        const pkg = json.data;

        const setTextWithEdit = (elId, text) => {
          const el = document.getElementById(elId);
          if (el) el.innerText = (text || "") + " ✎";
        };

        setTextWithEdit("kabayanLocationField", pkg.location);
        setTextWithEdit("kabayanTourNameField", pkg.tour_name);

        const priceEl = document.getElementById("kabayanPriceField");
        if (priceEl) {
          const priceVal = pkg.price ? parseFloat(pkg.price) : 0;
          priceEl.innerText = "₱" + priceVal.toLocaleString("en-PH", { minimumFractionDigits: 2 }) + " ✎";
        }

        const minBookingsEl = document.getElementById("kabayanMinBookingsField");
        if (minBookingsEl) minBookingsEl.innerText = `Minimum number of bookings: ${pkg.min_bookings}`;

        ["TourType", "Overview", "MeetingPoint", "EndPoint", "PickupDetails", "CancellationPolicy", "RefundPolicy", "Itinerary"]
          .forEach(key => {
            const el = document.getElementById("kabayan" + key);
            if (el) el.value = pkg[key.toLowerCase()] || "";
          });

        const safeToArray = (val) => {
          if (!val) return [];
          try { return JSON.parse(val); } catch { return []; }
        };
        safeToArray(pkg.inclusions).forEach(inc => {
          document.querySelectorAll(".kabayan-inclusions-checkbox").forEach(cb => {
            if (cb.value.trim() === inc) cb.checked = true;
          });
        });
        safeToArray(pkg.exclusions).forEach(exc => {
          document.querySelectorAll(".kabayan-exclusions-checkbox").forEach(cb => {
            if (cb.value.trim() === exc) cb.checked = true;
          });
        });

        if (pkg.main_image) {
          const img = document.getElementById("kabayanMainImage");
          const input = document.getElementById("kabayanMainImageInput");
          if (img) { img.src = pkg.main_image; img.style.display = "block"; }
          if (input && input.closest(".file-input-wrapper")) input.closest(".file-input-wrapper").style.display = "none";
        }
        ["side_image1", "side_image2", "side_image3"].forEach((key, idx) => {
          const imgId = `kabayanSideImage${idx + 1}`;
          const inputId = `kabayanSideImageInput${idx + 1}`;
          if (pkg[key]) {
            const img = document.getElementById(imgId);
            const input = document.getElementById(inputId);
            if (img) { img.src = pkg[key]; img.style.display = "block"; }
            if (input && input.closest(".file-input-wrapper")) input.closest(".file-input-wrapper").style.display = "none";
          }
        });

        const hiddenId = document.createElement("input");
        hiddenId.type = "hidden";
        hiddenId.id = "kabayanId";
        hiddenId.value = pkg.id;
        document.body.appendChild(hiddenId);
      })
      .catch(err => console.error("Error loading kabayan:", err));
  }

  [
    document.getElementById("kabayanTourNameField"),
    document.getElementById("kabayanLocationField"),
    document.querySelector(".price"),
    document.getElementById("kabayanMinBookingsField")
  ].forEach(el => {
    if (el) {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => makeKabayanEditable(el));
    }
  });

  if (document.getElementById("kabayanToursContainer")) {
    get_kabayans();
  }
});

// ======================= SAVE FORM =======================
function saveKabayanForm() {
  const kabayanId = document.getElementById("kabayanId")?.value || "";
  const tourName = document.getElementById("kabayanTourNameField")?.innerText.replace("✎", "").trim() || "";
  const location = document.getElementById("kabayanLocationField")?.innerText.replace("✎", "").trim() || "";
  const tourType = document.getElementById("kabayanTourType")?.value || "";
  const price = document.querySelector(".price")?.innerText.replace(/[^\d.]/g, "") || "";
  const minBookings = document.getElementById("kabayanMinBookingsField")?.innerText.match(/(\d+)/)?.[1] || "";
  const overview = document.getElementById("kabayanOverview")?.value.trim() || "";
  const meetingPoint = document.getElementById("kabayanMeetingPoint")?.value.trim() || "";
  const endPoint = document.getElementById("kabayanEndPoint")?.value.trim() || "";
  const pickupDetails = document.getElementById("kabayanPickupDetails")?.value.trim() || "";
  const cancellationPolicy = document.getElementById("kabayanCancellationPolicy")?.value.trim() || "";
  const refundPolicy = document.getElementById("kabayanRefundPolicy")?.value.trim() || "";
  const itinerary = document.getElementById("kabayanItinerary")?.value.trim() || "";

  const inclusions = Array.from(document.querySelectorAll(".kabayan-inclusions-checkbox:checked")).map(i => i.value);
  const exclusions = Array.from(document.querySelectorAll(".kabayan-exclusions-checkbox:checked")).map(i => i.value);

  const imageInputs = [
    document.getElementById("kabayanMainImageInput"),
    document.getElementById("kabayanSideImageInput1"),
    document.getElementById("kabayanSideImageInput2"),
    document.getElementById("kabayanSideImageInput3")
  ];

  if (!tourName || !location || !tourType || !price || !overview) {
    return alert("Please fill all required fields.");
  }
  if (inclusions.length === 0) return alert("Select at least one inclusion.");
  if (exclusions.length === 0) return alert("Select at least one exclusion.");

  const formData = new FormData();
  formData.append("tour_name", tourName);
  formData.append("location", location);
  formData.append("tour_type", tourType);
  formData.append("price", price);
  formData.append("min_bookings", minBookings);
  formData.append("overview", overview);
  formData.append("meeting_point", meetingPoint);
  formData.append("end_point", endPoint);
  formData.append("pickup_details", pickupDetails);
  formData.append("cancellation_policy", cancellationPolicy);
  formData.append("refund_policy", refundPolicy);
  formData.append("itinerary", itinerary);
  formData.append("inclusions", JSON.stringify(inclusions));
  formData.append("exclusions", JSON.stringify(exclusions));

  // ✅ FIX: align field names with PHP (main_image, side_image1, side_image2, side_image3)
  imageInputs.forEach((input, idx) => {
    if (input && input.files && input.files.length > 0) {
      if (idx === 0) formData.append("main_image", input.files[0]);
      if (idx === 1) formData.append("side_image1", input.files[0]);
      if (idx === 2) formData.append("side_image2", input.files[0]);
      if (idx === 3) formData.append("side_image3", input.files[0]);
    }
  });

  let url = "add_kabayan.php";
  if (kabayanId) {
    url = "update_kabayan.php";
    formData.append("id", kabayanId);
  }

  fetch(url, { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("✅ Kabayan package saved successfully!");
        window.location.href = "kabayan.html";
      } else {
        alert("❌ Error: " + (data.message || "Unknown error"));
      }
    })
    .catch(err => {
      console.error("Save error:", err);
      alert("Save failed. Check console.");
    });
}

// ======================= LIST + RENDER =======================
function get_kabayans() {
  fetch("get_kabayans.php")
    .then(res => res.json())
    .then(json => {
      if (!json.success || !json.data) {
        renderKabayans([]);
      } else {
        renderKabayans(json.data);
      }
    })
    .catch(err => {
      console.error("Error fetching kabayans:", err);
      renderKabayans([]);
    });
}

function renderKabayans(kabayans) {
  const container = document.getElementById("kabayanToursContainer");
  const empty = document.getElementById("emptyKabayanPackage");
  if (!container) return;

  container.innerHTML = "";

  if (!kabayans || kabayans.length === 0) {
    if (empty) empty.style.display = "block";
    container.style.display = "none";
    return;
  }

  if (empty) empty.style.display = "none";
  container.style.display = "grid";

  kabayans.forEach(pkg => {
    const image = pkg.main_image || '{{ url_for("static", filename="icons/no-image.png") }}';
    let incs = [];
    let excs = [];
    try { incs = JSON.parse(pkg.inclusions || "[]"); } catch {}
    try { excs = JSON.parse(pkg.exclusions || "[]"); } catch {}

    const card = document.createElement("div");
    card.className = "tour-card";

    card.innerHTML = `
      <img src="${image}" alt="${pkg.tour_name}" class="tour-image" />
      <div class="tour-details">
        <h3>${pkg.location}</h3>
        <p class="tour-price">₱${pkg.price ? parseFloat(pkg.price).toLocaleString("en-PH") : "0.00"}</p>
      </div>
      <div class="tour-inclusions">
        ${incs.map(i => `<div class="inclusion-item"><img src='{{ url_for("static", filename="icons/check.png") }}' ><span>${i}</span></div>`).join("")}
      </div>
      <div class="tour-exclusions">
        ${excs.map(e => `<div class="inclusion-item"><img src='{{ url_for("static", filename="icons/x.png") }}' ><span>${e}</span></div>`).join("")}
      </div>
      <div class="card-actions">
        <button onclick="viewKabayan(${pkg.id})">See More</button>
        <button style="background:#ff5858;" onclick="deleteKabayan(${pkg.id})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ======================= VIEW / DELETE =======================
function viewKabayan(id) {
  window.location.href = `add_kabayan.html?id=${id}`;
}

function deleteKabayan(id) {
  if (!confirm("Delete this Kabayan package?")) return;
  const formData = new FormData();
  formData.append("id", id);

  fetch("delete_kabayan.php", { method: "POST", body: formData })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("✅ Kabayan package deleted");
        get_kabayans();
      } else {
        alert("❌ Failed to delete: " + (data.message || "")); 
      }
    })
    .catch(err => {
      console.error("Delete error:", err);
      alert("Error deleting package");
    });
}
