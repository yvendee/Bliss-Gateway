document.addEventListener("DOMContentLoaded", () => {
  const addActivityBtn = document.getElementById("add-activity-btn");
  const publishDropdown = document.getElementById("btnAddActivity");

  // --- Session check to control Add Activity + Publish dropdown visibility ---
  fetch("/api/check-session")
    .then(res => res.json())
    .then(data => {
      const isAdmin = data.isLoggedIn && data.userRole === "admin";

      if (addActivityBtn) addActivityBtn.style.display = isAdmin ? "inline-block" : "none";
      if (publishDropdown) publishDropdown.style.display = isAdmin ? "inline-block" : "none";

      // Observe activity-results for changes
      const results = document.getElementById("activity-results");
      if (results) {
        const observer = new MutationObserver(() => {});
        observer.observe(results, { childList: true });
      }
    })
    .catch(err => console.error("Session check failed:", err));

  // --- Itinerary logic ---
  const itineraryContainer = document.getElementById("itinerary-container");
  const saveBtn = document.getElementById("save-itinerary-btn");

  if (addActivityBtn && itineraryContainer) {
    addActivityBtn.addEventListener("click", () => {
      const activityRow = document.createElement("div");
      activityRow.classList.add("activity-row");

      activityRow.innerHTML = `
        <input type="text" placeholder="Activity Name" class="activity-input">
        <input type="time" class="activity-time">
        <button type="button" class="remove-activity-btn">Remove</button>
      `;

      itineraryContainer.appendChild(activityRow);

      activityRow.querySelector(".remove-activity-btn").addEventListener("click", () => {
        itineraryContainer.removeChild(activityRow);
      });
    });
  }

  if (saveBtn && itineraryContainer) {
    saveBtn.addEventListener("click", () => {
      const activities = [];
      itineraryContainer.querySelectorAll(".activity-row").forEach(row => {
        const name = row.querySelector(".activity-input").value.trim();
        const time = row.querySelector(".activity-time").value;
        if (name && time) activities.push({ name, time });
      });
      console.log("Saving itinerary:", activities);
      // TODO: send itinerary to backend
    });
  }

  // ================ attach drop listeners for existing drops =================
  document.querySelectorAll(".drop").forEach(d => {
    d.addEventListener("dragover", allowDrop);
    d.addEventListener("drop", drop);
  });
});

// ================= Helpers for image preview =================
function previewImage(event, imgId, inputId) {
  const file = event.target.files && event.target.files[0];
  const img = document.getElementById(imgId);
  const input = document.getElementById(inputId);
  if (!file || !img || !input) return;

  const reader = new FileReader();
  reader.onload = e => {
    img.src = e.target.result;
    img.style.display = "block";

    const container = img.closest(".main-image");
    if (container) {
      const label = container.querySelector(".file-label");
      if (label) label.style.display = "none";
    }
  };
  reader.readAsDataURL(file);
}

function removeImage(imgId, inputId) {
  const img = document.getElementById(imgId);
  const input = document.getElementById(inputId);
  if (!img || !input) return;

  img.src = "";
  img.style.display = "none";
  input.value = "";

  const container = img.closest(".main-image");
  if (container) {
    const label = container.querySelector(".file-label");
    if (label) label.style.display = "inline-block";
  }
}

// ================= Date → Day slots =================
const dateFrom = document.getElementById("dateFrom");
const dateTo = document.getElementById("dateTo");
const today = new Date().toISOString().split("T")[0];
if (dateFrom) dateFrom.setAttribute("min", today);
if (dateTo) dateTo.setAttribute("min", today);

if (dateFrom) dateFrom.addEventListener("change", () => {
  if (dateFrom.value) dateTo.setAttribute("min", dateFrom.value || today);
});
if (dateTo) dateTo.addEventListener("change", () => {
  const start = dateFrom.value ? new Date(dateFrom.value) : null;
  const end = dateTo.value ? new Date(dateTo.value) : null;
  if (start && end && end >= start) {
    const daysContainer = document.getElementById("daysContainer");
    daysContainer.innerHTML = "";
    daysContainer.style.display = "flex";
    daysContainer.style.overflowX = "auto";
    daysContainer.style.gap = "10px";
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    for (let i = 1; i <= diffDays; i++) createDayBox(i, daysContainer);
  }
});

function createDayBox(dayNumber, container) {
  const dayBox = document.createElement("div");
  dayBox.className = "day-box";

  const header = document.createElement("div");
  header.className = "day-header";
  header.innerHTML = `<h4>Day ${dayNumber}</h4>`;

  const trash = document.createElement("img");
  trash.src = '{{ url_for("static", filename="icons/trash.png") }}';
  trash.className = "trash-icon";
  trash.title = "Delete day";
  trash.onclick = () => { dayBox.remove(); renumberDays(); };
  header.appendChild(trash);

  const dropzone = document.createElement("div");
  dropzone.className = "drop empty";
  dropzone.addEventListener("dragover", allowDrop);
  dropzone.addEventListener("drop", drop);
  dropzone.addEventListener("dragenter", e => e.preventDefault());

  dayBox.appendChild(header);
  dayBox.appendChild(dropzone);
  container.appendChild(dayBox);
}

function renumberDays() {
  document.querySelectorAll(".day-header h4").forEach((h4, idx) => {
    h4.textContent = `Day ${idx + 1}`;
  });
}

document.getElementById("btnAddDay").addEventListener("click", () => {
  const container = document.getElementById("daysContainer");
  createDayBox(container.children.length + 1, container);
});

// ================= Mock search =================
document.getElementById("destination").addEventListener("change", function () {
  const dest = this.value.toLowerCase().trim();
  const results = document.getElementById("activity-results");
  if (!results) return;

  results.innerHTML = "";

  const mockDB = {
    "abu dhabi": [
      { name: "Abu Dhabi Heritage Village", subtitle: "Abu Dhabi, UAE", desc: "Discover traditions and souq.", price: "₱3,999.00", duration: "2 hours", img: "/assets/sample/abu-dhabi.jpg" }
    ],
    "tokyo": [
      { name: "Tokyo Tower", subtitle: "Minato, Tokyo", desc: "Iconic tower", price: "₱20,000", duration: "2 hours", img: "" },
      { name: "Shibuya Crossing", subtitle: "Shibuya, Tokyo", desc: "World’s busiest crossing", price: "₱0", duration: "30 mins", img: "" }
    ]
  };

  const activities = mockDB[dest] || [];
  if (activities.length > 0) activities.forEach(act => addActivityToResults(act));
  else results.innerHTML = `<p class="center-placeholder">No results found for this destination</p>`;
});

// ================= Add Activity Dropdown =================
const btnAddActivity = document.getElementById("btnAddActivity");
if (btnAddActivity) {
  btnAddActivity.addEventListener("change", (e) => {
    const category = e.target.value;
    if (!category) return;

    let modalId = "";
    switch (category) {
      case "flights": modalId = "modalFlights"; break;
      case "hotels": modalId = "modalHotels"; break;
      case "restaurants": modalId = "modalRestaurants"; break;
      case "tours": modalId = "modalAddActivity"; break;
    }
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.style.display = "flex";
    }
    btnAddActivity.value = ""; // reset back to placeholder
  });
}

// --- Publish modal ---
const modal = document.getElementById("activityModal");
document.getElementById("btnAddActivity").onclick = () => modal.style.display = "flex";
document.getElementById("closeModal").onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// --- Editable fields ---
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalDuration = document.getElementById("modalDuration");

function addEditableBehavior(field, isPrice = false) {
  if (!field) return;
  field.setAttribute("contenteditable", "true");
  field.addEventListener("focus", () => {
    field.classList.add("editing");
    if (field.textContent.startsWith("✎ ")) field.textContent = field.textContent.replace(/^✎\s*/, "");
    if (isPrice && !field.textContent.startsWith("₱")) field.textContent = field.textContent.replace(/[^\d,]/g, "");
  });
  field.addEventListener("blur", () => {
    field.classList.remove("editing");
    if (isPrice) {
      let val = field.textContent.replace(/[^\d]/g, "");
      val = Number(val).toLocaleString();
      field.textContent = "₱" + (val || "0");
    } else {
      if (!field.textContent.trim()) {
        if (field === modalTitle) field.textContent = "✎ Tour Name";
        if (field === modalDuration) field.textContent = "✎ Duration";
      }
    }
  });
}

addEditableBehavior(modalTitle);
addEditableBehavior(modalDuration);
addEditableBehavior(modalPrice, true);

if (modalTitle && !modalTitle.textContent.startsWith("✎ ")) modalTitle.textContent = "✎ Tour Name";
if (modalPrice && !modalPrice.textContent.startsWith("₱")) modalPrice.textContent = "₱0";
if (modalDuration && !modalDuration.textContent.startsWith("✎ ")) modalDuration.textContent = "✎ Duration";

// --- Publish ---
document.getElementById("publishBtn").addEventListener("click", () => {
  const name = modalTitle.textContent.replace(/^✎\s*/, "").trim() || "Untitled";
  const price = modalPrice.textContent.replace(/^₱/, "").trim() || "0";
  const duration = modalDuration.textContent.replace(/^✎\s*/, "").trim() || "";
  const location = document.getElementById("location").value || "";
  const description = document.getElementById("activityDescription").value || "";
  const imgEl = document.getElementById("mainImage");
  const imageSrc = imgEl && imgEl.src && imgEl.style.display !== "none" ? imgEl.src : "";

  addActivityToResults({
    name,
    subtitle: location,
    desc: description,
    price: "₱" + Number(price.replace(/,/g, "")).toLocaleString(),
    duration,
    img: imageSrc
  });

  modal.style.display = "none";
  clearModal();
});

// Add Activity dropdown (Flights, Hotels, Restaurants, Tours)
btnAddActivity = document.getElementById("btnAddActivity");

if (btnAddActivity) {
  btnAddActivity.addEventListener("change", (e) => {
    const category = e.target.value;
    if (!category) return; // do nothing if placeholder is selected

    switch (category) {
      case "flights":
        // TODO: Replace with your flights modal
        alert("Flights modal coming soon ✈️");
        break;

      case "hotels":
        // TODO: Replace with your hotels modal
        alert("Hotels modal coming soon 🏨");
        break;

      case "restaurants":
        // TODO: Replace with your restaurants modal
        alert("Restaurants modal coming soon 🍽️");
        break;

      case "tours":
        // existing tours modal
        const modal = document.getElementById("modalAddActivity");
        if (modal) modal.style.display = "flex";
        break;
    }

    // reset dropdown back to placeholder
    btnAddActivity.value = "";
  });
}

// --- Add activity to results with 3-dot menu (Edit/Delete) ---
function addActivityToResults(activity) {
  const results = document.getElementById("activity-results");
  const wrapper = document.createElement("div");
  wrapper.className = "activity-card";
  wrapper.setAttribute("draggable", "true");

  const cardHTML = document.createElement("div");
  cardHTML.className = "card";

  // Image or placeholder
  if (activity.img) {
    const img = document.createElement("img");
    img.src = activity.img;
    img.alt = activity.name;
    cardHTML.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.style.width = "140px";
    placeholder.style.height = "100px";
    placeholder.style.background = "#f3f4f6";
    placeholder.style.borderRadius = "6px";
    cardHTML.appendChild(placeholder);
  }

  // Content
  const content = document.createElement("div");
  content.className = "content";
  const title = document.createElement("h5");
  title.textContent = activity.name;
  title.className = "master-title";
  const subtitle = document.createElement("div");
  subtitle.textContent = activity.subtitle || "";
  subtitle.className = "subtitle";
  const desc = document.createElement("p");
  desc.textContent = activity.desc || "";
  content.append(title, subtitle, desc);
  cardHTML.appendChild(content);

  // Right panel
  const right = document.createElement("div");
  right.className = "right";
  const price = document.createElement("div");
  price.className = "price";
  price.textContent = activity.price || "";
  const duration = document.createElement("div");
  duration.className = "duration";
  duration.textContent = activity.duration || "";
  right.append(price, duration);
  cardHTML.appendChild(right);

  // 3-dot menu
  const menu = document.createElement("span");
  menu.className = "activity-menu";
  menu.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
  cardHTML.appendChild(menu);

  // Menu actions
  menu.onclick = (e) => {
    e.stopPropagation();
    showActivityMenu(menu, wrapper);
  };

  wrapper.appendChild(cardHTML);
  results.appendChild(wrapper);

  wrapper.addEventListener("dragstart", dragStartHandlerFromResults);
  wrapper.addEventListener("dragend", dragEndHandler);
}

// --- Activity menu for edit/delete ---
function showActivityMenu(menu, cardNode) {
  const existingMenu = document.getElementById("contextMenu");
  if (existingMenu) existingMenu.remove();

  const menuDiv = document.createElement("div");
  menuDiv.id = "contextMenu";
  menuDiv.style.position = "absolute";
  menuDiv.style.background = "#fff";
  menuDiv.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
  menuDiv.style.borderRadius = "6px";
  menuDiv.style.padding = "8px 0";
  menuDiv.style.zIndex = 1000;
  menuDiv.style.top = `${menu.getBoundingClientRect().bottom + window.scrollY}px`;
  menuDiv.style.left = `${menu.getBoundingClientRect().left + window.scrollX}px`;

  const edit = document.createElement("div");
  edit.textContent = "Edit";
  edit.style.padding = "6px 20px";
  edit.style.cursor = "pointer";
  edit.onmouseenter = () => edit.style.background = "#f3f4f6";
  edit.onmouseleave = () => edit.style.background = "transparent";
  edit.onclick = () => {
    // open modal pre-filled
    openEditModal(cardNode);
    menuDiv.remove();
  };

  const del = document.createElement("div");
  del.textContent = "Delete";
  del.style.padding = "6px 20px";
  del.style.cursor = "pointer";
  del.onmouseenter = () => del.style.background = "#f3f4f6";
  del.onmouseleave = () => del.style.background = "transparent";
  del.onclick = () => {
    showDeletePopup(cardNode);
    menuDiv.remove();
  };

  menuDiv.append(edit, del);
  document.body.appendChild(menuDiv);

  document.addEventListener("click", () => menuDiv.remove(), { once: true });
}

// --- Delete confirmation popup ---
function showDeletePopup(cardNode) {
  const popup = document.getElementById("activityConfirmPopup");
  popup.style.display = "block";

  const confirmBtn = document.getElementById("confirmDeleteActivity");
  const cancelBtn = document.getElementById("cancelDeleteActivity");

  confirmBtn.onclick = () => {
    const parentDrop = cardNode.closest(".drop");
    cardNode.remove();
    if (parentDrop && parentDrop.querySelectorAll(".activity-card").length === 0) {
      parentDrop.classList.add("empty");
    }
    popup.style.display = "none";
  };

  cancelBtn.onclick = () => popup.style.display = "none";
}

// --- Edit activity ---
function openEditModal(cardNode) {
  const name = cardNode.querySelector(".master-title")?.textContent || "";
  const price = cardNode.querySelector(".price")?.textContent || "₱0";
  const duration = cardNode.querySelector(".duration")?.textContent || "";
  const subtitle = cardNode.querySelector(".subtitle")?.textContent || "";
  const modalImg = document.getElementById("mainImage");

  modalTitle.textContent = "✎ " + name;
  modalPrice.textContent = price;
  modalDuration.textContent = "✎ " + duration;
  document.getElementById("location").value = subtitle;

  modalImg.style.display = "none";
  modalImg.src = "";

  modal.style.display = "flex";
}

// --- Drag & drop functions ---
let dragSourceIsMaster = false;
let draggedElement = null;

function dragStartHandlerFromResults(ev) {
  dragSourceIsMaster = true;
  draggedElement = null;
  this.classList.add("dragging");
  ev.dataTransfer.effectAllowed = "copy";
  ev.dataTransfer.setData("text/html", this.outerHTML);
}

function dragStartHandlerDropped(ev) {
  dragSourceIsMaster = false;
  draggedElement = this;
  this.classList.add("dragging");
  ev.dataTransfer.effectAllowed = "move";
  ev.dataTransfer.setData("text/plain", "moving");
}

function dragEndHandler() {
  document.querySelectorAll(".activity-card.dragging").forEach(el => el.classList.remove("dragging"));
  dragSourceIsMaster = false;
  draggedElement = null;
}

function allowDrop(ev) {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = dragSourceIsMaster ? "copy" : "move";
}

function drop(ev) {
  ev.preventDefault();
  const dropzone = ev.currentTarget || ev.target.closest(".drop");
  if (!dropzone) return;

  const afterElement = getDragAfterElement(dropzone, ev.clientY);

  if (dragSourceIsMaster) {
    const data = ev.dataTransfer.getData("text/html");
    if (!data) return;
    const temp = document.createElement("div");
    temp.innerHTML = data.trim();
    let newCard = temp.firstChild;
    if (!newCard.classList.contains("activity-card")) {
      const wrapper = document.createElement("div");
      wrapper.className = "activity-card";
      wrapper.innerHTML = newCard.outerHTML;
      newCard = wrapper;
    }
    newCard.setAttribute("draggable", "true");
    newCard.addEventListener("dragstart", dragStartHandlerDropped);
    newCard.addEventListener("dragend", dragEndHandler);
    addTrashAndEditableToDropped(newCard);

    if (afterElement == null) dropzone.appendChild(newCard);
    else dropzone.insertBefore(newCard, afterElement);
  } else {
    if (!draggedElement) return;
    if (afterElement == null) dropzone.appendChild(draggedElement);
    else dropzone.insertBefore(draggedElement, afterElement);
  }

  dropzone.classList.remove("empty");
  dragSourceIsMaster = false;
  draggedElement = null;
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".activity-card:not(.dragging)")];
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  for (const child of draggableElements) {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) closest = { offset, element: child };
  }
  return closest.element;
}

// --- Add editable & trash to dropped card ---
function addTrashAndEditableToDropped(cardNode) {
  if (!cardNode.classList.contains("activity-card")) cardNode.classList.add("activity-card");

  const innerCard = cardNode.querySelector(".card");
  if (!innerCard) return;

  const title = cardNode.querySelector(".master-title") || cardNode.querySelector("h5");
  const price = cardNode.querySelector(".price");
  const duration = cardNode.querySelector(".duration");

  [title, price, duration].forEach(el => {
    if (!el) return;
    el.setAttribute("contenteditable", "true");
    el.addEventListener("focus", () => el.classList.add("editing"));
    el.addEventListener("blur", () => {
      el.classList.remove("editing");
      if (el === price) {
        let val = el.textContent.replace(/[^\d]/g, "");
        val = Number(val).toLocaleString();
        el.textContent = "₱" + (val || "0");
      }
    });
  });

  cardNode.addEventListener("dragstart", dragStartHandlerDropped);
  cardNode.addEventListener("dragend", dragEndHandler);
}

// --- Clear modal ---
function clearModal() {
  const imgEl = document.getElementById("mainImage");
  if (imgEl) { imgEl.src = ""; imgEl.style.display = "none"; }
  const input = document.getElementById("mainImageInput");
  if (input) input.value = "";
  input && delete input.dataset.preview;

  document.getElementById("location").value = "";
  document.getElementById("activityDescription").value = "";

  if (modalTitle) modalTitle.textContent = "✎ Tour Name";
  if (modalPrice) modalPrice.textContent = "₱0";
  if (modalDuration) modalDuration.textContent = "✎ Duration";
}