// flights.js
// Frontend: fetches from /search-airports and /search-flights endpoints on your server

let allFlights = [];
let filteredFlights = [];

// --- Traveler dropdown ---
const travelerDropdown = document.querySelector('.traveler-dropdown');
const travelerToggle = document.getElementById('travelerToggle');
if (travelerToggle && travelerDropdown) {
  travelerToggle.addEventListener('click', () => travelerDropdown.classList.toggle('open'));
}
function updateTravelerText() {
  const adults = document.getElementById('adultCount').value;
  const children = document.getElementById('childCount').value;
  const infants = document.getElementById('infantCount').value;
  let text = `${adults} Adult`;
  if (children > 0) text += `, ${children} Child`;
  if (infants > 0) text += `, ${infants} Infant`;
  if (travelerToggle) travelerToggle.textContent = text;
}
['adultCount', 'childCount', 'infantCount'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateTravelerText);
});
updateTravelerText();

// --- Airline dictionary (expanded) ---
const airlineNames = {
  "PR": "Philippine Airlines",
  "5J": "Cebu Pacific Air",
  "DG": "Cebgo / AirAsia (DG)",
  "Z2": "AirAsia Philippines",
  "SQ": "Singapore Airlines",
  "TR": "Scoot",
  "MH": "Malaysia Airlines",
  "CX": "Cathay Pacific",
  "KE": "Korean Air",
  "OZ": "Asiana Airlines",
  "JL": "Japan Airlines",
  "NH": "ANA",
  "QF": "Qantas",
  "UA": "United Airlines",
  "DL": "Delta Air Lines",
  "AA": "American Airlines",
  "EK": "Emirates",
  "QR": "Qatar Airways",
  "EY": "Etihad Airways",
  "BA": "British Airways",
  "TK": "Turkish Airlines",
  "LX": "SWISS",
  "LH": "Lufthansa",
  "AF": "Air France",
  "KL": "KLM",
  "VN": "Vietnam Airlines",
  "GA": "Garuda Indonesia",
  "CI": "China Airlines",
  "MU": "China Eastern",
  "CA": "Air China",
  "BR": "EVA Air",
  "AI": "Air India",
  "AY": "Finnair",
  "AZ": "ITA Airways",
  "SU": "Aeroflot",
  "AC": "Air Canada"
};

// Airline logos (pics.avs.io)
function getAirlineLogo(code) {
  // fallback to a generic placeholder if unavailable
  return `https://pics.avs.io/200/200/${code}.png`;
}

// --- Helpers ---
function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
function minutesToTimeLabel(mins) {
  const hh = Math.floor(mins/60);
  const mm = mins % 60;
  const date = new Date();
  date.setHours(hh);
  date.setMinutes(mm);
  return formatTime(date.toISOString());
}
function displaySearchDate(dateStr) {
  const dateDisplay = document.getElementById('flightsDateContainer');
  if (!dateDisplay) return;
  const date = new Date(dateStr);
  dateDisplay.textContent = `Available Flights for ${date.toDateString()}`;
}

// --- PH airports list for suggestion restriction (can add more codes) ---
const phAirports = ["MNL","CEB","CRK","DVO","ILO","KLO","ZAM","PPS","LGP","TAC","TAG","BSO","SUG","SJI","USU","MRQ"];

// --- Suggestion overlay creation & utilities ---
function createOverlaySuggestions(target) {
  // creates a suggestions box appended to body and positions under input
  const existing = document.getElementById(`${target}-suggestions-overlay`);
  if (existing) return existing;
  const box = document.createElement('ul');
  box.id = `${target}-suggestions-overlay`;
  box.className = 'suggestions-box';
  box.style.position = 'absolute';
  box.style.display = 'none';
  document.body.appendChild(box);

  // position on input events
  const input = document.getElementById(`${target}Input`);
  if (!input) return box;
  const reposition = () => {
    const rect = input.getBoundingClientRect();
    box.style.top = `${rect.bottom + window.scrollY}px`;
    box.style.left = `${rect.left + window.scrollX}px`;
    box.style.width = `${rect.width}px`;
  };
  input.addEventListener('focus', reposition);
  input.addEventListener('input', reposition);
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition);
  // click outside to hide
  document.addEventListener('click', (ev) => {
    if (!box.contains(ev.target) && ev.target !== input) box.style.display = 'none';
  });
  return box;
}
const fromOverlay = createOverlaySuggestions('from');
const toOverlay = createOverlaySuggestions('to');

// --- Fetch airports and show overlay suggestions ---
// originOnly = true restricts to PH airports (we still filter by returned results)
async function fetchAirportsAndShow(keyword, target, originOnly = false) {
  const overlay = document.getElementById(`${target}-suggestions-overlay`);
  if (!overlay) return;
  if (!keyword || keyword.trim().length < 1) {
    overlay.innerHTML = "";
    overlay.style.display = 'none';
    return;
  }
  try {
    const res = await fetch(`/search-airports?keyword=${encodeURIComponent(keyword)}&subType=AIRPORT`);
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      overlay.innerHTML = "";
      overlay.style.display = 'none';
      return;
    }
    // Optionally restrict to PH by iataCode or country
    let items = list;
    if (originOnly) {
      items = list.filter(a => phAirports.includes(a.iataCode) || (a.address && a.address.countryCode === 'PH'));
    }

    overlay.innerHTML = "";
    items.slice(0, 50).forEach(a => {
      const li = document.createElement('li');
      // show full: "MNL - Ninoy Aquino Intl (Manila)"
      const nameParts = [];
      if (a.iataCode) nameParts.push(a.iataCode);
      if (a.name) nameParts.push(a.name);
      if (a.address?.cityName) nameParts.push(`(${a.address.cityName})`);
      li.textContent = nameParts.join(' - ');
      li.style.padding = '8px 10px';
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        const input = document.getElementById(`${target}Input`);
        input.value = li.textContent;
        overlay.innerHTML = "";
        overlay.style.display = 'none';
      });
      overlay.appendChild(li);
    });
    overlay.style.display = items.length ? 'block' : 'none';
  } catch (err) {
    console.error("Airport fetch failed:", err);
    overlay.innerHTML = "";
    overlay.style.display = 'none';
  }
}

// hook inputs
["from","to"].forEach(field => {
  const input = document.getElementById(`${field}Input`);
  if (!input) return;
  input.addEventListener('input', (e) => fetchAirportsAndShow(e.target.value, field, field === 'from'));
  input.addEventListener('focus', (e) => fetchAirportsAndShow(e.target.value, field, field === 'from'));
});

// --- Convert input string to IATA (fallback) ---
async function resolveAirportCode(value) {
  if (!value) return null;
  // If user typed "MNL - Ninoy Aquino", try to extract 3-letter code
  const codeMatch = value.trim().match(/^([A-Z]{3})\b/);
  if (codeMatch) return codeMatch[1];
  // Otherwise query backend to search first match
  try {
    const res = await fetch(`/search-airports?keyword=${encodeURIComponent(value)}&subType=AIRPORT`);
    const list = await res.json();
    if (Array.isArray(list) && list.length) return list[0].iataCode;
  } catch (err) {
    console.warn("resolveAirportCode failed", err);
  }
  return null;
}

// --- Fetch flights from backend ---
// Supports roundtrip via returnDate param when tripType === 'roundtrip'
async function fetchFlights(from, to, departDate, returnDate = "", tripType = "oneway", append = false) {
  const container = document.getElementById("flightsContainer");
  if (!container) return;

  if (!append) container.innerHTML = `<p style="text-align:center;padding:20px;">Searching flights...</p>`;

  try {
    const params = new URLSearchParams({
      origin: from,
      destination: to,
      departureDate: departDate,
      adults: 1,
      currencyCode: "PHP"
    });
    if (tripType === 'roundtrip' && returnDate) params.set('returnDate', returnDate);

    const res = await fetch(`/search-flights?${params.toString()}`);
    const payload = await res.json();
    if (!payload.success || !Array.isArray(payload.data) || payload.data.length === 0) {
      if (!append) container.innerHTML = `<p style="text-align:center;padding:20px;">No flights found.</p>`;
      return;
    }

    if (append) {
      allFlights = [...allFlights, ...payload.data];
    } else {
      allFlights = payload.data;
    }
    filteredFlights = [...allFlights];

    displaySearchDate(departDate);
    updateSliders(allFlights);
    applyFilters();
  } catch (err) {
    console.error("Error fetching flights:", err);
    if (!append) container.innerHTML = `<p style="text-align:center;padding:20px;color:red;">Error fetching flights.</p>`;
  }
}

// --- Render flights (UI) ---
function renderFlights(flights) {
  const container = document.getElementById("flightsContainer");
  container.innerHTML = "";
  if (!flights || flights.length === 0) {
    container.innerHTML = `<p style="text-align:center;padding:20px;">No flights to show.</p>`;
    return;
  }

  const planeImageUrl = '{{ url_for("static", filename="icons/plane2.png") }}';

  flights.forEach(flight => {
    const code = flight.validatingAirlineCodes?.[0] || flight.itineraries?.[0]?.segments?.[0]?.carrierCode || "XX";
    const airlineDisplayName = airlineNames[code] || code;
    const seats = flight.numberOfBookableSeats ?? "N/A";
    const cabin = flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "Economy";
    const segments = flight.itineraries?.[0]?.segments || [];
    if (!segments.length) return;

    const dep = segments[0].departure;
    const arr = segments[segments.length - 1].arrival;
    const depTime = formatTime(dep.at);
    const arrTime = formatTime(arr.at);
    const duration = flight.itineraries?.[0]?.duration?.replace("PT", "") || "";

    const logo = getAirlineLogo(code);
    const price = flight.price?.total ? `₱${parseFloat(flight.price.total).toLocaleString('en-PH')}` : "₱N/A";

    // Build card
    const flightCard = document.createElement('div');
    flightCard.className = 'flight-card';
    flightCard.style.display = 'flex';
    flightCard.style.justifyContent = 'space-between';
    flightCard.style.alignItems = 'center';
    flightCard.style.gap = '16px';


    flightCard.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; min-width:260px;">
        <img src="${logo}" alt="${code}" class="airline-logo" style="width:64px;height:64px;object-fit:contain;border-radius:6px;">
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="font-weight:700; color:#091d46;">${airlineDisplayName}</div>
          <div class="flight-times" style="display:flex; align-items:center; gap:18px;">
            <div class="dep-arr-block" style="display:flex; flex-direction:column; align-items:center;">
              <span class="time" style="font-weight:700;">${depTime}</span>
              <span class="airport" style="font-size:12px; color:#6b7280;">${dep.iataCode} ${dep.cityName ? '- ' + dep.cityName : ''}</span>
            </div>
            <img src="${planeImageUrl}" class="flight-plane" style="width:24px;height:24px;object-fit:contain;">
            <div class="dep-arr-block" style="display:flex; flex-direction:column; align-items:center;">
              <span class="time" style="font-weight:700;">${arrTime}</span>
              <span class="airport" style="font-size:12px; color:#6b7280;">${arr.iataCode} ${arr.cityName ? '- ' + arr.cityName : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="price-block" style="display:flex; align-items:center; gap:18px;">
        <div class="duration" style="font-weight:700; min-width:80px; text-align:center;">${duration}</div>
        <div class="cabin" style="min-width:80px; text-align:center;">${cabin}</div>
        <div class="price" style="font-weight:800; font-size:18px; color:#0a62a8; min-width:120px; text-align:center;">${price}</div>
        <div class="select-wrapper" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <button class="select-btn" style="width:120px; padding:10px 12px; border-radius:8px; background:#008EC4; color:white; border:none; cursor:pointer; font-weight:600;">Select</button>
          <div class="seats" style="font-size:13px; color:#6b7280;">Seats left: ${seats}</div>
        </div>
      </div>
    `;
    container.appendChild(flightCard);
  });
}

// --- Filter logic
const sliderState = {
  priceMin: null, priceMax: null, priceDefault: null,
  depMin: null, depMax: null, depDefault: null,
  arrMin: null, arrMax: null, arrDefault: null
};

function applyFilters() {
  let flights = [...allFlights];

  // Airlines filter (only if checkboxes selected)
  const checkedAirlines = [...document.querySelectorAll("#airlinesList input:checked")].map(cb => cb.value);
  if (checkedAirlines.length) flights = flights.filter(f => checkedAirlines.includes(f.validatingAirlineCodes?.[0] || f.itineraries?.[0]?.segments?.[0]?.carrierCode));

  // Price filter: apply only if slider set lower than its default max
  const priceSlider = document.getElementById('priceSlider');
  const priceVal = priceSlider ? Number(priceSlider.value) : null;
  if (priceVal !== null && sliderState.priceMax !== null && priceVal < sliderState.priceDefault) {
    flights = flights.filter(f => {
      const p = Number(f.price?.total || Infinity);
      return p <= priceVal;
    });
  }

  // Dep/Arr time filters: treat as "only apply if changed"
  const depSlider = document.getElementById('depTimeSlider');
  const arrSlider = document.getElementById('arrTimeSlider');
  const depVal = depSlider ? Number(depSlider.value) : null;
  const arrVal = arrSlider ? Number(arrSlider.value) : null;

  if (depVal !== null && sliderState.depDefault !== null && depVal !== sliderState.depDefault) {
    // filter departure <= depVal
    flights = flights.filter(f => {
      const d = new Date(f.itineraries[0].segments[0].departure.at);
      const mins = d.getHours() * 60 + d.getMinutes();
      return mins <= depVal;
    });
  }

  if (arrVal !== null && sliderState.arrDefault !== null && arrVal !== sliderState.arrDefault) {
    flights = flights.filter(f => {
      const a = new Date(f.itineraries[0].segments.slice(-1)[0].arrival.at);
      const mins = a.getHours() * 60 + a.getMinutes();
      return mins <= arrVal;
    });
  }

  // Cabin filter
  const cabin = document.getElementById('cabinClass').value;
  if (cabin) {
    flights = flights.filter(f => f.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin === cabin);
  }

  // Sorting
  const sort = document.getElementById('sortSelect').value;
  flights.sort((a, b) => {
    if (sort === 'price_asc') return Number(a.price.total) - Number(b.price.total);
    if (sort === 'price_desc') return Number(b.price.total) - Number(a.price.total);
    if (sort === 'depart_asc') return new Date(a.itineraries[0].segments[0].departure.at) - new Date(b.itineraries[0].segments[0].departure.at);
    if (sort === 'arrival_asc') return new Date(a.itineraries[0].segments.slice(-1)[0].arrival.at) - new Date(b.itineraries[0].segments.slice(-1)[0].arrival.at);
    return 0;
  });

  filteredFlights = flights;
  renderFlights(filteredFlights);
}

// --- Update slider ranges from available flights ---
// Sets sliderState and updates labels to default values
function updateSliders(flights) {
  if (!flights || !flights.length) return;

  const prices = flights.map(f => Number(f.price?.total || Infinity)).filter(n => isFinite(n));
  const depTimes = flights.map(f => {
    const d = new Date(f.itineraries[0].segments[0].departure.at);
    return d.getHours() * 60 + d.getMinutes();
  });
  const arrTimes = flights.map(f => {
    const d = new Date(f.itineraries[0].segments.slice(-1)[0].arrival.at);
    return d.getHours() * 60 + d.getMinutes();
  });

  const minPrice = Math.floor(Math.min(...prices));
  const maxPrice = Math.ceil(Math.max(...prices));
  const minDep = Math.min(...depTimes);
  const maxDep = Math.max(...depTimes);
  const minArr = Math.min(...arrTimes);
  const maxArr = Math.max(...arrTimes);
  
  sliderState.priceMin = minPrice;
  sliderState.priceMax = maxPrice;
  sliderState.priceDefault = maxPrice;

  sliderState.depMin = minDep;
  sliderState.depMax = maxDep;
  sliderState.depDefault = maxDep;

  sliderState.arrMin = minArr;
  sliderState.arrMax = maxArr;
  sliderState.arrDefault = maxArr;

  const priceSlider = document.getElementById('priceSlider');
  if (priceSlider) {
    priceSlider.min = minPrice;
    priceSlider.max = maxPrice;
    priceSlider.value = maxPrice;
    document.getElementById('priceDisplay').textContent = `₱${Number(priceSlider.value).toLocaleString('en-PH')}`;
  }

  const depSlider = document.getElementById('depTimeSlider');
  if (depSlider) {
    depSlider.min = minDep;
    depSlider.max = maxDep;
    depSlider.value = maxDep;
    document.getElementById('depTimeDisplay').textContent = minutesToTimeLabel(depSlider.value);
  }

  const arrSlider = document.getElementById('arrTimeSlider');
  if (arrSlider) {
    arrSlider.min = minArr;
    arrSlider.max = maxArr;
    arrSlider.value = maxArr;
    document.getElementById('arrTimeDisplay').textContent = minutesToTimeLabel(arrSlider.value);
  }
}

// --- Slider UI events (live update + applyFilters) ---
['priceSlider','depTimeSlider','arrTimeSlider'].forEach(id=>{
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    if (id === 'priceSlider') {
      document.getElementById('priceDisplay').textContent = `₱${Number(el.value).toLocaleString('en-PH')}`;
    } else if (id === 'depTimeSlider') {
      document.getElementById('depTimeDisplay').textContent = minutesToTimeLabel(Number(el.value));
    } else if (id === 'arrTimeSlider') {
      document.getElementById('arrTimeDisplay').textContent = minutesToTimeLabel(Number(el.value));
    }
    // Apply filters live
    applyFilters();
  });
});

// cabin and airline checkboxes
const cabinSelect = document.getElementById('cabinClass');
if (cabinSelect) cabinSelect.addEventListener('change', applyFilters);
document.querySelectorAll('#airlinesList input[type=checkbox]').forEach(cb => cb.addEventListener('change', applyFilters));
document.getElementById('sortSelect')?.addEventListener('change', applyFilters);

// Reset filters
document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
  // Reset selected checkboxes
  document.querySelectorAll("#airlinesList input").forEach(cb => cb.checked = false);
  // Reset slider values back to defaults (if set)
  if (sliderState.priceDefault !== null) {
    const ps = document.getElementById('priceSlider');
    ps.value = sliderState.priceDefault;
    document.getElementById('priceDisplay').textContent = `₱${Number(ps.value).toLocaleString('en-PH')}`;
  }
  if (sliderState.depDefault !== null) {
    const ds = document.getElementById('depTimeSlider');
    ds.value = sliderState.depDefault;
    document.getElementById('depTimeDisplay').textContent = minutesToTimeLabel(Number(ds.value));
  }
  if (sliderState.arrDefault !== null) {
    const as = document.getElementById('arrTimeSlider');
    as.value = sliderState.arrDefault;
    document.getElementById('arrTimeDisplay').textContent = minutesToTimeLabel(Number(as.value));
  }
  // Reset cabin
  const cabin = document.getElementById('cabinClass');
  if (cabin) cabin.value = "";
  // Clear search fields
  document.getElementById('fromInput').value = "";
  document.getElementById('toInput').value = "";
  document.getElementById('departDate').value = "";
  document.getElementById('returnDate').value = "";
  // Reset internal filtered
  filteredFlights = [...allFlights];
  renderFlights(filteredFlights);
});

// --- Search button / radio handling / roundtrip support ---
document.getElementById('searchBtn')?.addEventListener('click', async () => {
  let fromRaw = document.getElementById('fromInput').value.trim();
  let toRaw = document.getElementById('toInput').value.trim();
  let departDate = document.getElementById('departDate').value;
  let returnDate = document.getElementById('returnDate').value;
  const tripType = document.querySelector('input[name="tripType"]:checked')?.value || 'oneway';

  if (!fromRaw || !toRaw || !departDate) {
    alert("Please enter origin, destination and departure date");
    return;
  }

  const from = await resolveAirportCode(fromRaw) || fromRaw;
  const to = await resolveAirportCode(toRaw) || toRaw;

  // If roundtrip and no return date, prompt
  if (tripType === 'roundtrip' && !returnDate) {
    alert("Please select a return date for Round Trip");
    return;
  }

  await fetchFlights(from, to, departDate, tripType === 'roundtrip' ? returnDate : "", tripType, false);
});

// Make returnDate enabled/disabled depending on radio
document.querySelectorAll('input[name="tripType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const returnEl = document.getElementById('returnDate');
    if (!returnEl) return;
    if (e.target.value === 'roundtrip') {
      returnEl.disabled = false;
    } else {
      returnEl.disabled = true;
      returnEl.value = "";
    }
  });
});
// initialize returnDate disabled if one-way selected
if (document.querySelector('input[name="tripType"]:checked')?.value === 'oneway') {
  const returnEl = document.getElementById('returnDate');
  if (returnEl) { returnEl.disabled = true; returnEl.value = ""; }
}

// --- Auto-search when fields blur/change (small debounce) ---
let autoTimer = null;
function debounceAutoSearch() {
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = setTimeout(async () => {
    const fromRaw = document.getElementById('fromInput').value.trim();
    const toRaw = document.getElementById('toInput').value.trim();
    const departDate = document.getElementById('departDate').value;
    const tripType = document.querySelector('input[name="tripType"]:checked')?.value || 'oneway';
    const returnDate = document.getElementById('returnDate').value;

    if (fromRaw && toRaw && departDate) {
      const from = await resolveAirportCode(fromRaw) || fromRaw;
      const to = await resolveAirportCode(toRaw) || toRaw;
      await fetchFlights(from, to, departDate, tripType === 'roundtrip' ? returnDate : "", tripType, false);
    }
  }, 700);
}

['fromInput','toInput','departDate','returnDate'].forEach(id=>{
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', debounceAutoSearch);
  el.addEventListener('blur', debounceAutoSearch);
});

// --- On page load: optionally load "today's flights" from PH origins
const defaultPhOrigins = ["MNL","CEB","CRK","DVO","ILO"]; // can extend
window.addEventListener('DOMContentLoaded', async () => {
  const today = new Date().toISOString().split('T')[0];
  displaySearchDate(today);

  // If user leaves form blank auto-load today's flights from PH origins to "anywhere" (we pick common destinations).
  const defaultDestinations = ["SIN","KUL","BKK","CEB","MNL"]; 
  allFlights = [];
  for (const origin of defaultPhOrigins) {
    for (const dest of defaultDestinations) {
      // skip origin==dest
      if (origin === dest) continue;
      try {
        await fetchFlights(origin, dest, today, "", "oneway", true);
      } catch (e) {
        // continue quietly
      }
    }
  }
  // After loading, ensure UI reflects filters/sliders
  updateSliders(allFlights);
  applyFilters();
});

// --- Small accessibility: hide overlays on ESC ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const fo = document.getElementById('from-suggestions-overlay');
    if (fo) fo.style.display = 'none';
    const to = document.getElementById('to-suggestions-overlay');
    if (to) to.style.display = 'none';
  }
});
