const { processMessage } = require('../services/aiService');
const { success, error }  = require('../utils/responseHelper');
const TreatmentCourse = require('../models/TreatmentCourse');
const AuditLog = require('../models/AuditLog');
// Using native fetch for node 18+ or global fetch


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

    // TRY CALLING PYTHON VOICE SERVICE (FOR HIGH ACCURACY)
    try {
      const pythonRes = await fetch('http://localhost:8000/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), user_context: userContext })
      });
      
      if (pythonRes.ok) {
        const pyData = await pythonRes.json();
        return success(res, {
          reply: pyData.reply,
          intent: pyData.intent,
          structuredData: pyData.structured_data
        }, 'AI response generated via Python Service');
      }
    } catch (err) {
      console.log('Python Voice Service not running, falling back to Node AI logic.');
    }

    const result = await processMessage(message.trim(), userContext);
    return success(res, result, 'AI response generated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/ai/triage
 * Body: { symptoms, age, duration, severity }
 */
const triage = async (req, res) => {
  try {
    const { symptoms, age, duration, severity } = req.body;
    if (!symptoms || !age) {
      return error(res, 'Symptoms and age are required', 422);
    }

    // Prepare prompt for AI
    const triagePrompt = `You are an AI Symptom Triage assistant for Smart Hospital.
    A patient has provided the following details:
    - Symptoms: ${symptoms}
    - Age: ${age}
    - Duration: ${duration || 'Not specified'}
    - Severity: ${severity || 'Not specified'}
    
    Based on this, provide a triage assessment.
    Return ONLY a JSON object with the following fields (no markdown or other text):
    {
      "concernLevel": "Low" | "Medium" | "High",
      "suggestedDepartment": "string",
      "urgencyLevel": "string",
      "recommendation": "string"
    }`;

    // Ideally, call OpenAI directly or via aiService. 
    // Here we'll use processMessage with a specific instruction flag or just send the prompt.
    // Since processMessage returns string, we will try to parse it, or fallback.
    const resultString = await processMessage(triagePrompt, { systemOverride: 'triage' });
    
    let resultJson;
    try {
      const match = resultString.match(/\{[\s\S]*\}/);
      if (match) {
        resultJson = JSON.parse(match[0]);
      } else {
        resultJson = JSON.parse(resultString);
      }
    } catch (e) {
      // Fallback if AI doesn't return JSON
      resultJson = {
        concernLevel: severity && severity.toLowerCase() === 'high' ? 'High' : 'Medium',
        suggestedDepartment: 'General Medicine',
        urgencyLevel: 'Moderate',
        recommendation: 'Please book an appointment with a doctor for a proper diagnosis.'
      };
    }
    
    // Log audit
    if (req.user) {
      await AuditLog.create({
        userId: req.user._id,
        action: 'AI Triage Performed',
        details: `Symptoms: ${symptoms}`,
        ipAddress: req.ip || ''
      });
    }

    return success(res, resultJson, 'Triage complete');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { chat, triage };
