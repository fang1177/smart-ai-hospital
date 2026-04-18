const TreatmentCourse = require('../models/TreatmentCourse');
const Notification = require('../models/Notification');
const Patient = require('../models/Patient');

/**
 * reminderService — Background logic for automated alerts
 */

const checkReminders = async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Simple logic: If current hour is 8-9 (Morning), 13-14 (Afternoon), 20-21 (Evening)
    let session = '';
    if (currentHour >= 8 && currentHour <= 9) session = 'Morning';
    if (currentHour >= 13 && currentHour <= 14) session = 'Afternoon';
    if (currentHour >= 20 && currentHour <= 21) session = 'Evening';

    if (!session) return;

    // Find active treatment courses
    const activeTreatments = await TreatmentCourse.find({ status: 'active' }).populate({
        path: 'patientId',
        populate: { path: 'userId' }
    });

    for (const treatment of activeTreatments) {
      if (!treatment.patientId?.userId) continue;

      const userId = treatment.patientId.userId._id;
      
      // Filter medicines for current session
      const medicinesTodo = treatment.medicines.filter(m => m.dosage.includes(session));
      
      if (medicinesTodo.length > 0) {
        // Check if a high-intensity notification for this session already exists to avoid spam
        const existing = await Notification.findOne({
          userId,
          type: 'medicine',
          isHighIntensity: true,
          timestamp: { $gte: new Date(now.setHours(0,0,0,0)) } // Only today
        });

        if (!existing) {
          await Notification.create({
            userId,
            type: 'medicine',
            message: `⚠️ HIGH INTENSITY ALERT: It is time for your ${session} medication for "${treatment.title}". Please take: ${medicinesTodo.map(m => m.name).join(', ')}.`,
            isHighIntensity: true,
            metadata: {
              treatmentId: treatment._id.toString(),
              medicines: medicinesTodo.map(m => m.name).join(','),
              session
            }
          });
          console.log(`[Reminders] Sent high-intensity alert to ${treatment.patientId.userId.name}`);
        }
      }
    }
  } catch (err) {
    console.error('[Reminders] Error checking reminders:', err);
  }
};

const startReminderService = () => {
  console.log('🔔 Reminder Service Started');
  // Run every 15 minutes
  setInterval(checkReminders, 15 * 60 * 1000);
  // Initial check
  checkReminders();
};

module.exports = { startReminderService };
