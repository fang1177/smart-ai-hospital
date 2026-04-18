# Smart Hospital AI

Welcome to the Smart Hospital AI platform repository. 

This is a comprehensive hospital management and AI assistant platform. It includes both a functional frontend designed for modern healthcare aesthetics and a powerful backend supporting AI interactions, role-based access control, billing, patient records, and real-time reminders.

## Project Structure

- **`/frontend`**: The frontend static assets and UI pages (HTML, CSS, JS). Features a dynamic, modern dashboard with interactive features.
- **`/backend`**: The Node.js/Express backend server. Handles database connections, AI logic, routes, and more.

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed and running

### Running the Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *(or use `node server.js` / `npx nodemon server.js`)*

### Running the Frontend
The frontend can be served using any static file server.
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Serve the directory (e.g., using `serve`):
   ```bash
   npx serve . -p 3000
   ```
3. Open your browser and go to `http://localhost:3000`.

## Features
- **AI Medical Assistant**: Smart AI capabilities configured with professional boundaries.
- **Admin Dashboard**: Patient and doctor management interfaces.
- **Role-Based Access Control**: Secure logins for admins, doctors, and patients.
- **Real-Time Notifications**: Instant updates and reminders.
- **Interactive UI**: High-end modern UI designed for the healthcare space.
