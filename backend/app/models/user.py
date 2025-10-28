from beanie import Document
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime

class User(Document):
    email: EmailStr
    password: str
    user_type: Literal["candidate", "employer", "admin"]
    full_name: str
    company_name: Optional[str] = None  # For employers
    skills: list[str] = []  # For candidates
    experience: Optional[str] = None  # For candidates
    created_at: datetime = datetime.now()
    
    class Settings:
        name = "users"  # MongoDB collection name

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    user_type: Literal["candidate", "employer", "admin"]
    full_name: str
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    user_type: str
    full_name: str
    company_name: Optional[str] = None
    
    class Config:
        from_attributes = True