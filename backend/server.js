const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const recordRoutes = require('./routes/recordRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const billRoutes = require('./routes/billRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const bedRoutes = require('./routes/bedRoutes');
const auditRoutes = require('./routes/auditRoutes');
const { startReminderService } = require('./services/reminderService');

const app = express();

// Connect to MongoDB
if (process.env.VERCEL !== '1') {
  connectDB().then(() => {
    startReminderService();
  });
}

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection in serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err);
    res.status(500).json({ success: false, message: 'Database connection error' });
  }
});

// ── Serve static files ────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/audit', auditRoutes);
// ── Root / Status ─────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    status: '✅ SmartHospital API v1.0 Running',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/auth',
      '/api/doctors',
      '/api/patients',
      '/api/appointments',
      '/api/records',
      '/api/notifications',
      '/api/bills',
      '/api/emergencies',
      '/api/beds',
      '/api/audit',
    ],
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err.stack || err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
// In serverless environments (like Vercel), the app is exported as a handler.
// In container or VM environments (like Render, Railway, local), it listens on PORT.
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;