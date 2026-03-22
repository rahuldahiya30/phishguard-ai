import os, json
import anthropic
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

PROMPT = """You are a senior cybersecurity analyst specializing in phishing detection.
Analyze this {input_type} for phishing indicators and security threats.

INPUT:
{input_text}

Respond ONLY with a valid JSON object in this exact format:
{{
  "risk_score": <float 0.0-10.0>,
  "risk_level": "<SAFE|LOW|MEDIUM|HIGH|CRITICAL>",
  "recommendation": "<Safe to Ignore|Monitor|Escalate|Block Immediately>",
  "indicators": ["<specific indicator 1>", "<specific indicator 2>"],
  "report": "<3-5 paragraph plain-English analysis explaining what was found, why it is or is not suspicious, and the recommended action>"
}}

SCORING: 0-2=SAFE, 2.1-4=LOW, 4.1-6=MEDIUM, 6.1-8=HIGH, 8.1-10=CRITICAL
For emails: check sender spoofing, urgency language, lookalike domains, credential or payment requests, suspicious links.
For URLs: check lookalike domains, IP-based URLs, suspicious TLDs, URL shorteners, encoded characters."""

async def analyze_input(input_text: str, input_type: str) -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{
            "role": "user",
            "content": PROMPT.format(
                input_type=input_type.upper(),
                input_text=input_text
            )
        }]
    )
    text = message.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    result = json.loads(text)
    result["risk_score"] = max(0.0, min(10.0, float(result.get("risk_score", 5.0))))
    result.setdefault("indicators", [])
    result.setdefault("report", "Analysis complete.")
    result.setdefault("recommendation", "Monitor")
    return result