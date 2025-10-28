from fastapi import APIRouter, HTTPException
from app.models.application import Application, ApplicationCreate, ApplicationResponse, ApplicationStatus
from beanie import PydanticObjectId
from typing import List

router = APIRouter()

@router.post("/", response_model=ApplicationResponse)
async def create_application(application_data: ApplicationCreate):
    """Apply for a job"""
    # In real app, get candidate_id from auth token
    candidate_id = "temp_candidate_id"  # We'll replace this with actual auth
    
    # Check if already applied
    existing_application = await Application.find_one(
        Application.job_id == application_data.job_id,
        Application.candidate_id == candidate_id
    )
    
    if existing_application:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    application = Application(
        job_id=application_data.job_id,
        candidate_id=candidate_id,
        cover_letter=application_data.cover_letter,
        match_score=0.85  # Mock AI score for now
    )
    
    await application.insert()
    return application

@router.get("/candidate/{candidate_id}", response_model=List[ApplicationResponse])
async def get_candidate_applications(candidate_id: str):
    """Get all applications by a candidate"""
    applications = await Application.find(Application.candidate_id == candidate_id).to_list()
    return applications

@router.get("/job/{job_id}", response_model=List[ApplicationResponse])
async def get_job_applications(job_id: str):
    """Get all applications for a specific job"""
    applications = await Application.find(Application.job_id == job_id).to_list()
    return applications