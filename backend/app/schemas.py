from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ScanRequest(BaseModel):
    input_text: str
    input_type: str
    session_id: Optional[str] = None

class ScanResponse(BaseModel):
    id: int
    input_type: str
    risk_score: float
    risk_level: str
    recommendation: str
    report: str
    indicators: Optional[List[str]] = []
    virustotal_summary: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class HistoryItem(BaseModel):
    id: int
    input_type: str
    risk_score: float
    risk_level: str
    recommendation: str
    created_at: datetime
    input_preview: str
    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_scans: int
    high_risk_count: int
    safe_count: int
    risk_distribution: dict
    daily_trends: List[dict]