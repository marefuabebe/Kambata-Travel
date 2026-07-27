# 🌍 Kambaata Travel

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Node](https://img.shields.io/badge/Node.js-18.x-success)
![Next](https://img.shields.io/badge/Next.js-14.x-black)

**Kambaata Travel** is a modern, full-stack travel and tourism web application specifically tailored to promote cultural exploration and destination discovery in the **Kambaata region of Ethiopia**. 

The platform connects eager travelers (Explorers) with verified local experts (Guides) to book authentic cultural experiences, tours, and bespoke itineraries while empowering regional tourism.

---

## ✨ Key Features

### 🧭 For Explorers (Tourists)
* **Discover Destinations:** Browse high-quality images and detailed descriptions of heritage sites (e.g., Mount Hambaricho, Ajora Falls).
* **Book Tours:** Schedule seamless tours, select custom packages, and choose local guides.
* **Smart Recommendations:** Get AI-driven recommendations powered by Gemini based on your travel interests.
* **Wallet & Payments:** Built-in Chapa integration for secure local payments, refunds, and wallet top-ups.
* **Dashboard:** Manage bookings, view past trips, and leave reviews for guides.

### 🗺️ For Guides (Local Experts)
* **Guide Dashboard:** Set availability, view upcoming bookings, and manage schedules via a robust calendar interface.
* **Earnings & Wallet:** Track booking payouts and withdraw funds securely.
* **QR Check-in:** Scan QR codes on explorer tickets to quickly verify booking attendance.
* **Messaging:** Built-in real-time chat to communicate directly with assigned explorers.

### 🛡️ For Administrators (Admin Portal)
* **Oversight & Management:** Complete moderation of users, guides, bookings, and tours.
* **Analytics Dashboard:** Revenue charts, booking statistics, and user growth metrics.
* **Content Management:** Create and edit tour descriptions, upload gallery images, and curate home page highlights.
* **Support System:** Respond to user queries, handle incident reports, and manage refunds.

---

## 🏗️ Technology Stack

This project is built using a modern, scalable full-stack JavaScript architecture:

* **Frontend (Main App):** [Next.js 14](https://nextjs.org/) (App Router), React, CSS Modules
* **Admin Portal:** Next.js 14, Tailwind CSS, Recharts (for Analytics)
* **Backend:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
* **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose ORM)
* **Authentication:** JWT (JSON Web Tokens), bcrypt
* **Storage:** Cloudinary (for image & gallery asset management)
* **Payments:** Chapa API (Ethiopian Payment Gateway)
* **AI Integration:** Google Gemini API (for smart itinerary recommendations)
* **Real-time:** Socket.io (for live chat messaging)

---

## 📂 Project Structure

```text
Kambata-Travel/
├── frontend/           # The main Next.js web application for Explorers & Guides
│   ├── src/app/        # App Router pages (Home, Login, Guide Dashboard, etc.)
│   ├── src/components/ # Reusable UI components
│   └── src/context/    # React Context providers (AuthContext, SocketContext)
├── admin-portal/       # A separate Next.js application for Admin management
│   ├── src/app/        # Admin routes (Dashboard, Tours, Users, Analytics)
│   └── src/components/ # Admin-specific UI components
└── server/             # Express.js REST API backend
    ├── controllers/    # API request handlers
    ├── models/         # Mongoose database schemas
    ├── routes/         # Express route definitions
    └── utils/          # Helper functions (Gemini, Email, Sockets)
```

---

## 🚀 Local Development Setup

To run this project locally, you will need to set up three separate terminal instances (one for the backend, one for the frontend, and one for the admin portal).

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or MongoDB Atlas cluster)
* API Keys for **Cloudinary**, **Chapa**, and **Gemini** (optional for basic functionality, but required for full features).

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# Other secrets (Chapa, Cloudinary, Gemini) go here
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env.local` file inside the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```
Start the frontend:
```bash
npm run dev
```
*(The frontend will run on http://localhost:3000)*

### 4. Admin Portal Setup
```bash
cd admin-portal
npm install
```
Create a `.env.local` file inside the `admin-portal/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
Start the admin portal:
```bash
npm run dev
```
*(The admin portal will run on http://localhost:3001)*

---

## 🤝 Contributing

Contributions are welcome! If you would like to help improve Kambaata Travel:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
