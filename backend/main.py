from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re

TECH_SKILLS = [
    # Programming Languages
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift',
    'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'haskell', 'elixir',
    
    # Frontend
    'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt.js', 'html', 'css', 'sass', 'less',
    'bootstrap', 'tailwind', 'material-ui', 'chakra-ui', 'redux', 'webpack',
    
    # Backend
    'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel', 'ruby on rails',
    'asp.net', 'graphql', 'rest api', 'microservices', 'serverless',
    
    # Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'cassandra', 'dynamodb',
    'firebase', 'supabase', 'sql', 'nosql',
    
    # Cloud & DevOps
    'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
    'gitlab', 'github actions', 'ci/cd', 'linux', 'nginx', 'apache', 'helm', 'prometheus',
    
    # Mobile
    'react native', 'flutter', 'android', 'ios', 'swiftui', 'jetpack compose',
    
    # Data Science
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
    'data analysis', 'data visualization', 'tableau', 'power bi', 'jupyter', 'spark',
    
    # Tools
    'git', 'jira', 'confluence', 'figma', 'photoshop', 'illustrator', 'sketch', 'postman',
    
    # Methodologies
    'agile', 'scrum', 'kanban', 'tdd', 'bdd', 'devops', 'ci/cd'
]

# Temporary in-memory storage
users_db = []
jobs_db = []
applications_db = []
resumes_db = []
user_profiles_db = [] 

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

class BulkJobCreate(BaseModel):
    title: str
    description: str
    company: str
    location: str
    salary_range: Optional[str] = None
    employment_type: str
    required_skills: List[str] = []

class Application(BaseModel):
    id: Optional[str] = None
    job_id: str
    candidate_id: str
    cover_letter: Optional[str] = None
    status: str = "pending"
    applied_at: datetime = datetime.now()
    match_score: Optional[float] = None

class Resume(BaseModel):
    id: Optional[str] = None
    user_id: str
    filename: str
    file_path: str
    extracted_skills: List[str] = []
    uploaded_at: datetime = datetime.now()

class UserProfile(BaseModel):
    user_id: str
    resumes: List[str] = []
    primary_resume_id: Optional[str] = None
    skills: List[str] = []
    experience: Optional[str] = None

app = FastAPI(title="SmartHire API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to generate IDs
id_counter = 0

def generate_id():
    global id_counter
    id_counter += 1
    return str(id_counter)
@app.get("/")
async def root():
    return {"message": "SmartHire API is working!"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Mock skill extraction
def extract_skills_from_text(text: str) -> List[str]:
    """Extract tech skills from resume text"""
    if not text:
        return []
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in TECH_SKILLS:
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            # Capitalize properly
            formatted_skill = ' '.join(word.capitalize() for word in skill.split())
            found_skills.append(formatted_skill)
    
    # Remove duplicates and return top 15 skills
    unique_skills = list(dict.fromkeys(found_skills))
    return unique_skills[:15]


@app.delete("/api/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    """Delete a resume"""
    resume = next((r for r in resumes_db if r.id == resume_id), None)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Remove from resumes database
    resumes_db.remove(resume)
    
    # Update user profile
    user_profile = next((p for p in user_profiles_db if p.user_id == resume.user_id), None)
    if user_profile:
        if resume_id in user_profile.resumes:
            user_profile.resumes.remove(resume_id)
        
        # If this was the primary resume, set a new one
        if user_profile.primary_resume_id == resume_id and user_profile.resumes:
            user_profile.primary_resume_id = user_profile.resumes[0]
            new_primary = next((r for r in resumes_db if r.id == user_profile.primary_resume_id), None)
            if new_primary:
                user_profile.skills = new_primary.extracted_skills
        elif user_profile.primary_resume_id == resume_id:
            user_profile.primary_resume_id = None
            user_profile.skills = []
    
    return {"message": "Resume deleted successfully"}

# Add skill management endpoints
@app.post("/api/user/profile/{user_id}/skills")
async def add_user_skill(user_id: str, skill_data: dict):
    """Add a skill to user profile"""
    user_profile = next((p for p in user_profiles_db if p.user_id == user_id), None)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    skill = skill_data.get("skill", "").strip()
    if skill and skill not in user_profile.skills:
        user_profile.skills.append(skill)
    
    return {"message": "Skill added", "skills": user_profile.skills}

@app.delete("/api/user/profile/{user_id}/skills")
async def remove_user_skill(user_id: str, skill_data: dict):
    """Remove a skill from user profile"""
    user_profile = next((p for p in user_profiles_db if p.user_id == user_id), None)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    skill = skill_data.get("skill", "").strip()
    if skill and skill in user_profile.skills:
        user_profile.skills.remove(skill)
    
    return {"message": "Skill removed", "skills": user_profile.skills}

@app.get("/api/user/profile/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile"""
    user_profile = next((p for p in user_profiles_db if p.user_id == user_id), None)
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    return user_profile
@app.get("/api/resumes/user/{user_id}")
async def get_user_resumes(user_id: str):
    """Get all resumes for a user"""
    user_resumes = [r for r in resumes_db if r.user_id == user_id]
    return user_resumes

@app.post("/api/resumes/primary/{resume_id}")
async def set_primary_resume(resume_id: str):
    """Set primary resume for job matching"""
    resume = next((r for r in resumes_db if r.id == resume_id), None)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    user_profile = next((p for p in user_profiles_db if p.user_id == resume.user_id), None)
    if user_profile:
        user_profile.primary_resume_id = resume_id
        user_profile.skills = resume.extracted_skills
    
    return {"message": "Primary resume set"}


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

@app.post("/api/jobs/bulk")
async def create_bulk_jobs(jobs_data: List[BulkJobCreate]):  # Change this line
    """Create multiple jobs at once"""
    created_jobs = []
    for job_data in jobs_data:
        new_job = Job(
            id=generate_id(),
            title=job_data.title,  # Change from job_data["title"] to job_data.title
            description=job_data.description,
            company=job_data.company,
            location=job_data.location,
            salary_range=job_data.salary_range,
            employment_type=job_data.employment_type,
            required_skills=job_data.required_skills,
            posted_by="system"
        )
        jobs_db.append(new_job)
        created_jobs.append(new_job)
    
    return {"message": f"Created {len(created_jobs)} jobs", "jobs": created_jobs}

# Applications endpoints
@app.post("/api/applications/")
async def create_application(application_data: dict):
    """Apply for a job"""
    try:
        # Check if job exists
        job_exists = False
        for job in jobs_db:
            if job.id == application_data["job_id"]:
                job_exists = True
                break
        
        if not job_exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Use consistent candidate ID
        candidate_id = "temp_candidate_id"
        
        # Check if already applied
        for app in applications_db:
            if app.job_id == application_data["job_id"] and app.candidate_id == candidate_id:
                raise HTTPException(status_code=400, detail="Already applied to this job")
        
        new_application = Application(
            id=generate_id(),
            job_id=application_data["job_id"],
            candidate_id=candidate_id,
            cover_letter=application_data.get("cover_letter", "I'm interested in this position!"),
            status="pending",
            match_score=0.85,
        )
        
        applications_db.append(new_application)
        return {
            "id": new_application.id,
            "job_id": new_application.job_id,
            "candidate_id": new_application.candidate_id,
            "cover_letter": new_application.cover_letter,
            "status": new_application.status,
            "applied_at": new_application.applied_at.isoformat(),
            "match_score": new_application.match_score,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications/candidate/{candidate_id}")
async def get_candidate_applications(candidate_id: str):
    """Get all applications by a candidate"""
    try:
        # For now, we'll return all applications since we're using temp IDs
        candidate_apps = [app for app in applications_db]
        
        # Convert applications to response format
        applications_response = []
        for app in candidate_apps:
            # Find the job details for each application
            job_details = None
            for job in jobs_db:
                if job.id == app.job_id:
                    job_details = job
                    break
            
            app_data = {
                "id": app.id,
                "job_id": app.job_id,
                "job_title": job_details.title if job_details else "Unknown Job",
                "company": job_details.company if job_details else "Unknown Company",
                "location": job_details.location if job_details else "Unknown Location",
                "candidate_id": app.candidate_id,
                "cover_letter": app.cover_letter,
                "status": app.status,
                "applied_at": app.applied_at.isoformat()
            }
            
            # Only add match_score if it exists
            if hasattr(app, 'match_score') and app.match_score is not None:
                app_data["match_score"] = app.match_score
            else:
                app_data["match_score"] = 0.85  # Default value
            
            applications_response.append(app_data)
        
        return applications_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add this endpoint to see all applications (for debugging)
@app.get("/api/debug/applications")
async def debug_applications():
    """Debug endpoint to see all applications"""
    return {
        "total_applications": len(applications_db),
        "applications": [
            {
                "id": app.id,
                "job_id": app.job_id,
                "candidate_id": app.candidate_id,
                "status": app.status,
                "match_score": app.match_score  # ADD THIS
            }
            for app in applications_db
        ]
    }

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


# Resume endpoints
@app.post("/api/resumes/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Form(...)):
    """Upload resume file and extract skills"""
    try:
        print(f"Received file: {file.filename}, size: {file.size}")
        
        # Read the file content
        content = await file.read()
        print(f"File content length: {len(content)}")
        
        # Extract text from PDF using a proper backend library
        extracted_text = extract_text_from_pdf(content)
        print(f"Extracted text length: {len(extracted_text)}")
        print(f"First 200 chars: {extracted_text[:200]}")
        
        # Extract skills from the actual text
        extracted_skills = extract_skills_from_text(extracted_text)
        print(f"Extracted skills: {extracted_skills}")
        
        # Save to database
        resume = Resume(
            id=generate_id(),
            user_id=user_id,
            filename=file.filename,
            file_path=f"/resumes/{user_id}/{file.filename}",
            extracted_skills=extracted_skills
        )
        
        resumes_db.append(resume)
        
        # Update user profile
        user_profile = next((p for p in user_profiles_db if p.user_id == user_id), None)
        if not user_profile:
            user_profile = UserProfile(user_id=user_id, resumes=[])
            user_profiles_db.append(user_profile)
        
        user_profile.resumes.append(resume.id)
        if not user_profile.primary_resume_id:
            user_profile.primary_resume_id = resume.id
            user_profile.skills = extracted_skills
        
        return {
            "resume": {
                "id": resume.id,
                "user_id": resume.user_id,
                "filename": resume.filename,
                "extracted_skills": resume.extracted_skills,
                "uploaded_at": resume.uploaded_at.isoformat()
            },
            "skills_found": len(extracted_skills),
            "message": f"Successfully extracted {len(extracted_skills)} skills"
        }
        
    except Exception as e:
        print(f"Error processing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF using PyPDF2 or similar backend library"""
    try:
        # Install: pip install pypdf2
        import PyPDF2
        from io import BytesIO
        
        pdf_file = BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return f"PDF Content: Could not extract text. Error: {e}"

@app.get("/api/resumes/user/{user_id}")
async def get_user_resumes(user_id: str):
    """Get all resumes for a user"""
    user_resumes = [r for r in resumes_db if r.user_id == user_id]
    return user_resumes

@app.post("/api/resumes/primary/{resume_id}")
async def set_primary_resume(resume_id: str):
    """Set primary resume for job matching"""
    resume = next((r for r in resumes_db if r.id == resume_id), None)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    user_profile = next((p for p in user_profiles_db if p.user_id == resume.user_id), None)
    if user_profile:
        user_profile.primary_resume_id = resume_id
        user_profile.skills = resume.extracted_skills
    
    return {"message": "Primary resume set"}

def extract_skills_from_text(text: str) -> List[str]:
    """Extract tech skills from resume text"""
    if not text:
        return []
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in TECH_SKILLS:
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            # Capitalize properly
            formatted_skill = ' '.join(word.capitalize() for word in skill.split())
            found_skills.append(formatted_skill)
    
    # Remove duplicates and return top 15 skills
    unique_skills = list(dict.fromkeys(found_skills))
    return unique_skills[:15]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)