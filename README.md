# 🌍 Kambaata Travel

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-green.svg)
![Node](https://img.shields.io/badge/Node.js-18.x-success)
![Next](https://img.shields.io/badge/Next.js-14.x-black)
![Telegram](https://img.shields.io/badge/Telegram-Mini_App_%26_Bot-2CA5E0?logo=telegram&logoColor=white)
![Google OAuth](https://img.shields.io/badge/Google-OAuth_2.0-4285F4?logo=google&logoColor=white)

**Kambaata Travel** is a modern, full-stack travel and tourism platform designed to promote cultural exploration and destination discovery in the **Kambaata region of Ethiopia**. 

The platform connects travelers (**Explorers**) with verified local experts (**Guides**) to book authentic cultural experiences, heritage tours, and bespoke itineraries while empowering regional tourism. It features a complete Web application, an Administrative Portal, and a native **Telegram Mini App & Bot** with unified authentication.

---

## ✨ Key Features

### 🧭 For Explorers (Tourists)
* **Discover Destinations:** Browse high-resolution imagery and rich histories of heritage sites (Mount Hambaricho, Ajora Falls, Gamosha Hot Springs, and more).
* **Book Tours & Packages:** Schedule bespoke single-day and multi-day packages with verified local guides.
* **Smart Recommendations:** AI-driven travel suggestions powered by Google Gemini tailored to your interests.
* **Wallet & Payments:** Secure payments, refunds, and wallet top-ups powered by Chapa.
* **Explorer Dashboard:** Track active bookings, review trip histories, and rate local guides.

### 🗺️ For Guides (Local Experts)
* **Guide Dashboard:** Set availability, manage daily schedules, and view upcoming tours via an interactive calendar.
* **Earnings & Payouts:** Track booking revenue, platform tips, and withdraw funds securely.
* **QR Ticket Verification:** Built-in QR scanner to validate explorer tickets instantly at tour departure.
* **Real-time Messaging:** Direct chat with assigned travelers before and during tours.

### 🤖 Telegram Bot & Mini App Integration
* **Official Telegram Bot:** Quick access via `@KambataTravelBot` with persistent navigation commands (`/start`, `/explore`, `/tours`, `/bookings`, `/account`).
* **Full-featured Mini App:** Native in-app browsing experience inside Telegram with dedicated responsive pages (`/telegram/explore`, `/telegram/tours`, `/telegram/bookings`, `/telegram/account`).
* **Dual-Role Onboarding:** Direct role selection (Explorer vs. Local Guide) directly from Telegram.
* **Instant Push Notifications:** Automated Telegram alerts for booking confirmations, payment completions, and upcoming tour reminders.
* **Cryptographic Verification:** Validates Telegram `initData` using HMAC-SHA256 signature checks on the backend for zero-trust security.

### 🔐 Unified Authentication & Account Linking
* **Google OAuth 2.0 Integration:** 1-tap sign-in with Google on both the web platform and Telegram Mini App.
* **Secure Telegram Handoff:** Authenticate with Google in an external browser and return securely to Telegram via single-use, short-lived handoff tokens (no sensitive credentials ever exposed in URLs).
* **Smart Account Merging:** Seamlessly links Google, Telegram (`telegramId`), and Email/Password credentials to a single user profile without duplicate accounts.
* **Context-Aware Error Handling:** Smart sign-in assistance directing users to their original authentication provider (Google, Telegram, or Password) with zero cryptic crashes.

### 🛡️ For Administrators (Admin Portal)
* **Platform Oversight:** Full moderation of travelers, guides, tour operators, and bookings.
* **Analytics Dashboard:** Revenue charts, regional booking statistics, and user growth trends.
* **Curated Content:** Create and update tour itineraries, manage media galleries, and highlight regional attractions.
* **Support & Dispute Center:** Resolve traveler inquiries, issue refunds, and process incident reports.

---

## 🏗️ Technology Stack

* **Frontend (Main Web & Mini App):** [Next.js 14](https://nextjs.org/) (App Router), React, CSS Modules, Telegram WebApp SDK
* **Admin Portal:** Next.js 14, Tailwind CSS, Recharts
* **Backend:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
* **Database:** [MongoDB](https://www.mongodb.com/) (Mongoose ORM)
* **Authentication:** JWT (JSON Web Tokens), Google OAuth 2.0, Telegram HMAC-SHA256, bcrypt
* **Storage:** Cloudinary (media and image asset delivery)
* **Payments:** Chapa API (Ethiopian payment gateway)
* **Bot & Messaging:** Telegram Bot API (`node-telegram-bot-api`), Socket.io (live web chat)
* **AI Integration:** Google Gemini API (itinerary recommendations)

---

## 📂 Project Structure

```text
Kambata-Travel/
├── frontend/                 # Next.js web application & Telegram Mini App
│   ├── src/app/
│   │   ├── auth/             # Authentication & Google Telegram handoff routes
│   │   ├── telegram/         # Dedicated Telegram Mini App pages & layouts
│   │   ├── explorer/         # Explorer portal & bookings
│   │   └── guide/            # Local guide dashboard & verification
│   ├── src/components/       # Shared UI components & navigation
│   └── src/hooks/            # useTelegramAuth & client hooks
├── admin-portal/             # Dedicated Next.js portal for administrators
│   ├── src/app/              # Admin dashboard, bookings, guides, analytics
│   └── src/components/       # Data tables, analytics charts, modals
└── server/                   # Express.js REST API & Telegram webhook backend
    ├── controllers/          # API & webhook controllers (telegramController, authController, etc.)
    ├── middleware/           # JWT, role authorization, and sanitized error handling
    ├── models/               # Mongoose schemas (User, Tour, Booking, Guide, etc.)
    ├── routes/               # Express endpoints (authRoutes, telegramRoutes, etc.)
    ├── services/             # Telegram bot, notification, and invoice services
    └── utils/                # Security helpers, Google OAuth, and email handlers
```

---

## 🚀 Local Development Setup

To run the complete platform locally, configure and start the backend, frontend, and admin portal.

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or MongoDB Atlas)
* **Telegram Bot Token** (from [@BotFather](https://t.me/BotFather))
* **Google Cloud Console Credentials** (OAuth 2.0 Client ID & Secret)
* API keys for **Cloudinary** and **Chapa** (optional for basic features)

---

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Telegram Integration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=KambataTravelBot
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# External Services
CHAPA_SECRET_KEY=your_chapa_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:
```bash
npm run dev
```

---

### 3. Frontend Setup (Web & Telegram Mini App)
```bash
cd frontend
npm install
```

Create a `.env.local` file inside `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=KambataTravelBot
```

Start the frontend:
```bash
npm run dev
```
*(Runs on `http://localhost:3000` — Mini App runs at `/telegram`)*

---

### 4. Admin Portal Setup
```bash
cd admin-portal
npm install
```

Create a `.env.local` file inside `admin-portal/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the admin portal:
```bash
npm run dev
```
*(Runs on `http://localhost:3001`)*

---

## 📱 Telegram Bot Configuration (BotFather)

To connect your deployed frontend to the Telegram Bot:
1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Select `/mybots` → Choose your bot.
3. Go to **Bot Settings** → **Menu Button** → **Configure menu button**.
4. Set the URL to your deployed frontend Mini App URL:
   ```text
   https://kambata-travel.vercel.app/telegram
   ```
5. Configure the bot domain for WebApp login:
   ```text
   /setdomain -> kambata-travel.vercel.app
   ```

---

## 🤝 Contributing

Contributions are welcome! If you would like to help improve Kambaata Travel:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
