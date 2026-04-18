/**
 * fcmService.js — Firebase Cloud Messaging (Phase 2)
 * Stub for Phase 1. Will be fully implemented when Firebase is configured.
 */
const { getAdmin } = require('../config/firebase');

/**
 * Send a push notification to a specific device token
 * @param {string} token   — FCM device token
 * @param {string} title   — Notification title
 * @param {string} body    — Notification body
 * @param {object} data    — Optional extra payload
 */
const sendPush = async (token, title, body, data = {}) => {
  const admin = getAdmin();
  if (!admin) {
    console.log(`[FCM Stub] Would send: "${title}" → ${token?.slice(0, 20)}…`);
    return { success: false, reason: 'Firebase not configured (Phase 2)' };
  }

  try {
    const result = await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    console.log('✅ FCM push sent:', result);
    return { success: true, messageId: result };
  } catch (err) {
    console.error('❌ FCM error:', err.message);
    return { success: false, reason: err.message };
  }
};

/**
 * Send push to multiple tokens
 */
const sendMulticast = async (tokens, title, body, data = {}) => {
  const admin = getAdmin();
  if (!admin || !tokens.length) return;

  try {
    const result = await admin.messaging().sendMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    return result;
  } catch (err) {
    console.error('FCM multicast error:', err.message);
  }
};

module.exports = { sendPush, sendMulticast };
