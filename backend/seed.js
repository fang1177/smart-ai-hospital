/**
 * seed.js — Seed demo data for SmartHospital
 * Run:  node seed.js
 *
 * Creates:
 *   • 1 Admin
 *   • 5 Doctors (Cardiology, Neurology, Pediatrics, Orthopedics, Dermatology)
 *   • 3 Patients
 *   • 5 Sample Appointments (mix of statuses)
 *   • Welcome notifications for each user
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User        = require('./models/User');
const Doctor      = require('./models/Doctor');
const Patient     = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Notification= require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smarthospital';
const PASSWORD  = 'password123';

/* ── Helper ──────────────────────────────────────────────────────────────── */
async function createUser(name, email, role, isApproved = true) {
  const user = new User({ name, email, password: PASSWORD, role, isApproved });
  await user.save(); // triggers bcrypt pre-save hook
  return user;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/* ── Seed Data ───────────────────────────────────────────────────────────── */
const doctorsSeed = [
  {
    name: 'Dr. Priya Sharma',   email: 'priya@hospital.com',
    specialization: 'Cardiology',   experience: 12,
    bio: 'Senior cardiologist with expertise in interventional cardiology and heart failure.',
    consultationFee: 800, rating: 4.8,
    availability: [
      { day: 'Monday',    slots: ['09:00','10:00','11:00'] },
      { day: 'Wednesday', slots: ['14:00','15:00','16:00'] },
      { day: 'Friday',    slots: ['09:00','10:00'] },
    ],
  },
  {
    name: 'Dr. Rahul Mehta',    email: 'rahul@hospital.com',
    specialization: 'Neurology',    experience: 9,
    bio: 'Specialist in stroke, epilepsy, and movement disorders with 9 years of experience.',
    consultationFee: 700, rating: 4.6,
    availability: [
      { day: 'Tuesday',  slots: ['10:00','11:00','12:00'] },
      { day: 'Thursday', slots: ['15:00','16:00','17:00'] },
    ],
  },
  {
    name: 'Dr. Ananya Singh',   email: 'ananya@hospital.com',
    specialization: 'Pediatrics',   experience: 7,
    bio: 'Dedicated pediatrician focused on child development, immunization, and adolescent health.',
    consultationFee: 600, rating: 4.9,
    availability: [
      { day: 'Monday',  slots: ['14:00','15:00','16:00'] },
      { day: 'Friday',  slots: ['09:00','10:00','11:00'] },
    ],
  },
  {
    name: 'Dr. Vikram Patel',   email: 'vikram@hospital.com',
    specialization: 'Orthopedics', experience: 15,
    bio: 'Renowned orthopedic surgeon specializing in joint replacement and sports injuries.',
    consultationFee: 900, rating: 4.7,
    availability: [
      { day: 'Wednesday', slots: ['09:00','10:00','11:00'] },
      { day: 'Saturday',  slots: ['10:00','11:00','12:00'] },
    ],
  },
  {
    name: 'Dr. Kavitha Reddy',  email: 'kavitha@hospital.com',
    specialization: 'Dermatology', experience: 6,
    bio: 'Expert dermatologist treating skin conditions, cosmetic dermatology, and hair disorders.',
    consultationFee: 650, rating: 4.5,
    availability: [
      { day: 'Thursday', slots: ['09:00','10:00','11:00'] },
      { day: 'Friday',   slots: ['14:00','15:00'] },
    ],
  },
];

const patientsSeed = [
  { name: 'Arjun Kumar',     email: 'arjun@example.com',  age: 34, gender: 'male',   bloodGroup: 'B+', medicalHistory: ['Hypertension'] },
  { name: 'Sneha Patel',     email: 'sneha@example.com',  age: 28, gender: 'female', bloodGroup: 'O+', medicalHistory: [] },
  { name: 'Mohammed Farooq', email: 'farooq@example.com', age: 45, gender: 'male',   bloodGroup: 'A+', medicalHistory: ['Diabetes', 'High Cholesterol'] },
];

/* ── Main ────────────────────────────────────────────────────────────────── */
async function seed() {
  console.log('\n🌱  Seeding SmartHospital…\n');
  await mongoose.connect(MONGO_URI);
  console.log('✅  MongoDB connected\n');

  // Wipe existing data
  await Promise.all([
    User.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️   Cleared existing data\n');

  // ── Admin ──────────────────────────────────────────────────────────────
  const adminUser = await createUser('Admin User', 'admin@hospital.com', 'admin');
  await Notification.create({
    userId: adminUser._id,
    message: 'Welcome Admin! SmartHospital system is live and ready.',
    type: 'system',
  });
  console.log('  👑  Admin created: admin@hospital.com');

  // ── Doctors ────────────────────────────────────────────────────────────
  const createdDoctors = [];
  for (let i = 0; i < doctorsSeed.length; i++) {
    const d = doctorsSeed[i];
    // Make the last doctor pending to test the admin approval flow
    const isApproved = i !== doctorsSeed.length - 1;
    const user = await createUser(d.name, d.email, 'doctor', isApproved);
    const doc  = await Doctor.create({
      userId:         user._id,
      specialization: d.specialization,
      experience:     d.experience,
      bio:            d.bio,
      consultationFee:d.consultationFee,
      rating:         d.rating,
      availability:   d.availability,
    });
    createdDoctors.push({ user, doc });
    await Notification.create({
      userId: user._id,
      message: `Welcome, ${d.name.split(' ')[1]}! Your doctor profile is active.`,
      type: 'system',
    });
    console.log(`  👨‍⚕️  Doctor: ${d.name} (${d.specialization}) [Approved: ${isApproved}]`);
  }

  // ── Patients ───────────────────────────────────────────────────────────
  const createdPatients = [];
  for (const p of patientsSeed) {
    const user = await createUser(p.name, p.email, 'patient');
    const pat  = await Patient.create({
      userId:        user._id,
      age:           p.age,
      gender:        p.gender,
      bloodGroup:    p.bloodGroup,
      medicalHistory:p.medicalHistory,
    });
    createdPatients.push({ user, pat });
    await Notification.create({
      userId: user._id,
      message: `Welcome to SmartHospital, ${p.name.split(' ')[0]}! Your account is ready.`,
      type: 'system',
    });
    console.log(`  🤒  Patient: ${p.name}`);
  }

  // ── Appointments ───────────────────────────────────────────────────────
  console.log('');
  const apptSeed = [
    { pi: 0, di: 0, date: daysFromNow(2),  time: '10:00', status: 'confirmed', reason: 'Chest pain and shortness of breath' },
    { pi: 1, di: 2, date: daysFromNow(1),  time: '14:00', status: 'pending',   reason: 'Routine child health checkup' },
    { pi: 2, di: 1, date: daysFromNow(3),  time: '11:00', status: 'confirmed', reason: 'Recurring headaches and dizziness' },
    { pi: 0, di: 3, date: daysFromNow(-5), time: '09:00', status: 'completed', reason: 'Knee pain follow-up after surgery' },
    { pi: 1, di: 4, date: daysFromNow(-2), time: '15:00', status: 'completed', reason: 'Skin rash and itching examination' },
  ];

  for (const a of apptSeed) {
    const { pat }  = createdPatients[a.pi];
    const { doc, user: docUser } = createdDoctors[a.di];
    const { user: patUser } = createdPatients[a.pi];

    await Appointment.create({
      patientId: pat._id,
      doctorId:  doc._id,
      date:      a.date,
      time:      a.time,
      status:    a.status,
      reason:    a.reason,
    });

    // Notify patient
    await Notification.create({
      userId:  patUser._id,
      message: `Appointment with ${docUser.name} on ${a.date} at ${a.time} — ${a.status}.`,
      type:    'appointment',
    });

    console.log(`  📅  ${patUser.name} → ${docUser.name} [${a.status}] on ${a.date}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Seeding complete!

  🔑  Login credentials (all passwords: password123)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  👑  Admin   →  admin@hospital.com
  👨‍⚕️  Doctor  →  priya@hospital.com
  👨‍⚕️  Doctor  →  rahul@hospital.com
  🤒  Patient →  arjun@example.com
  🤒  Patient →  sneha@example.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🌐  Frontend: http://localhost:3000
  🚀  Backend:  http://localhost:5000

  ▶  Start frontend:  npx serve frontend -p 3000
  ▶  Start backend:   npx nodemon server.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
