🏨 Venue Reservation API + UI
A simple Node.js + Express project for managing venues and reservations. It includes a REST API backend and a user-friendly UI (HTML, CSS, JS) to interact with the API.
🚀 Features
•	Add new venues with name, location, capacity, and price per day.
•	Search and view all venues instantly after adding.
•	Make reservations by selecting a venue from a dropdown (no need to type IDs).
•	Modern UI with clean navigation tabs (Add Venue, Search Venue, Make Reservation).
•	Fully responsive and styled with CSS for better balance and readability.
🛠️ Tech Stack
•	Backend: Node.js, Express
•	Frontend: HTML, CSS, JavaScript
•	Middleware: CORS, Body Parser
•	Storage: In-memory (can be upgraded to MySQL/MongoDB)
📂 Project Structure
venue-reservation/
│── index.js          # Main server + API routes + UI
│── package.json      # Dependencies & scripts
│── .gitignore        # Ignore unnecessary files
│── docs/             # Documentation folder
│    └── README.md    # Project documentation
🔧 Installation & Setup
1.	Clone this repository:
   git clone https://github.com/your-username/venue-reservation.git
   cd venue-reservation
2.	Install dependencies:
   npm install
3.	Start the server:
   node index.js
4.	Open the UI in your browser:
   http://localhost:3000
📌 API Endpoints
Venues
•	GET /venues → Get all venues
•	POST /venues → Add a new venue
Reservations
•	GET /reservations → Get all reservations
•	POST /reservations → Make a reservation
🎨 UI Sections
•	Add Venue → Add new venues with price per day.
•	Search Venue → Auto-updating table showing all venues.
•	Make Reservation → Choose a venue from a dropdown and reserve it.
📝 Future Improvements
•	Database integration (MySQL / MongoDB).
•	User authentication (login/register).
•	Date range for reservations.
•	Admin dashboard for venue management.
📄 License
This project is licensed under the MIT License – feel free to use and modify it.
