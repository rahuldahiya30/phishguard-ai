from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import json, os
from datetime import datetime, timedelta
from dotenv import load_dotenv

from app.database import engine, get_db, Base
from app import models
from app.schemas import ScanRequest, ScanResponse, HistoryItem, StatsResponse
from app.analyzer import analyze_input
from app.virustotal import scan_input_virustotal

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PhishGuard AI", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/scan", response_model=ScanResponse)
async def scan(req: ScanRequest, db: Session = Depends(get_db)):
    if not req.input_text.strip():
        raise HTTPException(400, "Input cannot be empty")
    if req.input_type not in ["email", "url"]:
        raise HTTPException(400, "input_type must be 'email' or 'url'")
    if len(req.input_text) > 10000:
        raise HTTPException(400, "Input too long")

    try:
        ai = await analyze_input(req.input_text, req.input_type)
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {e}")

    try:
        vt = await scan_input_virustotal(req.input_text, req.input_type)
    except Exception as e:
        vt = {"checked": False, "reason": str(e)}

    score = ai["risk_score"]
    if vt.get("overall_verdict") == "MALICIOUS":
        score = min(10.0, score + 1.5)
    elif vt.get("overall_verdict") == "SUSPICIOUS":
        score = min(10.0, score + 0.5)

    if score <= 2.0:    level, rec = "SAFE", "Safe to Ignore"
    elif score <= 4.0:  level, rec = "LOW", "Monitor"
    elif score <= 6.0:  level, rec = "MEDIUM", "Escalate"
    elif score <= 8.0:  level, rec = "HIGH", "Block Immediately"
    else:               level, rec = "CRITICAL", "Block Immediately"

    vt_summary = vt.get("summary_text", "VirusTotal check unavailable.")
    full_report = ai["report"] + f"\n\n**VirusTotal:** {vt_summary}"

    scan_rec = models.Scan(
        session_id=req.session_id,
        input_text=req.input_text,
        input_type=req.input_type,
        risk_score=score,
        risk_level=level,
        recommendation=rec,
        report=full_report,
        indicators=json.dumps(ai.get("indicators", [])),
        virustotal_result=json.dumps(vt)
    )
    db.add(scan_rec)
    db.commit()
    db.refresh(scan_rec)

    return ScanResponse(
        id=scan_rec.id,
        input_type=req.input_type,
        risk_score=round(score, 2),
        risk_level=level,
        recommendation=rec,
        report=full_report,
        indicators=ai.get("indicators", []),
        virustotal_summary=vt_summary,
        created_at=scan_rec.created_at
    )

@app.get("/api/history", response_model=list[HistoryItem])
def history(
    limit: int = 20,
    session_id: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Scan)
    if session_id:
        query = query.filter(models.Scan.session_id == session_id)
    scans = query.order_by(models.Scan.created_at.desc()).limit(limit).all()
    return [HistoryItem(
        id=s.id,
        input_type=s.input_type,
        risk_score=s.risk_score,
        risk_level=s.risk_level,
        recommendation=s.recommendation,
        created_at=s.created_at,
        input_preview=s.input_text[:80] + "..." if len(s.input_text) > 80 else s.input_text
    ) for s in scans]

@app.get("/api/stats", response_model=StatsResponse)
def stats(
    session_id: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Scan)
    if session_id:
        query = query.filter(models.Scan.session_id == session_id)

    total = query.count()
    high  = query.filter(models.Scan.risk_level.in_(["HIGH", "CRITICAL"])).count()
    safe  = query.filter(models.Scan.risk_level == "SAFE").count()

    dist_query = db.query(models.Scan)
    if session_id:
        dist_query = dist_query.filter(models.Scan.session_id == session_id)
    dist = {lvl: cnt for lvl, cnt in dist_query.with_entities(
        models.Scan.risk_level, func.count(models.Scan.id)
    ).group_by(models.Scan.risk_level).all()}

    cutoff = datetime.utcnow() - timedelta(days=14)
    trend_query = db.query(models.Scan)
    if session_id:
        trend_query = trend_query.filter(models.Scan.session_id == session_id)

    from sqlalchemy import case as sa_case
    trends = [{
        "date": str(row.date), "total": row.total, "threats": row.threats or 0
    } for row in trend_query.with_entities(
        func.date(models.Scan.created_at).label("date"),
        func.count(models.Scan.id).label("total"),
        func.sum(sa_case(
            (models.Scan.risk_level.in_(["HIGH", "CRITICAL"]), 1), else_=0
        )).label("threats")
    ).filter(models.Scan.created_at >= cutoff
    ).group_by(func.date(models.Scan.created_at)).order_by("date").all()]

    return StatsResponse(
        total_scans=total,
        high_risk_count=high,
        safe_count=safe,
        risk_distribution=dist,
        daily_trends=trends
    )