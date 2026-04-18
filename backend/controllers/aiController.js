const { processMessage } = require('../services/aiService');
const { success, error }  = require('../utils/responseHelper');
const TreatmentCourse = require('../models/TreatmentCourse');

/**
 * POST /api/ai/chat
 * Body: { message: string }
 */
const chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return error(res, 'Message is required', 422);
    }

    // Pass user context to AI for personalized responses
    const userContext = {
      name: req.user.name,
      role: req.user.role,
      userId: req.user._id,
    };

    if (req.user.role === 'patient') {
      const activeCourses = await TreatmentCourse.find({
        patientId: req.user._id,
        status: 'active'
      }).select('title diagnosis medicines dietAdvice lifestyleNotes')
        .lean();
      
      userContext.activeTreatments = activeCourses;
    }

    const result = await processMessage(message.trim(), userContext);
    return success(res, result, 'AI response generated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { chat };
