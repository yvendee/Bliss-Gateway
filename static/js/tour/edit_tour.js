document.addEventListener("DOMContentLoaded", async () => {
  const tourId = getQueryParam("id");
  if (!tourId) { alert("Invalid tour ID"); return; }

  try {
    const res = await fetch(`get_tour.php?id=${tourId}`);
    const tour = await res.json();
    if (!tour || tour.error) { alert("Tour not found"); return; }

    // Inline editable fields (match add_tour.js)
    document.getElementById("tourNameField").innerText = (tour.tour_name || "Tour Name") + " ✎";
    document.getElementById("locationField").innerText = (tour.location || "Location") + " ✎";
    document.getElementById("priceField").innerText = 
      "₱" + (parseFloat(tour.price || 0).toLocaleString(undefined,{minimumFractionDigits:2})) + " ✎";
    document.getElementById("minBookingsField").innerText = 
      "Minimum number of bookings: " + (tour.min_bookings || 1) + " ✎";

    // Normal inputs
    document.getElementById("tourType").value = tour.tour_type || "";
    document.getElementById("checkIn").value = tour.check_in_date || "";
    document.getElementById("checkOut").value = tour.check_out_date || "";
    document.getElementById("hotelName").value = tour.hotel_name || "";
    document.getElementById("roomType").value = tour.room_type || "";
    document.getElementById("overview").value = tour.overview || "";
    document.getElementById("flightInfo").value = tour.flight_information || "";
    document.getElementById("itinerary").value = tour.itinerary || "";
    document.getElementById("importantNotes").value = tour.important_notes || "";
    document.getElementById("meetingPoint").value = tour.meeting_point || "";
    document.getElementById("endPoint").value = tour.end_point || "";
    document.getElementById("pickup-details").value = tour.pickup_details || "";

    // Inclusions / Exclusions as text
    document.getElementById("inclusions").value = Array.isArray(tour.inclusions) ? tour.inclusions.join("\n") : (tour.inclusions || "");
    document.getElementById("exclusions").value = Array.isArray(tour.exclusions) ? tour.exclusions.join("\n") : (tour.exclusions || "");

    // Images
    if (tour.main_image) {
      const img = document.getElementById("mainImage");
      img.src = tour.main_image;
      img.style.display = "block";
    }
    ["sideImage1","sideImage2","sideImage3"].forEach((id, idx) => {
      const src = tour[`side_image${idx+1}`];
      if (src) {
        const img = document.getElementById(id);
        img.src = src;
        img.style.display = "block";
      }
    });

  } catch(err) {
    console.error(err);
    alert("Error loading tour data.");
  }

  // ===== Submit updated data =====
  document.getElementById("editTourForm").addEventListener("submit", async e => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id", tourId);

    // Inline editable fields (strip ✎, ₱, labels)
    formData.append("tour_name", document.getElementById("tourNameField").innerText.replace(/✎|\*/g, "").trim());
    formData.append("location", document.getElementById("locationField").innerText.replace(/✎|\*/g, "").trim());
    formData.append("tour_type", document.getElementById("tourType").value.trim());
    formData.append("price", parseFloat(document.getElementById("priceField").innerText.replace(/[₱,✎*]/g,"")) || 0);
    formData.append("min_bookings", parseInt(document.getElementById("minBookingsField").innerText.replace(/Minimum number of bookings:|✎|\*/g,"")) || 1);

    // Normal inputs
    formData.append("check_in_date", document.getElementById("checkIn").value);
    formData.append("check_out_date", document.getElementById("checkOut").value);
    formData.append("hotel_name", document.getElementById("hotelName").value.trim());
    formData.append("room_type", document.getElementById("roomType").value.trim());
    formData.append("overview", document.getElementById("overview").value.trim());
    formData.append("flight_information", document.getElementById("flightInfo").value.trim());
    formData.append("itinerary", document.getElementById("itinerary").value.trim());
    formData.append("important_notes", document.getElementById("importantNotes").value.trim());
    formData.append("meeting_point", document.getElementById("meetingPoint").value.trim());
    formData.append("end_point", document.getElementById("endPoint").value.trim());
    formData.append("pickup_details", document.getElementById("pickup-details").value.trim());

    // Inclusions/Exclusions
    formData.append("inclusions", document.getElementById("inclusions").value.trim());
    formData.append("exclusions", document.getElementById("exclusions").value.trim());

    // Images
    ["mainImageInput","sideImageInput1","sideImageInput2","sideImageInput3"].forEach((inputId, idx) => {
      const file = document.getElementById(inputId).files[0];
      if (file) formData.append(["main_image","side_image1","side_image2","side_image3"][idx], file);
    });

    try {
      const res = await fetch("edit_tour.php", { method: "POST", body: formData });
      const data = await res.json();
      showPopup(data.message, data.success ? "success" : "error");
      if (data.success) setTimeout(() => window.location.href="create.html", 1500);
    } catch(err) {
      console.error(err);
      showPopup("Error updating tour.", "error");
    }
  });
});
