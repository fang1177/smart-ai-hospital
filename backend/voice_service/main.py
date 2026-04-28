import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Smart Hospital AI Voice Service")

# Use OpenAI for high-accuracy intent extraction
# In a real "trained" scenario, you'd use a fine-tuned model or RAG
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class VoiceRequest(BaseModel):
    message: str
    user_context: Optional[Dict[str, Any]] = None

class IntentResponse(BaseModel):
    reply: str
    intent: str
    structured_data: Dict[str, Any]

SYSTEM_PROMPT = """
You are the SmartHospital AI Voice Specialist. 
Your goal is to extract structured intent from patient voice transcripts with 100% accuracy.

INTENTS:
- BOOK_APPOINTMENT: Patient wants to schedule a visit.
- FIND_DOCTOR: Patient looking for a specialist.
- CHECK_RECORDS: Patient wants to see medical history.
- SYMPTOM_HELP: Patient describing pain or illness.

SPECIALTY MAPPING:
- Joint/Bone/Back/Muscle -> Orthopedics
- Heart/Chest/Pulse -> Cardiology
- Brain/Headache/Nerves -> Neurology
- Skin/Rash/Itch -> Dermatology
- Children/Baby -> Pediatrics

OUTPUT FORMAT:
Return a JSON object with:
1. "reply": A warm, spoken-style response (keep it concise).
2. "intent": One of the intents above.
3. "data": { "specialty": str, "doctor": str, "date": str, "time": str, "severity": str }

Example: "I want to see a heart doctor tomorrow at 10am"
Output: {
  "reply": "I've found our Cardiology department. I can help you book that for tomorrow at 10 AM. Shall I proceed?",
  "intent": "BOOK_APPOINTMENT",
  "data": { "specialty": "Cardiology", "date": "tomorrow", "time": "10:00" }
}
"""

@app.post("/process", response_model=IntentResponse)
async def process_voice(req: VoiceRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": req.message}
            ],
            response_format={ "type": "json_object" }
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        return IntentResponse(
            reply=result.get("reply", "I'm listening. How can I help?"),
            intent=result.get("intent", "GENERAL"),
            structured_data=result.get("data", {})
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
