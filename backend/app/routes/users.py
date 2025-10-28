from fastapi import APIRouter
from app.models.user import User, UserResponse
from typing import List

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def get_users():
    """Get all users (for admin panel)"""
    users = await User.find_all().to_list()
    return users