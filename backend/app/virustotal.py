import os, re, base64
import httpx
from dotenv import load_dotenv

load_dotenv()
VT_KEY = os.getenv("VIRUSTOTAL_API_KEY")
VT_URL = "https://www.virustotal.com/api/v3"

def extract_targets(text: str, input_type: str) -> list:
    if input_type == "url":
        return [text.strip()]
    url_re = re.compile(r'https?://[^\s<>"{}|\\^`\[\]]+', re.I)
    domain_re = re.compile(
        r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b'
    )
    found = url_re.findall(text) + domain_re.findall(text)
    return list(set(found))[:3]

async def check_vt(url: str) -> dict:
    if not VT_KEY:
        return {"verdict": "UNKNOWN", "error": "No API key"}
    url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    headers = {"x-apikey": VT_KEY}
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.get(f"{VT_URL}/urls/{url_id}", headers=headers)
        if r.status_code == 404:
            await c.post(f"{VT_URL}/urls", headers=headers, data={"url": url})
            return {"url": url, "verdict": "SUBMITTED", "malicious": 0}
        if r.status_code != 200:
            return {"url": url, "verdict": "ERROR", "error": r.status_code}
        stats = r.json()["data"]["attributes"]["last_analysis_stats"]
        mal = stats.get("malicious", 0)
        sus = stats.get("suspicious", 0)
        total = sum(stats.values())
        verdict = "MALICIOUS" if mal > 3 else "SUSPICIOUS" if mal > 0 or sus > 2 else "CLEAN"
        return {"url": url, "malicious": mal, "suspicious": sus,
                "total_engines": total, "verdict": verdict}

async def scan_input_virustotal(input_text: str, input_type: str) -> dict:
    if not VT_KEY:
        return {"checked": False, "reason": "API key not configured"}
    targets = extract_targets(input_text, input_type)
    if not targets:
        return {"checked": False, "reason": "No URLs found"}
    results = [await check_vt(t) for t in targets]
    mal = any(r.get("verdict") == "MALICIOUS" for r in results)
    sus = any(r.get("verdict") == "SUSPICIOUS" for r in results)
    cln = sum(1 for r in results if r.get("verdict") == "CLEAN")
    verdict = "MALICIOUS" if mal else "SUSPICIOUS" if sus else "CLEAN"
    summary = []
    if mal: summary.append(f"{sum(1 for r in results if r.get('verdict')=='MALICIOUS')} URL(s) flagged MALICIOUS")
    if sus: summary.append(f"{sum(1 for r in results if r.get('verdict')=='SUSPICIOUS')} URL(s) SUSPICIOUS")
    if cln: summary.append(f"{cln} URL(s) clean")
    return {
        "checked": True,
        "results": results,
        "overall_verdict": verdict,
        "summary_text": ". ".join(summary) + "." if summary else "No threats detected."
    }