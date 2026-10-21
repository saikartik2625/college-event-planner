# 🎓 Basee — AI-Powered Campus Event Planner & Management System

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%203.5%20Flash--Lite-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Basee** is a full-stack, enterprise-grade campus event planning and discovery platform designed for universities and student organizations. Powered by **Google Gemini LLM** for intelligent event generation and real-time recommendations, **Google OAuth 2.0 with 2-Factor Gmail OTP validation**, and **Socket.io** for real-time announcements.

---

## 🌟 Key Features

### 🤖 Generative AI & Recommendation Engine
- **Automated Event Copywriting**: Organizers generate engaging, multi-sentence event descriptions tailored to category and target tags powered by **Google Gemini 3.5 Flash-Lite**.
- **Intelligent Schedule Optimizer**: AI analyzes event titles and categories to recommend optimal date and time slots that maximize student turnout.
- **Semantic Interest-Based Recommendations**: Students receive personalized event recommendations matched to their selected campus interests via JSON structured output.
- **Conversational Campus Assistant**: Real-time event chatbot that parses upcoming schedules, venues, and dates to answer student queries in natural language.
- **Zero-Downtime Fault Tolerance**: Built-in fallback heuristics ensure all recommendation and scheduling features remain functional even during external API downtime.

### 🔐 Security & Identity Management
- **Google Sign-In**: Integrated with Google Identity Services (OAuth 2.0).
- **Two-Factor Gmail OTP Verification**: Automatically generates a 6-digit cryptographic OTP dispatched to the student's Gmail via **Nodemailer** with a 5-minute MongoDB TTL auto-expiry index.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `student` attendees and `admin` campus organizers.
- **JWT Authentication**: Encrypted session management using `jsonwebtoken` and `bcryptjs` password hashing.

### 📅 Event Management & Real-Time Engagement
- **Full Event Lifecycle**: Create, browse, search, categorize, and register for campus events.
- **WebSocket Announcements**: Live notifications powered by **Socket.io** for registrations, event reminders, and updates.
- **Automated Cron Jobs**: Background scheduling using `node-cron` to dispatch morning reminder alerts 24 hours prior to scheduled events.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, Axios, React Router v7 |
| **Backend** | Node.js, Express.js, Socket.io, Mongoose ODM, Google Auth Library |
| **Artificial Intelligence** | Google Gemini 3.5 Flash-Lite (Google AI Studio API) |
| **Authentication & Mail** | Google OAuth 2.0, Nodemailer (Gmail SMTP), JWT, Bcrypt |
| **Database** | MongoDB Atlas (Cloud Database with TTL indexing) |
| **Deployment** | Single-Service Monorepo Architecture on Render / Vercel |

---

## 📂 Project Architecture

```text
Basee/
├── client/                     # Frontend React (Vite) Application
│   ├── src/
│   │   ├── api/                # Axios API service endpoints
│   │   ├── components/         # Reusable UI (ChatBot, GoogleSignInButton, Nav)
│   │   ├── context/            # Global Auth & Notification state
│   │   └── pages/              # Views (Home, Events, Dashboard, Login, Signup)
│   └── vite.config.js          # Vite config & API proxying
├── server/                     # Backend Express.js Server
│   ├── middleware/             # JWT auth & route protection
│   ├── models/                 # Mongoose Schemas (User, Event, Registration, OTP)
│   ├── routes/                 # API Routes (auth, events, ai, dashboard, notifications)
│   ├── services/               # Gemini AI & Nodemailer mail dispatchers
│   └── index.js                # Express & Socket.io server entry point
├── .env.example                # Environment variable template
├── package.json                # Monorepo orchestration scripts
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI
- [Google AI Studio](https://aistudio.google.com/apikey) API Key (Free)
- [Google Cloud Console](https://console.cloud.google.com/) OAuth 2.0 Client ID

### 2. Clone the Repository
```bash
git clone https://github.com/saikartik2625/college-event-planner.git
cd college-event-planner
```

### 3. Install Dependencies
```bash
npm run install-all
```

### 4. Configure Environment Variables
Create a `.env` file in the project root directory:

```env
PORT=5001
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key
AI_MODEL=gemini-3.5-flash-lite
CLIENT_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_16_character_app_password
```

### 5. Run the Application
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001](http://localhost:5001)

---

## 🔑 Environment Variables Reference

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | 64-character encryption secret for JWT session tokens |
| `GEMINI_API_KEY` | Google AI Studio key for Gemini 3.5 Flash-Lite LLM |
| `AI_MODEL` | Active LLM model name (`gemini-3.5-flash-lite`) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Web Client ID from Google Cloud Console |
| `EMAIL_USER` | Gmail address for sending OTP verification codes |
| `EMAIL_PASS` | 16-character Google App Password (SMTP authentication) |
| `PORT` | Backend server port (Default: `5001`) |

---

## 🌐 Production Deployment (Render)

This repository is optimized for **Single-Service Monorepo Deployment**:

1. Fork or push this repository to GitHub.
2. Sign in to [Render.com](https://render.com) and create a **New Web Service**.
3. Select your repository and specify:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add your environment variables in the Render settings.
5. In [Google Cloud Console](https://console.cloud.google.com/auth/clients), add your live Render URL (`https://your-app.onrender.com`) to **Authorized JavaScript origins**.

---

## 👨‍💻 Author

**Sai Kartik**  
- GitHub: [@saikartik2625](https://github.com/saikartik2625)
- Email: [saikartik2005@gmail.com](mailto:saikartik2005@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
