from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserResponse, UserRegister, UserLogin
from pydantic import ValidationError

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация нового пользователя"""
    try:
        auth_service = AuthService(db)
        result = await auth_service.register_user(
            user_data.employee_id, 
            user_data.password
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
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
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Логин пользователя"""
    try:
        auth_service = AuthService(db)
        result = await auth_service.login_user(
            user_data.employee_id, 
            user_data.password
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=401,
                detail=result["message"]
            )
        
        return {
            "status": "success",
            "user": UserResponse.model_validate(result["user"]),
            "is_admin": result.get("is_admin", False),
            "has_access": result.get("has_access", False),
            "message": result["message"]
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail="Employee ID должен содержать только цифры"
        )

@router.post("/check-user")
async def check_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Проверка существования пользователя"""
    try:
        auth_service = AuthService(db)
        result = await auth_service.check_user_exists(user_data.employee_id)
        
        return {
            "exists": result["exists"],
            "user": UserResponse.model_validate(result["user"]) if result["user"] else None
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail="Employee ID должен содержать только цифры"
        )