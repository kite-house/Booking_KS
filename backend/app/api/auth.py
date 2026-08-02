from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
async def login(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    result = await auth_service.authenticate_user(user_data.employee_id)
    
    if result["has_access"]:
        return {
            "status": "success",
            "user": UserResponse.model_validate(result["user"]),
            "message": result["message"],
            "has_access": True
        }
    else:
        return {
            "status": "pending",
            "user": UserResponse.model_validate(result["user"]),
            "message": result["message"],
            "has_access": False
        }