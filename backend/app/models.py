from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id                = Column(Integer, primary_key=True, index=True)
    session_id        = Column(String(64), nullable=True, index=True)
    input_text        = Column(Text, nullable=False)
    input_type        = Column(String(10), nullable=False)
    risk_score        = Column(Float, nullable=False)
    risk_level        = Column(String(20), nullable=False)
    recommendation    = Column(String(30), nullable=False)
    report            = Column(Text, nullable=False)
    indicators        = Column(Text, nullable=True)
    virustotal_result = Column(Text, nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())