from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserResponse, AdminPasswordCheck
from pydantic import ValidationError

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/check-admin")
async def check_admin(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Проверяет, требуется ли пароль для входа"""
    try:
        auth_service = AuthService(db)
        result = await auth_service.check_admin_password_required(user_data.employee_id)
        return {
            "requires_password": result["requires_password"],
            "is_admin": result["is_admin"],
            "has_access": result["has_access"],
            "message": result["message"],
            "user": UserResponse.model_validate(result["user"]) if result.get("user") else None
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail="Employee ID должен содержать только цифры"
        )

@router.post("/verify-admin")
async def verify_admin(
    admin_data: AdminPasswordCheck,
    db: AsyncSession = Depends(get_db)
):
    """Проверяет пароль администратора"""
    try:
        auth_service = AuthService(db)
        result = await auth_service.verify_admin_password(
            admin_data.employee_id, 
            admin_data.password
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=401,
                detail=result["message"]
            )
        
        return {
            "status": "success",
            "user": UserResponse.model_validate(result["user"]),
            "message": result["message"]
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail="Employee ID должен содержать только цифры"
        )

@router.post("/login")
async def login(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
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
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail="Employee ID должен содержать только цифры"
        )