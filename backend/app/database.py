from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User
from app.models.job import Job
from app.models.application import Application

# MongoDB connection settings
MONGO_URL = "mongodb://localhost:27017"  # Local dev - we'll change this for production
DATABASE_NAME = "smarthire"

async def init_db():
    """Initialize database connection"""
    # Create Motor client
    client = AsyncIOMotorClient(MONGO_URL)
    
    # Initialize Beanie with the database and document models
    await init_beanie(
        database=client[DATABASE_NAME],
        document_models=[User, Job, Application]
    )
    
    print("✅ Database connected successfully!")