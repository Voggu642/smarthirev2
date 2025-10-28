from fastapi import APIRouter, HTTPException
from app.models.job import Job, JobCreate, JobResponse
from beanie import PydanticObjectId
from typing import List

router = APIRouter()

@router.get("/", response_model=List[JobResponse])
async def get_jobs():
    """Get all active job listings"""
    jobs = await Job.find(Job.is_active == True).sort(-Job.created_at).to_list()
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get a specific job by ID"""
    job = await Job.get(PydanticObjectId(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/", response_model=JobResponse)
async def create_job(job_data: JobCreate):
    """Create a new job posting"""
    # In real app, get user_id from auth token
    user_id = "temp_employer_id"  # We'll replace this with actual auth
    
    job = Job(
        **job_data.dict(),
        posted_by=user_id
    )
    await job.insert()
    return job

@router.get("/employer/{employer_id}", response_model=List[JobResponse])
async def get_employer_jobs(employer_id: str):
    """Get all jobs posted by a specific employer"""
    jobs = await Job.find(Job.posted_by == employer_id).sort(-Job.created_at).to_list()
    return jobs