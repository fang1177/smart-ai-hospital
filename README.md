# 🏥 Smart Hospital AI — Enterprise Healthcare Platform

**Smart Hospital AI** is a state-of-the-art, full-stack hospital management ecosystem integrated with cutting-edge AI capabilities. Designed for reliability, scalability, and accessibility, the platform provides a seamless experience for Admins, Doctors, and Patients through role-specific workflows and automated medical intelligence.

---

## 🌟 Key Features

### 🔐 Advanced Role-Based Access Control (RBAC)
*   **Admins**: Full control over user management, doctor verification/approval, and hospital-wide analytics.
*   **Doctors**: Manage patient appointments, create detailed treatment courses, and upload medical records.
*   **Patients**: Book appointments, view medical history, track treatment courses, and pay bills online.

### 🤖 Intelligent AI Medical Assistant
*   **Context-Aware**: The AI understands the patient's active treatments and medical history to provide personalized (and safe) information.
*   **Two-Tier Fallback Engine**: If the primary OpenAI API is unavailable, the system automatically switches to a custom-built local intent engine to maintain core functionality.
*   **Voice Integration**: Fully integrated with **Deepgram AI** for hands-free, voice-activated interactions.

### 💳 Integrated Financial Module
*   **Automated Billing**: Invoices are generated based on hospital visits and treatments.
*   **Razorpay Integration**: Secure, real-time payment gateway for instant bill settlement.

### 📱 Modern Web Experience (PWA)
*   **Progressive Web App**: Offline support and home-screen installation via Service Workers and Web Manifest.
*   **Responsive Design**: A sleek, mobile-first UI built with high-performance Vanilla JavaScript and CSS3.

---

## 🛠️ Tech Stack

### Frontend
*   **Logic**: Modular Vanilla JavaScript (ES6+)
*   **Styling**: Custom CSS3 (Mobile-first, Responsive)
*   **Capabilities**: PWA (Service Workers), Web-Speech API

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express 5 (Latest stable)
*   **Security**: JWT (JSON Web Tokens), Bcrypt.js
*   **File Handling**: Multer (for medical records/PDFs)

### Database
*   **Provider**: MongoDB
*   **ODM**: Mongoose 9

### Cloud & APIs
*   **AI Logic**: OpenAI GPT-3.5-turbo
*   **Voice Transcription**: Deepgram SDK
*   **Payments**: Razorpay Node SDK
*   **Notifications**: Firebase Cloud Messaging (FCM)

---

## 🚀 Unique Engineering Highlights

*   **Hybrid AI Architecture**: Implemented a "failsafe" mechanism where a local NLP engine takes over if third-party AI APIs fail.
*   **Security-First Approvals**: Built a strict verification flow where Doctor accounts must be manually validated by Admins, preventing unauthorized medical activity.
*   **Real-time Reminders**: A custom background polling service (`reminderService.js`) that automatically tracks and alerts users about upcoming appointments.
*   **Modular Architecture**: The project follows a strict Controller-Service-Model pattern on the backend, ensuring the code is maintainable and testable.

---

## 🔧 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas account
*   OpenAI / Deepgram / Razorpay API keys (optional for core features)

### 1. Clone the Repository
```bash
git clone https://github.com/fang1177/smart-ai-hospital.git
cd smart-ai-hospital
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env file with the variables listed below
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend
# You can use any static server, e.g., 'serve'
npx serve .
```

---

## 📄 Environment Variables (`.env`)

| Variable | Description |
| :--- | :--- |
| `PORT` | Server Port (e.g., 5000) |
| `MONGO_URI` | MongoDB Connection String |
| `JWT_SECRET` | Secret key for auth tokens |
| `OPENAI_API_KEY` | (Optional) For AI Chat |
| `DEEPGRAM_API_KEY` | (Optional) For Voice AI |
| `RAZORPAY_KEY_ID` | (Optional) For Payments |

---

## 👨‍💻 Project Impact
This project demonstrates the ability to build a complex, production-ready system that handles sensitive data, integrates multiple third-party APIs, and provides a polished, user-centric experience. It solves real-world healthcare challenges through automation and intelligent design.
