// Center of Bengaluru (approx near MG Road)
const BANGALORE_CENTER = [12.9716, 77.5946];

// Route endpoints used for "track by ID" (rough real-world points)
const ROUTE_ENDPOINTS = {
  // Bus routes
  "BTP-12": {
    mode: "bus",
    from: { lat: 12.9766, lng: 77.5713 }, // Majestic
    to: { lat: 12.8443, lng: 77.6762 }, // Electronic City
  },
  "BTP-07": {
    mode: "bus",
    from: { lat: 12.9655, lng: 77.6061 }, // Shivajinagar-ish
    to: { lat: 13.0312, lng: 77.5205 }, // Peenya-ish
  },
  "BTP-25": {
    mode: "bus",
    from: { lat: 13.0358, lng: 77.5946 }, // Hebbal-ish
    to: { lat: 12.9106, lng: 77.6089 }, // Bannerghatta-ish
  },
  "KRM-21": {
    mode: "bus",
    from: { lat: 12.9635, lng: 77.58 }, // KR Market
    to: { lat: 12.9698, lng: 77.7499 }, // Whitefield
  },
  "KRM-09": {
    mode: "bus",
    from: { lat: 12.9635, lng: 77.58 }, // KR Market
    to: { lat: 12.9337, lng: 77.5136 }, // Nagarbhavi-ish
  },
  "BLR-09": {
    mode: "bus",
    from: { lat: 12.9177, lng: 77.6233 }, // Silk Board
    to: { lat: 13.0358, lng: 77.5946 }, // Hebbal
  },

  // Train / metro routes (demo uses road routing for curves)
  "MET-PURPLE": {
    mode: "train",
    from: { lat: 12.991, lng: 77.5713 },
    to: { lat: 12.9192, lng: 77.4828 },
  },
  "MET-GREEN": {
    mode: "train",
    from: { lat: 13.0236, lng: 77.5552 },
    to: { lat: 12.8451, lng: 77.567 },
  },
  "SBC-YPR": {
    mode: "train",
    from: { lat: 12.9779, lng: 77.5699 },
    to: { lat: 13.0185, lng: 77.556 },
  },

  // Extra demo train routes
  "MET-RED": {
    mode: "train",
    from: { lat: 13.0455, lng: 77.5747 }, // City Connector-ish
    to: { lat: 12.9732, lng: 77.5680 }, // City side-ish
  },
  "MET-BLUE": {
    mode: "train",
    from: { lat: 12.9450, lng: 77.5418 }, // Kengeri-ish
    to: { lat: 13.0025, lng: 77.6526 }, // Baiyappanahalli-ish
  },
};

// Simple helper to format time as HH:MM
function formatTime(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Ticket fare estimation (very simplified)
function estimateFare(distanceKm, passengers, basePerKm) {
  const base = distanceKm * basePerKm * passengers;
  return Math.max(10, Math.round(base));
}

// Simulated vehicle data (static starting points)
function createSimulatedVehicles() {
  // Buses around Electronic City / Outer Ring Road
  const buses = [
    {
      id: "BTP-12",
      name: "BTP-12 · Majestic → Electronic City",
      lat: 12.948,
      lng: 77.622,
      etaMin: 5,
      onTime: true,
    },
    {
      id: "BTP-07",
      name: "BTP-07 · Shivajinagar → Peenya",
      lat: 12.978,
      lng: 77.615,
      etaMin: 18,
      onTime: true,
    },
    {
      id: "BTP-25",
      name: "BTP-25 · Hebbal → Bannerghatta",
      lat: 13.025,
      lng: 77.585,
      etaMin: 26,
      onTime: false,
    },
    {
      id: "KRM-21",
      name: "KRM-21 · KR Market → Whitefield",
      lat: 12.985,
      lng: 77.71,
      etaMin: 14,
      onTime: false,
    },
    {
      id: "KRM-09",
      name: "KRM-09 · KR Market → Nagarbhavi",
      lat: 12.962,
      lng: 77.545,
      etaMin: 10,
      onTime: true,
    },
    {
      id: "BLR-09",
      name: "BLR-09 · Silk Board → Hebbal",
      lat: 13.03,
      lng: 77.6,
      etaMin: 9,
      onTime: true,
    },
  ];

  // Trains / Metro around KSR, Yeshwantpur, Baiyappanahalli lines
  const trains = [
    {
      id: "MET-PURPLE",
      name: "Purple Line · Towards Kengeri",
      lat: 12.98,
      lng: 77.57,
      etaMin: 3,
      onTime: true,
    },
    {
      id: "MET-GREEN",
      name: "Green Line · Towards Silk Institute",
      lat: 13.01,
      lng: 77.55,
      etaMin: 7,
      onTime: true,
    },
    {
      id: "MET-RED",
      name: "Red Line · City Connector",
      lat: 13.02,
      lng: 77.57,
      etaMin: 6,
      onTime: false,
    },
    {
      id: "MET-BLUE",
      name: "Blue Line · West Link",
      lat: 12.96,
      lng: 77.55,
      etaMin: 12,
      onTime: true,
    },
    {
      id: "SBC-YPR",
      name: "Suburban · SBC → YPR",
      lat: 13.0,
      lng: 77.58,
      etaMin: 11,
      onTime: false,
    },
  ];

  return { buses, trains };
}

// Slightly move a vehicle to simulate GPS drift along city grid
function jitterVehicle(v) {
  const deltaLat = (Math.random() - 0.5) * 0.002;
  const deltaLng = (Math.random() - 0.5) * 0.002;
  return {
    ...v,
    lat: v.lat + deltaLat,
    lng: v.lng + deltaLng,
    etaMin: Math.max(1, v.etaMin + (Math.random() - 0.5) * 2),
    onTime: Math.random() < 0.8,
  };
}

// Initialize everything after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("loginScreen");
  const appRoot = document.getElementById("appRoot");
  const loginForm = document.getElementById("loginForm");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");
  const forgotCredentialsBtn = document.getElementById("forgotCredentialsBtn");
  const recoveryModal = document.getElementById("recoveryModal");
  const recoveryForm = document.getElementById("recoveryForm");
  const recoveryInput = document.getElementById("recoveryInput");
  const recoveryResult = document.getElementById("recoveryResult");
  const closeRecoveryBtn = document.getElementById("closeRecoveryBtn");
  const openSignupBtn = document.getElementById("openSignupBtn");
  const signupModal = document.getElementById("signupModal");
  const signupForm = document.getElementById("signupForm");
  const signupUsername = document.getElementById("signupUsername");
  const signupPassword = document.getElementById("signupPassword");
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  const signupResult = document.getElementById("signupResult");
  const closeSignupBtn = document.getElementById("closeSignupBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const SESSION_KEY = "transportDashboardLoggedIn";
  const CUSTOM_USER_KEY = "transportCustomUser";

  const ROUTE_STOPS_MAP = {
  "BTP-12": ["Lalbagh", "BTM Layout", "Silk Board"],
  "KRM-21": ["Shivajinagar", "KR Puram", "ITPL"],
  "BLR-09": ["HSR Layout", "Bellandur", "Nagawara"]
};

// ✅ FIXED UI CONTROL
if (sessionStorage.getItem(SESSION_KEY) === "true") {
 if (loginScreen) loginScreen.classList.add("hidden");
  if (appRoot) appRoot.classList.remove("hidden");

} else {
  if (loginScreen) loginScreen.classList.remove("hidden");
  if (appRoot) appRoot.classList.add("hidden");
}

// ✅ Login handler
if (loginForm && loginUsername && loginPassword) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = (loginUsername.value || "").trim();
    const password = (loginPassword.value || "").trim();

    const customUser = JSON.parse(
      localStorage.getItem(CUSTOM_USER_KEY) || "null"
    );

    const isDefault = username === "admin" && password === "admin123";
    const isCustom =
      customUser &&
      username === customUser.username &&
      password === customUser.password;

    if (!isDefault && !isCustom) {
      if (loginError) loginError.classList.remove("hidden");
      return;
    }

    if (loginError) loginError.classList.add("hidden");

    sessionStorage.setItem(SESSION_KEY, "true");
    location.reload();
  });
}

// ✅ Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });
}
  // Tabs
  const busTabBtn = document.getElementById("busTabBtn");
  const trainTabBtn = document.getElementById("trainTabBtn");
  const busDashboard = document.getElementById("busDashboard");
  const trainDashboard = document.getElementById("trainDashboard");

  function activateTab(type) {
    const isBus = type === "bus";
    busTabBtn.classList.toggle("active", isBus);
    trainTabBtn.classList.toggle("active", !isBus);

    busDashboard.classList.toggle("active", isBus);
    busDashboard.classList.toggle("hidden", !isBus);
    trainDashboard.classList.toggle("active", !isBus);
    trainDashboard.classList.toggle("hidden", isBus);
  }

  busTabBtn.addEventListener("click", () => activateTab("bus"));
  trainTabBtn.addEventListener("click", () => activateTab("train"));

  // Map
  window.map = L.map("map").setView(BANGALORE_CENTER, 12.6);
  // ✅ FINAL WORKING STOPS CODE
const busRouteSelect = document.getElementById("busRoute");
const busStopsDiv = document.getElementById("busStops");

if (busRouteSelect && busStopsDiv) {
  busRouteSelect.addEventListener("change", () => {
    const selectedRoute = busRouteSelect.value;

    // 🧹 clear old markers
    stopMarkers.forEach(m => map.removeLayer(m));
    stopMarkers = [];

    if (!selectedRoute || !ROUTE_STOPS_MAP[selectedRoute]) {
      busStopsDiv.innerHTML = "";
      return;
    }

    const stops = ROUTE_STOPS_MAP[selectedRoute];

    // 📝 show text
    busStopsDiv.innerHTML = `
      <strong>Stops:</strong><br>
      ➡ ${stops[0]}<br>
      ➡ ${stops[1]}<br>
      ➡ ${stops[2]}
    `;

    // 🗺️ add markers
    const coords = ROUTE_STOP_COORDS[selectedRoute];

    if (coords) {
      coords.forEach((c, i) => {
        const marker = L.marker(c)
          .addTo(map)
          .bindPopup(`Stop ${i + 1}: ${stops[i]}`);

        stopMarkers.push(marker);
      });
    }
  });
}

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const { buses, trains } = createSimulatedVehicles();
  const busMarkers = {};
  const trainMarkers = {};

  let stopMarkers = [];

 // ✅ BUS ICON
// 🚌 BUS MARKER (BLUE)
const busIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      background:#2563eb;
      width:32px;
      height:32px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:18px;
      box-shadow:0 3px 8px rgba(0,0,0,0.4);
    ">
      🚌
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// 🚆 TRAIN MARKER (GREEN)
const trainIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      background:#16a34a;
      width:32px;
      height:32px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-size:18px;
      box-shadow:0 3px 8px rgba(0,0,0,0.4);
    ">
      🚆
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});
  buses.forEach((b) => {
    const m = L.marker([b.lat, b.lng], { icon: busIcon }).addTo(map);
    m.bindPopup(`<strong>${b.name}</strong>`);
    busMarkers[b.id] = m;
  });

  trains.forEach((t) => {
    const m = L.marker([t.lat, t.lng], { icon: trainIcon }).addTo(map);
    m.bindPopup(`<strong>${t.name}</strong>`);
    trainMarkers[t.id] = m;
  });

  const lastUpdateLabel = document.getElementById("lastUpdate");

  // Stats elements
  const busCountEl = document.getElementById("busCount");
  const busAvgEtaEl = document.getElementById("busAvgEta");
  const busOnTimeEl = document.getElementById("busOnTime");

  const trainCountEl = document.getElementById("trainCount");
  const trainAvgEtaEl = document.getElementById("trainAvgEta");
  const trainOnTimeEl = document.getElementById("trainOnTime");

  function updateStats() {
    // Bus stats
    busCountEl.textContent = buses.length.toString();
    const busAvg =
      buses.reduce((sum, b) => sum + b.etaMin, 0) / (buses.length || 1);
    busAvgEtaEl.textContent = `${Math.round(busAvg)} min`;
    const busOnTimeCount = buses.filter((b) => b.onTime).length;
    busOnTimeEl.textContent = `${busOnTimeCount}/${buses.length}`;

    // Train stats
    trainCountEl.textContent = trains.length.toString();
    const trainAvg =
      trains.reduce((sum, t) => sum + t.etaMin, 0) / (trains.length || 1);
    trainAvgEtaEl.textContent = `${Math.round(trainAvg)} min`;
    const trainOnTimeCount = trains.filter((t) => t.onTime).length;
    trainOnTimeEl.textContent = `${trainOnTimeCount}/${trains.length}`;
  }

  updateStats();
  lastUpdateLabel.textContent =
    "Live GPS simulation running. Search a vehicle ID to track it.";

  // Track-by-ID state
  let activeTrackedId = null;
  let activeRouteLine = null;
  let activeRouteTimer = null;
  let activeRouteCoords = null;
  let activeRouteIndex = 0;

  function clearRoute() {
    if (activeRouteTimer) {
      clearInterval(activeRouteTimer);
      activeRouteTimer = null;
    }
    if (activeRouteLine) {
      map.removeLayer(activeRouteLine);
      activeRouteLine = null;
    }
    activeRouteCoords = null;
    activeRouteIndex = 0;
    activeTrackedId = null;
  }

  // Search UI – track specific vehicle, hide others
  const searchInput = document.getElementById("vehicleSearchInput");
  const searchBtn = document.getElementById("vehicleSearchBtn");

  function findVehicleById(rawId) {
    const id = rawId.trim().toUpperCase();
return [...buses, ...trains].find(
  (v) => v.id.toUpperCase() === id
);
  }

  function getMarkerForVehicleId(id) {
    return busMarkers[id] || trainMarkers[id] || null;
  }

  function setFocusOpacity(vehicleId) {
    // Keep all vehicles visible, but highlight the searched one.
    const idUpper = vehicleId?.toUpperCase?.() || "";
    Object.entries(busMarkers).forEach(([vid, m]) => {
      m.setOpacity(vid.toUpperCase() === idUpper ? 1 : 0.55);
    });
    Object.entries(trainMarkers).forEach(([vid, m]) => {
      m.setOpacity(vid.toUpperCase() === idUpper ? 1 : 0.55);
    });
  }

  async function fetchRoadRouteCoords(startLatLng, end) {
    // OSRM expects lng,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${startLatLng.lng},${startLatLng.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes || !data.routes[0] || !data.routes[0].geometry) {
      return [
        [startLatLng.lat, startLatLng.lng],
        [end.lat, end.lng],
      ];
    }
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }

  async function startTracking(vehicle) {
    const id = vehicle.id.toUpperCase();
    const endpoints = ROUTE_ENDPOINTS[id];

    clearRoute();

    const marker = getMarkerForVehicleId(id);
    if (!marker) return;

    setFocusOpacity(id);
    marker.setOpacity(1);
    marker.openPopup();
    map.setView(marker.getLatLng(), 13.5, { animate: true });

    // If we don't have endpoints, just reveal marker
    if (!endpoints) {
      lastUpdateLabel.textContent = `Showing ${id} (no route endpoints) at ${formatTime(
        new Date()
      )}`;
      return;
    }

    activeTrackedId = id;
    const color = (endpoints.mode || "bus") === "bus" ? "#ff9800" : "#7c4dff";

    lastUpdateLabel.textContent = `Loading route for ${id}...`;

    let coords;
    try {
      coords = await fetchRoadRouteCoords(marker.getLatLng(), endpoints.to);
    } catch (e) {
      coords = [
        [marker.getLatLng().lat, marker.getLatLng().lng],
        [endpoints.to.lat, endpoints.to.lng],
      ];
    }

    activeRouteCoords = coords;
    activeRouteLine = L.polyline(coords, {
      color,
      weight: 4,
      opacity: 0.92,
    }).addTo(map);

    map.fitBounds(activeRouteLine.getBounds(), { padding: [40, 40] });

    activeRouteIndex = 0;
    activeRouteTimer = setInterval(() => {
      if (!activeRouteCoords || !activeTrackedId) return;
      activeRouteIndex += 1;
      if (!activeRouteCoords[activeRouteIndex]) {
        clearRoute();
        lastUpdateLabel.textContent = `Tracking finished for ${id} at ${formatTime(
          new Date()
        )}`;
        return;
      }
      marker.setLatLng(activeRouteCoords[activeRouteIndex]);
    }, 800);

    lastUpdateLabel.textContent = `Tracking ${id} along roads · started at ${formatTime(
      new Date()
    )}`;
  }

  function handleSearch() {
    const raw = searchInput.value;
    if (!raw.trim()) {
      alert("Please enter a vehicle ID (e.g. BTP-12, KRM-21, MET-GREEN).");
      return;
    }
    const vehicle = findVehicleById(raw);
    if (!vehicle) {
     const ids = [...buses, ...trains].map((v) => v.id).join(", ");
      alert(`Vehicle ID not found. Try one of: ${ids}.`);
      return;
    }
    startTracking(vehicle);
  }

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  });

  // Periodically move vehicles to simulate GPS
  setInterval(() => {
    for (let i = 0; i < buses.length; i++) {
      buses[i] = jitterVehicle(buses[i]);
      const m = busMarkers[buses[i].id];
      if (m) {
        // When tracking by ID, route animation controls that marker.
        if (activeTrackedId && buses[i].id.toUpperCase() === activeTrackedId) {
          continue;
        }
        m.setLatLng([buses[i].lat, buses[i].lng]);
        m.setPopupContent(
          `<strong>${buses[i].name}</strong><br>ETA: ${Math.round(
            buses[i].etaMin
          )} min<br>Status: ${buses[i].onTime ? "On time" : "Delayed"}`
        );
      }
    }

    for (let i = 0; i < trains.length; i++) {
      trains[i] = jitterVehicle(trains[i]);
      const m = trainMarkers[trains[i].id];
      if (m) {
        if (activeTrackedId && trains[i].id.toUpperCase() === activeTrackedId) {
          continue;
        }
        m.setLatLng([trains[i].lat, trains[i].lng]);
        m.setPopupContent(
          `<strong>${trains[i].name}</strong><br>ETA: ${Math.round(
            trains[i].etaMin
          )} min<br>Status: ${trains[i].onTime ? "On time" : "Delayed"}`
        );
      }
    }

    updateStats();
  }, 5000);

  // Ticket form handling – BUS
  const busTicketForm = document.getElementById("busTicketForm");
  const busFareEl = document.getElementById("busFare");
  const busResultEl = document.getElementById("busTicketResult");

  function recalcBusFare() {
    const passengers = parseInt(
      document.getElementById("busPassengers").value || "1",
      10
    );
    const baseDistance = 12; // pretend 12km
    const basePerKm = 4.5;
    const fare = estimateFare(baseDistance, passengers, basePerKm);
    busFareEl.textContent = `₹${fare.toFixed(2)}`;
    return fare;
  }

  busTicketForm.addEventListener("input", () => recalcBusFare());

  busTicketForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const fare = recalcBusFare();

  // ✅ SHOW FARE NOW
  if (busFareEl) busFareEl.classList.remove("hidden");

  const route = document.getElementById("busRoute").value;
  const from = document.getElementById("busFrom").value;
  const to = document.getElementById("busTo").value;
  const date = document.getElementById("busDate").value;
  const passengers = document.getElementById("busPassengers").value;
  const type = (
    document.querySelector('input[name="busType"]:checked') || {}
  ).value;

  if (!route || !from || !to || !date) {
    alert("Please fill all the bus ticket details.");
    return;
  }

  busResultEl.innerHTML = `
    <div><strong>Bus ticket booked!</strong></div>
    <div>Route: ${route} · ${from} → ${to}</div>
    <div>Date: ${date} · Passengers: ${passengers}</div>
    <div>Type: ${type}</div>
    <div>Total Fare: <strong>₹${fare.toFixed(2)}</strong></div>
  `;

  busResultEl.classList.remove("hidden");
});
  // Ticket form handling – TRAIN
  const trainTicketForm = document.getElementById("trainTicketForm");
  const trainFareEl = document.getElementById("trainFare");
  const trainResultEl = document.getElementById("trainTicketResult");

  function recalcTrainFare() {
    const passengers = parseInt(
      document.getElementById("trainPassengers").value || "1",
      10
    );
    const baseDistance = 18; // pretend 18km
    const basePerKm = 3.8;
    const fare = estimateFare(baseDistance, passengers, basePerKm);
    trainFareEl.textContent = `₹${fare.toFixed(2)}`;
    return fare;
  }

  trainTicketForm.addEventListener("input", () => recalcTrainFare());

  trainTicketForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const fare = recalcTrainFare();

  // ✅ SHOW FARE ONLY AFTER CLICK
  if (trainFareEl) trainFareEl.classList.remove("hidden");

  const line = document.getElementById("trainLine").value;
  const from = document.getElementById("trainFrom").value;
  const to = document.getElementById("trainTo").value;
  const date = document.getElementById("trainDate").value;
  const passengers = document.getElementById("trainPassengers").value;
  const classType = (
    document.querySelector('input[name="trainClass"]:checked') || {}
  ).value;

  if (!line || !from || !to || !date) {
    alert("Please fill all the train ticket details.");
    return;
  }

  trainResultEl.innerHTML = `
    <div><strong>Train ticket booked!</strong></div>
    <div>Line: ${line} · ${from} → ${to}</div>
    <div>Date: ${date} · Passengers: ${passengers}</div>
    <div>Class: ${classType}</div>
    <div>Total Fare: <strong>₹${fare.toFixed(2)}</strong></div>
  `;

  trainResultEl.classList.remove("hidden");
});

// ===== CHATBOT =====

const chatToggle = document.getElementById("chatToggle");
const chatbot = document.getElementById("chatbot");
const closeChat = document.getElementById("closeChat");
const sendChat = document.getElementById("sendChat");
const chatInput = document.getElementById("chatInput");
sendChat.addEventListener("click", sendMessage);
const chatMessages = document.getElementById("chatMessages");

let currentStep = "";
let flowType = ""; // book / fare / refund
let refundStep = "";
let refundData = { ticketId: "" };
let bookingData = {
  from: "",
  to: "",
  date: "",
  type: "",
  passengers: 1,
  ticketId: ""
};

// ===== ADD MESSAGE =====
function addMessage(sender, text, buttons = []) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;

  if (buttons.length) {
    const btnContainer = document.createElement("div");

    buttons.forEach(btn => {
      const b = document.createElement("button");
      b.innerText = btn.text;
      b.addEventListener("click", () => handleOption(btn.value));
      btnContainer.appendChild(b);
    });

    div.appendChild(btnContainer);
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== SEND MESSAGE =====
function sendMessage() {
  const msg = chatInput.value.trim();
if (!msg) return;

addMessage("You", msg);

// ✅ AFTER msg check
if (refundStep === "ticketId") {
  refundData.ticketId = msg;
  chatInput.value = "";

  refundStep = "confirm";

  addMessage(
    "Bot",
    `🧾 Ticket ID: ${refundData.ticketId}<br>Confirm refund?`,
    [
      { text: "✅ Yes", value: "refund_confirm" },
      { text: "❌ No", value: "cancel" }
    ]
  );
  return;
}

  // ✅ HANDLE DATE INPUT DIRECTLY
  if (currentStep === "date") {
  const dateValue = msg.trim();

  if (!dateValue) {
    addMessage("Bot", "⚠️ Enter valid date (YYYY-MM-DD)");
    return;
  }

  bookingData.date = dateValue;
  chatInput.value = "";

  currentStep = "passengers";

  addMessage("Bot", "👥 Enter number of passengers:");
  return;
}

if (currentStep === "passengers") {
  const count = parseInt(msg.trim(), 10);

  if (!count || count <= 0) {
    addMessage("Bot", "⚠️ Enter valid passenger count");
    return;
  }

  bookingData.passengers = count;

  // ✅ GENERATE TICKET ID
  bookingData.ticketId =
    "TKT" + Math.floor(100000 + Math.random() * 900000);

  chatInput.value = "";
  currentStep = "";

  const fare = count * 54;

  addMessage(
    "Bot",
    `🎫 Ticket Booked!<br>
     🧾 Ticket ID: <b>${bookingData.ticketId}</b><br>
     From: ${bookingData.from}<br>
     To: ${bookingData.to}<br>
     Date: ${bookingData.date}<br>
     Passengers: ${count}<br>
     Total Fare: Rs.${fare}/-`,
    [
      { text: "📄 Print Ticket", value: "print" }
    ]
  );
  return;
}

  chatInput.value = "";

  // ✅ NORMAL COMMANDS ONLY WHEN NOT IN FLOW
  if (!currentStep) {
    if (msg.toLowerCase().includes("book")) return handleOption("book");
    if (msg.toLowerCase().includes("fare")) return handleOption("fare_start");
    if (msg.toLowerCase().includes("refund")) return handleOption("refund");
    if (msg.toLowerCase().includes("help")) return handleOption("help");
  }

  addMessage("Bot", "🤖 Choose an option:", [
    { text: "Book Ticket", value: "book" },
    { text: "Check Fare", value: "fare_start" },
    { text: "Refund", value: "refund" },
    { text: "Help", value: "help" }
  ]);
}
// ===== MAIN LOGIC =====
function handleOption(value) {

  // ===== BOOK FLOW =====
  if (value === "book") {
    flowType = "book";

    bookingData = { from: "", to: "", date: "", type: "" };

    bookingData.type = busTabBtn.classList.contains("active") ? "Bus" : "Train";

    currentStep = "from";

    addMessage("Bot", "📍 Select Starting Point:", [
      { text: "MG Road", value: "MG Road" },
      { text: "Majestic", value: "Majestic" },
      { text: "Whitefield", value: "Whitefield" },
      { text: "Electronic City", value: "Electronic City" }
    ]);
    return;
  }

  // ===== FARE FLOW START =====
  if (value === "fare_start") {
    flowType = "fare";
    currentStep = "from";

    addMessage("Bot", "📍 Select Starting Point:", [
      { text: "MG Road", value: "MG Road" },
      { text: "Majestic", value: "Majestic" },
      { text: "Whitefield", value: "Whitefield" },
      { text: "Electronic City", value: "Electronic City" }
    ]);
    return;
  }

  // ===== FROM STEP =====
  if (currentStep === "from") {
    bookingData.from = value;
    currentStep = "to";

    addMessage("Bot", "📍 Select Destination:", [
      { text: "MG Road", value: "MG Road" },
      { text: "Majestic", value: "Majestic" },
      { text: "Whitefield", value: "Whitefield" },
      { text: "Electronic City", value: "Electronic City" }
    ]);
    return;
  }

  // ===== TO STEP =====
  if (currentStep === "to") {
    bookingData.to = value;

    // 👉 FARE FLOW ENDS HERE
    if (flowType === "fare") {
      const fare = 50;
      currentStep = "";

      addMessage("Bot", `💰 Fare: ₹${fare}`, [
        { text: "Book Ticket", value: "book" },
        { text: "Check Another Fare", value: "fare_start" }
      ]);
      return;
    }

    // 👉 BOOK FLOW CONTINUES
    currentStep = "date";
    addMessage("Bot", "📅 Enter Travel Date (YYYY-MM-DD):");
    return;
  }

  // ===== PRINT PDF =====
  if (value === "print") {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ✅ SAFE CALCULATION
    const passengers = bookingData?.passengers || 1;
    const fare = passengers * 54;

    doc.setFontSize(18);
    doc.text("Transport Ticket", 20, 20);

    doc.setFontSize(12);
    doc.text(`Ticket ID: ${bookingData.ticketId || ""}`, 20, 40);
    doc.text(`Type: ${bookingData.type || ""}`, 20, 50);
    doc.text(`From: ${bookingData.from || ""}`, 20, 60);
    doc.text(`To: ${bookingData.to || ""}`, 20, 70);
    doc.text(`Date: ${bookingData.date || ""}`, 20, 80);
    doc.text(`Passengers: ${passengers}`, 20, 90);

    // ✅ SAFE FARE LINE
    doc.text(`Total Fare: Rs.${fare}/-`, 20, 100);

    doc.save("ticket.pdf");

    addMessage("Bot", "📄 Ticket downloaded!");
  } catch (err) {
    console.error(err);
    addMessage("Bot", "❌ Error generating ticket");
  }

  return;
}
  // ===== REFUND =====
 if (value === "refund") {
  refundStep = "ticketId";

  addMessage("Bot", "🔄 Enter your Ticket ID:");
  return;
}

  if (value === "refund_confirm") {
  refundStep = "";

  addMessage(
    "Bot",
    `✅ Refund Successful!<br>
     💰 Amount will be credited in 3–5 working days`
  );
  return;
}

if (value === "cancel") {
  refundStep = "";
  addMessage("Bot", "❌ Refund cancelled.");
  return;
}

  // ===== HELP =====
  if (value === "help") {
    addMessage("Bot", "I can help you with:", [
      { text: "Book Ticket", value: "book" },
      { text: "Check Fare", value: "fare_start" }
    ]);
    return;
  }
}

// ===== EVENTS =====
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

chatToggle.onclick = () => chatbot.classList.toggle("hidden");
closeChat.onclick = () => chatbot.classList.add("hidden");

// ===== QUICK BUTTON FIX =====
document.querySelectorAll(".quick-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const text = btn.innerText.toLowerCase();

    if (text.includes("book")) handleOption("book");
    else if (text.includes("fare")) handleOption("fare_start");
    else if (text.includes("refund")) handleOption("refund");
    else if (text.includes("help")) handleOption("help");
  });
});
  
});