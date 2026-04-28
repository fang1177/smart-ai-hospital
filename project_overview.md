# 🏥 Smart Hospital AI — Project Overview

## What Is It?

**Smart Hospital AI** is a full-stack hospital management platform with an integrated AI medical assistant. It provides role-based dashboards for **Admins**, **Doctors**, and **Patients**, handling everything from appointment booking to AI-powered chat, medical records, billing, and real-time notifications.

---

## 📁 Repository Structure

```
smart-hospital-ai/
├── frontend/               # Static HTML/CSS/JS frontend (SPA-like)
│   ├── index.html          # Landing/marketing page
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service Worker (PWA offline support)
│   ├── assets/
│   │   ├── css/style.css   # Single global stylesheet (~54 KB)
│   │   ├── js/             # JS modules per feature
│   │   └── images/         # Medical imagery & assets
│   └── pages/              # 10 HTML pages (see below)
│
├── backend/                # Node.js + Express API server
│   ├── server.js           # Entry point
│   ├── config/db.js        # MongoDB connection
│   ├── models/             # 8 Mongoose models
│   ├── controllers/        # 10 controllers (business logic)
│   ├── routes/             # 10 route files
│   ├── middleware/         # Auth + file upload
│   ├── services/           # AI, reminders, FCM push
│   ├── utils/              # Response helpers
│   ├── seed.js             # DB seeder script
│   └── .env                # Environment config
│
└── vercel.json             # Vercel deployment config
```

---

## 🖥️ Frontend Pages

| Page | File | Purpose |
|---|---|---|
| Landing | `index.html` | Marketing entry point |
| Login / Register | `login.html` | Auth flow for all roles |
| Dashboard | `dashboard.html` | Role-specific home view |
| Appointments | `appointments.html` | Book, view, confirm appointments |
| Patients | `patients.html` | Patient directory (admin/doctor) |
| Doctors | `doctors.html` | Doctor directory |
| Records | `records.html` | Medical records & file uploads |
| Billing | `billing.html` | Invoice creation & payment |
| Analytics | `analytics.html` | Charts & statistics |
| Users | `users.html` | User management (admin only) |
| Voice AI | `voice.html` | Voice-activated AI assistant (Deepgram) |

### Frontend JS Modules

| File | Responsibility |
|---|---|
| `api.js` | Central HTTP client — all fetch calls go here |
| `auth.js` | Login, register, JWT storage, role routing |
| `dashboard.js` | Dashboard stats, pending doctor approvals |
| `appointments.js` | Appointment CRUD & status management |
| `billing.js` | Invoice generation, Razorpay integration |
| `records.js` | File upload & medical record display |
| `patients.js` | Patient listing & management |
| `doctors.js` | Doctor directory & specialty filters |
| `ai.js` | Chat UI for the AI assistant |
| `ui.js` | Shared UI utilities, modals, toasts, nav |

---

## ⚙️ Backend Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| File Uploads | Multer |
| Payments | Razorpay SDK |
| AI Chat | OpenAI GPT-3.5-turbo (with keyword fallback) |
| Voice | Deepgram SDK |
| Push Notifications | FCM (Firebase Cloud Messaging) |
| Dev Server | Nodemon |

### API Routes

| Base Path | Controller | Description |
|---|---|---|
| `/api/auth` | `authController` | Register, login, JWT issue |
| `/api/doctors` | `doctorController` | Doctor profiles & CRUD |
| `/api/patients` | `patientController` | Patient profiles & CRUD |
| `/api/appointments` | `appointmentController` | Book, confirm, cancel appointments |
| `/api/records` | `recordController` | Upload & retrieve medical records |
| `/api/bills` | `billController` | Invoice generation & Razorpay |
| `/api/notifications` | `notificationController` | Notification feed |
| `/api/ai` | `aiController` | AI chat endpoint |
| `/api/admin` | `adminController` | Admin-only: approve doctors, manage users |
| `/api/treatments` | `treatmentController` | Treatment course management |

### Mongoose Models (8)

| Model | Key Fields |
|---|---|
| `User` | name, email, password (hashed), role (`admin`/`doctor`/`patient`), isApproved, fcmToken |
| `Doctor` | specialty, qualifications, userId ref |
| `Patient` | DOB, blood group, userId ref |
| `Appointment` | patientId, doctorId, date, time, status, reason |
| `Record` | patientId, doctorId, type, fileUrl, notes |
| `Bill` | patientId, items[], total, status, razorpayOrderId |
| `Notification` | userId, message, isRead, type |
| `TreatmentCourse` | patientId, doctorId, medicines[], diagnosis, instructions, diet, lifestyle, status |

---

## 🔐 Authentication & Role-Based Access

```
3 Roles: admin | doctor | patient
```

- **JWT** tokens stored in `localStorage` as `sh_token`
- **Doctor registration requires admin approval** (`isApproved` flag on User model)
- **Admin cannot be self-registered** — protected at backend
- All protected routes pass through `authMiddleware.js` which verifies JWT and attaches `req.user`

### Auth Flow
```
Register → (if doctor) → Pending Admin Approval → Admin approves → Login allowed
Register → (if patient) → Immediate access
```

---

## 🤖 AI Medical Assistant

Implemented in `services/aiService.js` with **two-tier fallback**:

1. **OpenAI GPT-3.5-turbo** (if `OPENAI_API_KEY` is configured)
   - Custom system prompt enforcing medical professional boundaries
   - Context-aware: knows user role + active treatment courses
2. **Local Keyword Intent Engine** (fallback — works with no API key)
   - Detects 5 intents: `BOOK_APPOINTMENT`, `CHECK_RECORDS`, `FIND_DOCTOR`, `SYMPTOM_ADVICE`, `MY_APPOINTMENTS`
   - Returns guided responses + redirect actions

> [!IMPORTANT]
> The AI is **explicitly hardcoded to refuse prescribing medication or diagnoses** if the patient has no active treatment course in the system.

---

## 💊 Treatment Courses

A `TreatmentCourse` is created by a doctor for a patient post-appointment and includes:
- `medicines[]` — name, dosage, frequency, timing, notes
- `diagnosis`, `instructions`, `dietAdvice`, `lifestyleNotes`
- `startDate` / `endDate` / `followUpDate`
- `status`: `active | completed | cancelled`

The AI reads active treatment courses from context to give personalized responses.

---

## 💳 Billing & Payments

- Bills are created with line items and totals
- **Razorpay** is integrated for payment processing (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`)
- Bill statuses: `pending | paid | cancelled`

---

## 🔔 Notifications & Reminders

- **`reminderService.js`** — background polling service started on server boot; sends appointment reminders
- **`fcmService.js`** — Firebase Cloud Messaging for push notifications
- **Notification model** — stores in-app notifications per user, with `isRead` tracking

---

## 🎙️ Voice AI (Deepgram)

- `voice.html` + Deepgram SDK (`@deepgram/sdk`)
- Allows voice-activated interactions with the AI assistant
- Requires `DEEPGRAM_API_KEY` in `.env`

---

## 🚀 Deployment

### Local Development

```bash
# Backend (port 5000)
cd backend && npm install && npx nodemon server.js

# Frontend (port 3000)
cd frontend && npx serve . -p 3000
```

### Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `OPENAI_API_KEY` | GPT-3.5-turbo for AI chat |
| `DEEPGRAM_API_KEY` | Voice transcription |
| `RAZORPAY_KEY_ID` | Payment gateway (public) |
| `RAZORPAY_KEY_SECRET` | Payment gateway (secret) |

### Vercel (Production)

- `vercel.json` routes `/api/*` → `backend/server.js` (Node serverless)
- All other paths → `frontend/**` (static)
- PWA-ready with `manifest.json` + `sw.js` service worker

---

## 🗂️ Data Seeding

`backend/seed.js` (~10 KB) populates the database with sample data for development/testing.

---

## 📊 Feature Summary

| Feature | Status |
|---|---|
| Role-based auth (Admin/Doctor/Patient) | ✅ |
| Admin approval workflow for doctors | ✅ |
| Appointment booking & management | ✅ |
| Medical records with file upload (Multer) | ✅ |
| AI chat assistant (OpenAI + fallback) | ✅ |
| Voice AI (Deepgram) | ✅ |
| Treatment course management | ✅ |
| Billing & Razorpay payments | ✅ |
| Real-time notifications (FCM + in-app) | ✅ |
| Analytics dashboard | ✅ |
| PWA (manifest + service worker) | ✅ |
| Vercel deployment config | ✅ |
| Mobile responsive CSS | ✅ |
