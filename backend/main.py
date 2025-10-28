from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

# Temporary in-memory storage
users_db = []
jobs_db = []
applications_db = []

class UserType(str, Enum):
    CANDIDATE = "candidate"
    EMPLOYER = "employer"
    ADMIN = "admin"

class User(BaseModel):
    id: Optional[str] = None
    email: str
    password: str
    user_type: UserType
    full_name: str
    company_name: Optional[str] = None
    created_at: datetime = datetime.now()

class Job(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    company: str
    location: str
    salary_range: Optional[str] = None
    employment_type: str
    required_skills: list = []
    posted_by: str
    is_active: bool = True
    created_at: datetime = datetime.now()

class Application(BaseModel):
    id: Optional[str] = None
    job_id: str
    candidate_id: str
    cover_letter: Optional[str] = None
    status: str = "pending"
    applied_at: datetime = datetime.now()

app = FastAPI(title="SmartHire API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to generate IDs
def generate_id():
    return str(len(users_db) + len(jobs_db) + len(applications_db) + 1)

@app.get("/")
async def root():
    return {"message": "SmartHire API is working!"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Auth endpoints
@app.post("/api/auth/register")
async def register(user_data: dict):
    """Register a new user"""
    # Check if user already exists
    for user in users_db:
        if user.email == user_data["email"]:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        id=generate_id(),
        email=user_data["email"],
        password=user_data["password"],  # In real app, hash this!
        user_type=user_data["user_type"],
        full_name=user_data["full_name"],
        company_name=user_data.get("company_name")
    )
    
    users_db.append(new_user)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "user_type": new_user.user_type,
        "full_name": new_user.full_name,
        "company_name": new_user.company_name
    }

@app.post("/api/auth/login")
async def login(credentials: dict):
    """Login user"""
    for user in users_db:
        if user.email == credentials["email"] and user.password == credentials["password"]:
            return {
                "id": user.id,
                "email": user.email,
                "user_type": user.user_type,
                "full_name": user.full_name,
                "company_name": user.company_name
            }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Jobs endpoints
@app.get("/api/jobs/")
async def get_jobs():
    """Get all active jobs"""
    active_jobs = [job for job in jobs_db if job.is_active]
    return active_jobs

@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a specific job"""
    for job in jobs_db:
        if job.id == job_id:
            return job
    raise HTTPException(status_code=404, detail="Job not found")

@app.post("/api/jobs/")
async def create_job(job_data: dict):
    """Create a new job"""
    new_job = Job(
        id=generate_id(),
        title=job_data["title"],
        description=job_data["description"],
        company=job_data["company"],
        location=job_data["location"],
        salary_range=job_data.get("salary_range"),
        employment_type=job_data["employment_type"],
        required_skills=job_data.get("required_skills", []),
        posted_by="temp_employer_id"  # In real app, get from auth
    )
    
    jobs_db.append(new_job)
    return new_job

# Applications endpoints
@app.post("/api/applications/")
async def create_application(application_data: dict):
    """Apply for a job"""
    # Check if already applied
    for app in applications_db:
        if app.job_id == application_data["job_id"] and app.candidate_id == "temp_candidate_id":
            raise HTTPException(status_code=400, detail="Already applied to this job")
    
    new_application = Application(
        id=generate_id(),
        job_id=application_data["job_id"],
        candidate_id="temp_candidate_id",  # In real app, get from auth
        cover_letter=application_data.get("cover_letter")
    )
    
    applications_db.append(new_application)
    return new_application

@app.get("/api/applications/candidate/{candidate_id}")
async def get_candidate_applications(candidate_id: str):
    """Get applications by candidate"""
    candidate_apps = [app for app in applications_db if app.candidate_id == candidate_id]
    return candidate_apps

# Add some sample data
@app.on_event("startup")
async def startup_event():
    """Add sample data on startup"""
    if not jobs_db:
        sample_job = Job(
            id="1",
            title="Full Stack Developer",
            description="We are looking for a skilled Full Stack Developer to join our team.",
            company="Tech Corp",
            location="Remote",
            salary_range="$80,000 - $120,000",
            employment_type="full-time",
            required_skills=["React", "Python", "MongoDB", "FastAPI"],
            posted_by="sample_employer"
        )
        jobs_db.append(sample_job)
    
    print("✅ SmartHire API started with in-memory storage!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)