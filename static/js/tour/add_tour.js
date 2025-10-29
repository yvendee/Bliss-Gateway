// ======================= Utility: Find form =======================
function getFormElement() {
  return (
    document.getElementById("tourForm") ||
    document.getElementById("addTourForm") ||
    document.getElementById("editTourForm") ||
    document.querySelector("form")
  );
}

// ======================= Inline Editable Fields =======================
function makeEditable(element) {
  if (!element) return;

  const currentText = element.innerText.replace("✎", "").replace("₱", "").trim();
  const isNumber =
    element.classList.contains("price") || element.classList.contains("editable2");

  const input = document.createElement("input");
  input.type = isNumber ? "number" : "text";
  input.value = currentText.replace(/,/g, "");
  input.required = true;
  input.className = "editable-input";

  if (element.classList.contains("price")) {
    input.step = "0.01";
    input.min = "0";
  }
  if (element.classList.contains("editable2")) input.min = "1";

  const parent = element.parentNode;
  if (!parent) return;
  parent.replaceChild(input, element);

  input.focus();
  input.select();

  input.addEventListener("blur", () => finalize());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finalize();
    } else if (e.key === "Escape") {
      parent.replaceChild(element, input);
    }
  });

  function finalize() {
    const newEl = element.cloneNode(false);
    let val = input.value.trim();

    if (!val) {
      input.reportValidity();
      input.focus();
      return;
    }

    if (element.classList.contains("price")) {
      const num = parseFloat(val || 0);
      newEl.innerText =
        "₱" +
        num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        " ✎";
      newEl.classList.add("editable", "price");
    } else if (element.classList.contains("editable2")) {
      newEl.innerText = "Minimum number of bookings: " + (val || 1) + " ✎";
      newEl.classList.add("editable2");
    } else {
      newEl.innerText = val + " ✎";
      newEl.classList.add("editable");
    }
    newEl.onclick = () => makeEditable(newEl);
    parent.replaceChild(newEl, input);
  }
}

document.addEventListener("click", (e) => {
  const el = e.target;
  if (!el || !el.classList) return;
  if (
    el.classList.contains("editable") ||
    el.classList.contains("price") ||
    el.classList.contains("editable2")
  ) {
    makeEditable(el);
  }
});

// ======================= Image Preview & Remove =======================
function previewImage(event, imageId, inputId) {
  const file = event.target.files?.[0];
  const img = document.getElementById(imageId);
  const input = document.getElementById(inputId);
  const wrapper = input?.closest?.(".file-input-wrapper");
  const removeBtn = img?.nextElementSibling;

  if (file && img) {
    if (!file.type.startsWith("image/")) {
      input.value = "";
      input.setCustomValidity("Please select an image file (JPG, PNG, WEBP).");
      input.reportValidity();
      return;
    }
    input.setCustomValidity("");
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
    if (wrapper) wrapper.style.display = "none";
    if (removeBtn) removeBtn.style.display = "inline-block";
  } else {
    input.setCustomValidity("Please select a file.");
    input.reportValidity();
  }
}

function removeImage(imageId, inputId) {
  const img = document.getElementById(imageId);
  const input = document.getElementById(inputId);
  const wrapper = input?.closest?.(".file-input-wrapper");
  const removeBtn = img?.nextElementSibling;

  if (img) {
    img.src = "";
    img.style.display = "none";
  }
  if (input) {
    input.value = "";
    input.setCustomValidity("Please select a file.");
  }
  if (wrapper) wrapper.style.display = "flex";
  if (removeBtn) removeBtn.style.display = "none";
}

// ======================= Form Validation =======================
function getMultiLineFieldValue(el) {
  if (!el) return "";
  return el.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function validateFormTargets() {
  const form = getFormElement();
  if (!form) return false;
  return form.checkValidity();
}

// ======================= Append Tour Card =======================
function appendTourCard(tour) {
  const toursContainer = document.getElementById("tours-container");
  const emptyPackage = document.getElementById("emptyPackage");
  if (!toursContainer) return;

  if (emptyPackage) emptyPackage.style.display = "none";
  toursContainer.style.display = "grid";

  let image = "../assets/icons/no-image.png";
  if (Array.isArray(tour.images) && tour.images.length > 0) image = tour.images[0];
  else if (tour.main_image) image = tour.main_image;

  const card = document.createElement("div");
  card.className = "tour-card";
  card.innerHTML = `
    <img src="${image}" alt="${tour.tour_name || ""}" class="tour-image">
    <div class="tour-details">
      <h3>${tour.location || tour.tour_name || ""}</h3>
      <p class="tour-price">₱${parseFloat(tour.price || 0).toLocaleString()}</p>
    </div>
    <button class="see-more-btn" onclick="viewTour(${tour.id})">See More</button>
  `;
  toursContainer.insertBefore(card, toursContainer.firstChild);
}

// ======================= Save Form =======================
async function saveForm() {
  const form = getFormElement();
  if (!form) return;
  if (!validateFormTargets()) {
    form.reportValidity();
    return;
  }

  const fd = new FormData(form);

  const tourName = document
    .getElementById("tourNameField")
    ?.innerText.replace(/✎|\*/g, "")
    .trim();
  const location = document
    .getElementById("locationField")
    ?.innerText.replace(/✎|\*/g, "")
    .trim();
  const priceText = document
    .getElementById("priceField")
    ?.innerText.replace(/[₱,✎*]/g, "")
    .trim();
  const price = parseFloat(priceText) || 0;
  const minText = document
    .getElementById("minBookingsField")
    ?.innerText.replace(/Minimum number of bookings:|✎|\*/g, "")
    .trim();
  const minBookings = parseInt(minText) || 1;

  fd.set("tour_name", tourName);
  fd.set("location", location);
  fd.set("price", price);
  fd.set("min_bookings", minBookings);

  const overviewEl = document.getElementById("overview");
  const inclusionsEl = document.getElementById("inclusions");
  const exclusionsEl = document.getElementById("exclusions");
  const tourTypeEl = document.getElementById("tourType");

  if (overviewEl) fd.set("overview", overviewEl.value || "");
  if (inclusionsEl) fd.set("inclusions", getMultiLineFieldValue(inclusionsEl));
  if (exclusionsEl) fd.set("exclusions", getMultiLineFieldValue(exclusionsEl));
  if (tourTypeEl) fd.set("tour_type", tourTypeEl.value || "");

  const fileKeys = [
    { key: "main_image", id: "main_image" },
    { key: "side_image1", id: "side_image1" },
    { key: "side_image2", id: "side_image2" },
    { key: "side_image3", id: "side_image3" },
  ];

  fileKeys.forEach(({ key, id }) => {
    const fileEl = document.getElementById(id);
    if (fileEl?.files?.length > 0) {
      fd.set(key, fileEl.files[0], fileEl.files[0].name);
    } else if (fileEl && fileEl.required) {
      fileEl.reportValidity();
      throw new Error("Required image missing.");
    }
  });

  try {
    const resp = await fetch("add_tour.php", { method: "POST", body: fd });
    const data = await resp.json();

    if (data.success) {
      appendTourCard(data.tour);
      resetForm();
    } else {
      alert(data.message || "Failed to save tour.");
    }
  } catch (err) {
    console.error(err);
    alert("An error occurred while saving the tour.");
  }
}

// ======================= Reset Form =======================
function resetForm() {
  const form = getFormElement();
  if (!form) return;
  form.reset();

  const tName = document.getElementById("tourNameField");
  const loc = document.getElementById("locationField");
  const price = document.getElementById("priceField");
  const minBooking = document.getElementById("minBookingsField");

  if (tName) tName.innerText = "Tour Name ✎";
  if (loc) loc.innerText = "Location ✎";
  if (price) price.innerText = "₱0.00 ✎";
  if (minBooking) minBooking.innerText = "Minimum number of bookings: 1 ✎";

  const removePairs = [
    ["mainImagePreview", "main_image"],
    ["sideImagePreview1", "side_image1"],
    ["sideImagePreview2", "side_image2"],
    ["sideImagePreview3", "side_image3"],
  ];
  removePairs.forEach(([imgId, inputId]) => removeImage(imgId, inputId));
}

// ======================= Fetch Tours =======================
async function get_tours() {
  const toursContainer = document.getElementById("tours-container");
  const emptyPackage = document.getElementById("emptyPackage");
  if (!toursContainer) return;

  try {
    const res = await fetch("get_tours.php");
    const json = await res.json();
    const tours = json.tours || json.data || json || [];

    toursContainer.innerHTML = "";

    if (!tours.length) {
      toursContainer.style.display = "none";
      if (emptyPackage) emptyPackage.style.display = "block";
      return;
    }

    if (emptyPackage) emptyPackage.style.display = "none";
    toursContainer.style.display = "grid";

    tours.forEach((tour) => appendTourCard(tour));
  } catch (err) {
    console.error("Error loading tours:", err);
    if (emptyPackage) emptyPackage.style.display = "block";
    toursContainer.style.display = "none";
  }
}

// ======================= Initialize =======================
document.addEventListener("DOMContentLoaded", () => {
  const form = getFormElement();
  if (form) {
    form.noValidate = false;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      saveForm();
    });
  }
  get_tours();
});
