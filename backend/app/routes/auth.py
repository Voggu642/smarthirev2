from fastapi import APIRouter, HTTPException, status
from app.models.user import User, UserCreate, UserLogin, UserResponse
from beanie import PydanticObjectId
import bcrypt

router = APIRouter()

# Simple password hashing (we'll improve this later)
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user (candidate or employer)"""
    
    # Check if user already exists
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        password=hashed_password,
        user_type=user_data.user_type,
        full_name=user_data.full_name,
        company_name=user_data.company_name
    )
    
    await user.insert()
    return UserResponse(
        id=str(user.id),
        email=user.email,
        user_type=user.user_type,
        full_name=user.full_name,
        company_name=user.company_name
    )

@router.post("/login")
async def login(login_data: UserLogin):
    """Login user and return user info"""
    user = await User.find_one(User.email == login_data.email)
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        user_type=user.user_type,
        full_name=user.full_name,
        company_name=user.company_name
    )