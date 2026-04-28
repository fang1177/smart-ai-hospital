/**
 * aiService.js — OpenAI intent detection + conversation
 * Falls back gracefully if OPENAI_API_KEY is not set.
 */

const INTENT_KEYWORDS = {
  BOOK_APPOINTMENT: ['book', 'appointment', 'schedule', 'visit', 'consult', 'see a doctor'],
  CHECK_RECORDS:    ['record', 'report', 'xray', 'x-ray', 'prescription', 'ecg', 'lab', 'result'],
  FIND_DOCTOR:      ['doctor', 'specialist', 'find', 'search', 'cardio', 'neuro', 'ortho', 'derm'],
  SYMPTOM_ADVICE:   ['fever', 'pain', 'sick', 'cold', 'headache', 'cough', 'vomit', 'hurt', 'bleed'],
  MY_APPOINTMENTS:  ['my appointment', 'upcoming', 'next appointment', 'check appointment', 'confirm', 'pending request', 'approve'],
  GENERAL:          [],
};

/**
 * Detect intent from plain text (keyword-based fallback)
 */
function detectIntent(text) {
  const lower = text.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return intent;
    }
  }
  return 'GENERAL';
}

/**
 * Build a local reply based on intent (no API required)
 */
function localReply(intent, text, userContext = {}) {
  switch (intent) {
    case 'BOOK_APPOINTMENT':
      return {
        reply: "Sure! I'll help you book an appointment 📅\n\nTo get started:\n1. Select your preferred **doctor or specialty**\n2. Choose a **date and time** that works for you\n3. Briefly describe your **reason for visit**\n\nI'm redirecting you to the booking page now…",
        intent,
        action: 'redirect:appointments',
      };

    case 'CHECK_RECORDS':
      return {
        reply: "Here's how to access your medical records 📋\n\nYour records include:\n• 🩻 X-rays and scans\n• 💊 Prescriptions\n• 💓 ECG reports\n• 🧪 Lab results\n\nOpening your records now…",
        intent,
        action: 'redirect:records',
      };

    case 'FIND_DOCTOR':
      return {
        reply: "I'll help you find the right specialist 👨‍⚕️\n\nWe have doctors in:\n• Cardiology, Neurology, Orthopedics\n• Pediatrics, Dermatology, Gynecology\n• ENT, Ophthalmology, Psychiatry, and more\n\nOpening our doctor directory…",
        intent,
        action: 'redirect:doctors',
      };

    case 'SYMPTOM_ADVICE':
      if (userContext.activeTreatments && userContext.activeTreatments.length > 0) {
        const latestCourse = userContext.activeTreatments[0];
        const meds = latestCourse.medicines && latestCourse.medicines.length > 0
          ? latestCourse.medicines.map(m => m.name).join(', ')
          : 'those prescribed by your doctor';
          
        return {
          reply: `I see you are currently under treatment for **${latestCourse.title}**.\n\nPlease stick to your doctor's advice and continue taking your prescribed medications (${meds}).\n\n**If your symptoms are worsening or new**, I strongly recommend scheduling a follow-up appointment with your doctor. Shall I help you book one?`,
          intent,
          action: 'redirect:appointments',
        };
      }

      return {
        reply: `Thank you for sharing your symptoms. 🤒\n\n**For your safety, I cannot provide direct medical remedies or prescribe medication** as you do not currently have an active treatment plan in our system.\n\n**I recommend booking a doctor's consultation immediately** to get proper medical advice. Shall I schedule an appointment for you?`,
        intent,
        action: 'redirect:appointments',
      };

    case 'MY_APPOINTMENTS':
      if (userContext.role === 'doctor') {
        return {
          reply: "I'll open your appointment list 👨‍⚕️\n\nYou can view and confirm your pending patient requests here.\n\nOpening your schedule...",
          intent,
          action: 'redirect:appointments',
        };
      }
      return {
        reply: "Let me pull up your appointments 📆\n\nYou can view:\n• **Upcoming** confirmed appointments\n• **Pending** requests awaiting confirmation\n• **Past** completed visits\n\nOpening your appointments…",
        intent,
        action: 'redirect:appointments',
      };

    default:
      return {
        reply: "I'm here to help with all your healthcare needs 🏥\n\nHere's what I can do:\n• 📅 **Book appointments** — *\"Book a doctor\"*\n• 🔍 **Find specialists** — *\"Find a cardiologist\"*\n• 📋 **View records** — *\"Show my X-rays\"*\n• 💊 **Symptom advice** — *\"I have a fever\"*\n• 📆 **Check schedule** — *\"My upcoming appointments\"*\n\nHow can I assist you today?",
        intent,
        action: null,
      };
  }
}

/**
 * Main AI chat function
 * Tries OpenAI first; falls back to local intent system
 */
async function processMessage(message, userContext = {}) {
  const intent = detectIntent(message);

  // Try OpenAI if key is configured
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
    try {
      const systemPrompt = `You are MediAI, the SmartHospital Virtual Receptionist. 
Your primary goal is to assist PATIENTS with appointment management and navigation.

PROTOCOL FOR APPOINTMENTS:
1. When a patient wants to book, ask for the following if not provided:
   - Specific specialty or Doctor name.
   - Preferred Date and Time.
2. Inform the patient that:
   - A consultation fee is mandatory and must be paid online.
   - Appointments are confirmed only AFTER successful payment and doctor approval.
3. Be highly accurate. If you detect a specialty, suggest the department.
4. If a patient is in pain or has symptoms, prioritize booking an appointment with an Orthopedic or General Physician based on the description.

DOMAIN KNOWLEDGE:
- Joint/Muscle Pain -> Orthopedics
- Heart/Chest -> Cardiology
- Brain/Nerves -> Neurology
- Skin -> Dermatology
- Children -> Pediatrics

When the patient is ready or asks to book, provide a summary and end with [ACTION:redirect:appointments].

User context: ${JSON.stringify(userContext)}
Detected intent: ${intent}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: message },
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '';
        // Parse action tag if present
        const actionMatch = reply.match(/\[ACTION:(\w+)\]/);
        const action = actionMatch ? actionMatch[1].toLowerCase() : null;
        return { reply: reply.replace(/\[ACTION:\w+\]/g, '').trim(), intent, action };
      }
    } catch (err) {
      console.error('OpenAI error, using local intent:', err.message);
    }
  }

  // Fallback to local intent system
  return localReply(intent, message, userContext);
}

module.exports = { processMessage, detectIntent };
