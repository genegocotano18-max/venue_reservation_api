const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const db = new sqlite3.Database(":memory:");

db.serialize(() => {
  db.run(`CREATE TABLE venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    price REAL NOT NULL
  )`);

  db.run(`CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER,
    customer_name TEXT,
    reservation_date TEXT,
    FOREIGN KEY (venue_id) REFERENCES venues(id)
  )`);
});

// ==================== API ====================
app.get("/venues", (req, res) => {
  db.all("SELECT * FROM venues", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/venues", (req, res) => {
  const { name, location, capacity, price } = req.body;
  if (!name || !location || !capacity || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  db.run(
    `INSERT INTO venues (name, location, capacity, price) VALUES (?, ?, ?, ?)`,
    [name, location, capacity, price],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, location, capacity, price });
    }
  );
});

app.get("/reservations", (req, res) => {
  db.all(
    `SELECT r.id, r.customer_name, r.reservation_date, v.name as venue, v.price 
     FROM reservations r JOIN venues v ON r.venue_id = v.id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post("/reservations", (req, res) => {
  const { venue_id, customer_name, reservation_date } = req.body;
  if (!venue_id || !customer_name || !reservation_date) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  db.run(
    `INSERT INTO reservations (venue_id, customer_name, reservation_date) VALUES (?, ?, ?)`,
    [venue_id, customer_name, reservation_date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, venue_id, customer_name, reservation_date });
    }
  );
});

app.delete("/reservations/:id", (req, res) => {
  db.run(`DELETE FROM reservations WHERE id = ?`, req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get("/dashboard", (req, res) => {
  db.get("SELECT COUNT(*) as totalVenues FROM venues", [], (err, venueRow) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT COUNT(*) as totalReservations FROM reservations", [], (err, resRow) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get(
        `SELECT IFNULL(SUM(v.price), 0) as totalRevenue 
         FROM reservations r JOIN venues v ON r.venue_id = v.id`,
        [],
        (err, revRow) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            totalVenues: venueRow.totalVenues,
            totalReservations: resRow.totalReservations,
            totalRevenue: revRow.totalRevenue
          });
        }
      );
    });
  });
});

// ==================== UI ====================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Venue Reservation System</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      background: linear-gradient(135deg, #eef2f7, #dce3f0); 
      color: #333; 
    }
    header { 
      background: linear-gradient(90deg, #007BFF, #00c6ff); 
      color: white; 
      padding: 20px; 
      text-align: center; 
      font-size: 26px; 
      font-weight: bold; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.2); 
    }
    nav { 
      display: flex; 
      justify-content: center; 
      background: #fff; 
      padding: 15px; 
      border-bottom: 1px solid #ddd; 
      gap: 12px; 
      flex-wrap: wrap;
    }
    nav button { 
      background: #f1f3f5; 
      color: #333; 
      border: none; 
      padding: 10px 18px; 
      cursor: pointer; 
      border-radius: 25px; 
      transition: 0.3s; 
      font-size: 15px; 
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    nav button:hover, nav button.active { 
      background: #007BFF; 
      color: white; 
      transform: scale(1.05);
    }
    main {
      max-width: 1000px;
      margin: 20px auto;
      padding: 0 15px;
    }
    section { 
      display: none; 
      padding: 25px; 
      margin-top: 20px;
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 3px 8px rgba(0,0,0,0.1); 
    }
    section.active { display: block; }
    h2 { color: #007BFF; margin-top: 0; }
    input, select { 
      margin: 8px 0; 
      padding: 12px; 
      width: 100%; 
      border: 1px solid #ccc; 
      border-radius: 8px; 
      font-size: 15px; 
    }
    button.action { 
      background: #28a745; 
      color: white; 
      padding: 12px 20px; 
      border: none; 
      cursor: pointer; 
      border-radius: 25px; 
      font-size: 15px; 
      margin-top: 10px; 
      transition: 0.3s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    button.action:hover { 
      background: #218838; 
      transform: scale(1.05);
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 15px; 
      font-size: 15px; 
    }
    table th, table td { 
      border: 1px solid #ddd; 
      padding: 12px; 
      text-align: left; 
    }
    table th { 
      background: #007BFF; 
      color: white; 
    }
    .msg { 
      margin-top: 12px; 
      font-weight: bold; 
      color: #007BFF; 
    }
    .dashboard { 
      display: flex; 
      gap: 20px; 
      justify-content: space-around; 
      margin-top: 20px; 
      flex-wrap: wrap;
    }
    .card { 
      flex: 1; 
      min-width: 220px;
      background: #f9fbfd; 
      padding: 20px; 
      border-radius: 12px; 
      box-shadow: 0 3px 8px rgba(0,0,0,0.1); 
      text-align: center; 
      transition: 0.3s;
    }
    .card:hover { transform: translateY(-5px); }
    .card h3 { margin: 0; font-size: 18px; color: #007BFF; }
    .card p { font-size: 26px; margin: 10px 0 0; font-weight: bold; }
  </style>
</head>
<body>
  <header>Venue Reservation System</header>
  <nav>
    <button onclick="showSection('dashboard')" id="btnDash" class="active">Dashboard</button>
    <button onclick="showSection('addVenue')" id="btnAdd">Add Venue</button>
    <button onclick="showSection('searchVenue')" id="btnSearch">Search Venue</button>
    <button onclick="showSection('makeReservation')" id="btnReserve">Make Reservation</button>
    <button onclick="showSection('viewReservations')" id="btnView">View Reservations</button>
    <button onclick="showSection('deleteReservation')" id="btnDelete">Delete Reservation</button>
  </nav>

  <main>
    <section id="dashboard" class="active">
      <h2>Dashboard Summary</h2>
      <div class="dashboard">
        <div class="card"><h3>Total Venues</h3><p id="totalVenues">0</p></div>
        <div class="card"><h3>Total Reservations</h3><p id="totalReservations">0</p></div>
        <div class="card"><h3>Total Revenue</h3><p id="totalRevenue">₱0</p></div>
      </div>
    </section>

    <section id="addVenue">
      <h2>Add Venue</h2>
      <input id="venueName" placeholder="Venue Name">
      <input id="venueLocation" placeholder="Location">
      <input id="venueCapacity" type="number" placeholder="Capacity">
      <input id="venuePrice" type="number" placeholder="Price per Day (₱)">
      <button class="action" onclick="addVenue()">Add Venue</button>
      <p id="addVenueMsg" class="msg"></p>
    </section>

    <section id="searchVenue">
      <h2>All Venues</h2>
      <table id="searchTable">
        <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Capacity</th><th>Price (₱)</th></tr></thead>
        <tbody></tbody>
      </table>
    </section>

    <section id="makeReservation">
      <h2>Make Reservation</h2>
      <select id="venueDropdown"></select>
      <input id="customerName" placeholder="Customer Name">
      <input id="reservationDate" type="date">
      <button class="action" onclick="makeReservation()">Reserve</button>
      <p id="reservationMsg" class="msg"></p>
    </section>

    <section id="viewReservations">
      <h2>All Reservations</h2>
      <button class="action" onclick="loadReservations()">Refresh</button>
      <table id="reservationTable">
        <thead><tr><th>ID</th><th>Customer</th><th>Venue</th><th>Date</th><th>Price (₱)</th></tr></thead>
        <tbody></tbody>
      </table>
    </section>

    <section id="deleteReservation">
      <h2>Delete Reservation</h2>
      <input id="deleteResId" type="number" placeholder="Reservation ID">
      <button class="action" onclick="deleteReservation()">Delete</button>
      <p id="deleteMsg" class="msg"></p>
    </section>
  </main>

  <script>
    function highlightTab(id) {
      document.querySelectorAll("nav button").forEach(btn => btn.classList.remove("active"));
      document.getElementById(id).classList.add("active");
    }

    function showSection(id) {
      document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
      document.getElementById(id).classList.add("active");

      if (id === "makeReservation") loadVenueDropdown();
      if (id === "searchVenue") searchVenue();
      if (id === "viewReservations") loadReservations();
      if (id === "dashboard") loadDashboard();

      if (id === "dashboard") highlightTab("btnDash");
      if (id === "addVenue") highlightTab("btnAdd");
      if (id === "searchVenue") highlightTab("btnSearch");
      if (id === "makeReservation") highlightTab("btnReserve");
      if (id === "viewReservations") highlightTab("btnView");
      if (id === "deleteReservation") highlightTab("btnDelete");
    }

    async function loadDashboard() {
      const res = await fetch("/dashboard");
      const data = await res.json();
      document.getElementById("totalVenues").innerText = data.totalVenues;
      document.getElementById("totalReservations").innerText = data.totalReservations;
      document.getElementById("totalRevenue").innerText = "₱" + data.totalRevenue;
    }

    async function addVenue() {
      const name = document.getElementById("venueName").value;
      const location = document.getElementById("venueLocation").value;
      const capacity = document.getElementById("venueCapacity").value;
      const price = document.getElementById("venuePrice").value;

      const res = await fetch("/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location, capacity, price })
      });

      const data = await res.json();
      document.getElementById("addVenueMsg").innerText = data.error || "✅ Venue Added!";

      if (!data.error) {
        searchVenue();
        loadVenueDropdown();
        loadDashboard();
      }
    }

    async function searchVenue() {
      const res = await fetch("/venues");
      const venues = await res.json();
      const tbody = document.querySelector("#searchTable tbody");
      tbody.innerHTML = "";
      venues.forEach(v => {
        const row = \`<tr><td>\${v.id}</td><td>\${v.name}</td><td>\${v.location}</td><td>\${v.capacity}</td><td>₱\${v.price}</td></tr>\`;
        tbody.innerHTML += row;
      });
    }

    async function loadVenueDropdown() {
      const res = await fetch("/venues");
      const venues = await res.json();
      const dropdown = document.getElementById("venueDropdown");
      dropdown.innerHTML = "";
      venues.forEach(v => {
        const option = document.createElement("option");
        option.value = v.id;
        option.textContent = \`\${v.name} - \${v.location} (Cap: \${v.capacity}, ₱\${v.price}/day)\`;
        dropdown.appendChild(option);
      });
    }

    async function makeReservation() {
      const venue_id = document.getElementById("venueDropdown").value;
      const customer_name = document.getElementById("customerName").value;
      const reservation_date = document.getElementById("reservationDate").value;
      const res = await fetch("/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue_id, customer_name, reservation_date })
      });
      const data = await res.json();
      document.getElementById("reservationMsg").innerText = data.error || "✅ Reservation Added!";
      if (!data.error) loadDashboard();
    }

    async function loadReservations() {
      const res = await fetch("/reservations");
      const reservations = await res.json();
      const tbody = document.querySelector("#reservationTable tbody");
      tbody.innerHTML = "";
      reservations.forEach(r => {
        const row = \`<tr><td>\${r.id}</td><td>\${r.customer_name}</td><td>\${r.venue}</td><td>\${r.reservation_date}</td><td>₱\${r.price}</td></tr>\`;
        tbody.innerHTML += row;
      });
    }

    async function deleteReservation() {
      const id = document.getElementById("deleteResId").value;
      const res = await fetch("/reservations/" + id, { method: "DELETE" });
      const data = await res.json();
      document.getElementById("deleteMsg").innerText = data.error || (data.deleted ? "🗑️ Reservation Deleted!" : "❌ Not found");
      if (data.deleted) loadDashboard();
    }

    loadDashboard();
  </script>
</body>
</html>
  `);
});

// ==================== Start ====================
app.listen(port, () => {
  console.log(`✅ Venue Reservation System running at http://localhost:${port}`);
});
