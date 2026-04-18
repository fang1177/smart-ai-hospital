// Firebase Admin SDK — Phase 2 integration
// Stub for Phase 1: will activate when FIREBASE_PROJECT_ID is set in .env

let admin = null;

const initFirebase = () => {
  try {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin = require('firebase-admin');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('🔥 Firebase Admin SDK initialized');
    } else {
      console.log('⚠️  Firebase not configured — skipping (Phase 2 feature)');
    }
  } catch (err) {
    console.error('❌ Firebase init error:', err.message);
  }
};

const getAdmin = () => admin;

module.exports = { initFirebase, getAdmin };
