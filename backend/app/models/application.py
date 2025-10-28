from beanie import Document
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class Application(Document):
    job_id: str
    candidate_id: str
    cover_letter: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.PENDING
    applied_at: datetime = datetime.now()
    match_score: Optional[float] = None  # AI matching score
    
    class Settings:
        name = "applications"

class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    cover_letter: Optional[str] = None
    status: ApplicationStatus
    applied_at: datetime
    match_score: Optional[float] = None
    
    class Config:
        from_attributes = True