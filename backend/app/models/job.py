from beanie import Document
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Job(Document):
    title: str
    description: str
    company: str
    location: str
    salary_range: Optional[str] = None
    employment_type: str  # full-time, part-time, contract
    required_skills: list[str] = []
    posted_by: str  # User ID of employer
    is_active: bool = True
    created_at: datetime = datetime.now()
    
    class Settings:
        name = "jobs"

class JobCreate(BaseModel):
    title: str
    description: str
    company: str
    location: str
    salary_range: Optional[str] = None
    employment_type: str
    required_skills: list[str] = []

class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    company: str
    location: str
    salary_range: Optional[str] = None
    employment_type: str
    required_skills: list[str]
    posted_by: str
    created_at: datetime
    
    class Config:
        from_attributes = True