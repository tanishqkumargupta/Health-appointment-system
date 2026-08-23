import json
import os
import requests
from config import Config

def call_openai_chat(system_prompt, user_prompt, response_format_json=True):
    """
    Generic helper to execute LLM API call with timeout and fallback.
    """
    api_key = Config.OPENAI_API_KEY
    if not api_key or api_key == "mock-or-env-key" or api_key.startswith("your_"):
        raise ValueError("No valid OpenAI API key configured.")

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3
    }

    if response_format_json:
        payload["response_format"] = {"type": "json_object"}

    resp = requests.post(url, headers=headers, json=payload, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return content

def generate_pre_visit_ai_summary(problem_category, symptom_text):
    """
    Generates Pre-Visit AI summary.
    Returns dict: {"urgency": "Low"/"Medium"/"High", "chief_complaint": "...", "suggested_questions": [...]}.
    Falls back gracefully on API error.
    """
    system_prompt = (
        "You are a clinical AI triage assistant helping structure patient symptom reports for doctors. "
        "Analyze the provided problem category and patient symptoms. "
        "Respond ONLY with a JSON object containing:\n"
        "- 'urgency': Must be strictly one of 'Low', 'Medium', or 'High'\n"
        "- 'chief_complaint': A clear, concise summary of the primary complaint (1-2 sentences)\n"
        "- 'suggested_questions': An array of exactly 3 relevant clinical questions for the doctor to ask\n"
        "Do NOT provide a diagnosis."
    )

    user_prompt = f"Problem Category: {problem_category}\nPatient Symptoms: {symptom_text}"

    try:
        raw_response = call_openai_chat(system_prompt, user_prompt, response_format_json=True)
        parsed = json.loads(raw_response)
        
        urgency = parsed.get("urgency", "Medium")
        if urgency not in ["Low", "Medium", "High"]:
            urgency = "Medium"
            
        chief_complaint = parsed.get("chief_complaint", f"Patient reports {problem_category} symptoms.")
        questions = parsed.get("suggested_questions", [])
        if not isinstance(questions, list) or len(questions) == 0:
            questions = [
                "How long have you experienced these symptoms?",
                "Are symptoms constant or intermittent?",
                "Have you tried any home remedies or medications?"
            ]
        elif len(questions) > 3:
            questions = questions[:3]

        return {
            "urgency": urgency,
            "chief_complaint": chief_complaint,
            "suggested_questions": questions,
            "status": "COMPLETED"
        }
    except Exception as e:
        print(f"[AI Service Warning] Pre-visit AI summary generation failed: {e}")
        # Rule 29: AI failure handling - return fallback without failing transaction
        return {
            "urgency": "Medium",
            "chief_complaint": f"Patient reported symptoms for {problem_category}: {symptom_text[:100]}...",
            "suggested_questions": [
                "When did these symptoms first begin?",
                "Does anything make the symptoms better or worse?",
                "Do you have any existing medical conditions or allergies?"
            ],
            "status": "FAILED"
        }

def generate_post_visit_ai_summary(diagnosis, clinical_notes, prescription_items):
    """
    Generates patient-friendly post-visit summary based on doctor's diagnosis, notes, and prescriptions.
    """
    system_prompt = (
        "You are an empathetic medical communicator. Explain the doctor's diagnosis, notes, and medication instructions "
        "in clear, comforting, easy-to-understand language for the patient. "
        "Do NOT change or contradict the doctor's prescription."
    )

    items_summary = "\n".join([
        f"- {item.get('medicine_name')} ({item.get('dosage')}): {item.get('food_instruction')}, {', '.join(item.get('frequency', []))}"
        for item in prescription_items
    ])

    user_prompt = (
        f"Diagnosis: {diagnosis}\n"
        f"Clinical Notes: {clinical_notes or 'None'}\n"
        f"Prescribed Medications:\n{items_summary}"
    )

    try:
        summary = call_openai_chat(system_prompt, user_prompt, response_format_json=False)
        return summary, "COMPLETED"
    except Exception as e:
        print(f"[AI Service Warning] Post-visit AI summary failed: {e}")
        fallback = (
            f"Doctor Diagnosis: {diagnosis}\n\n"
            f"Notes: {clinical_notes or 'Please follow prescribed medication instructions.'}\n\n"
            "Please take all medications as prescribed by your doctor."
        )
        return fallback, "FAILED"
