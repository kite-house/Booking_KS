from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate
from datetime import datetime

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_by_employee_id(self, employee_id: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.employee_id == employee_id)
        )
        return result.scalar_one_or_none()
    
    async def create_user(self, employee_id: str) -> User:
        user = User(
            employee_id=employee_id,
            has_access=False,
            role="user"  # Простая строка
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def authenticate_user(self, employee_id: str) -> dict:
        user = await self.get_user_by_employee_id(employee_id)
        
        if not user:
            user = await self.create_user(employee_id)
            return {
                "user": user,
                "is_new": True,
                "has_access": False,
                "message": "Запрос на доступ отправлен администратору"
            }
        
        if user.has_access:
            return {
                "user": user,
                "is_new": False,
                "has_access": True,
                "message": "Добро пожаловать!"
            }
        else:
            return {
                "user": user,
                "is_new": False,
                "has_access": False,
                "message": "Ожидайте подтверждения доступа от администратора"
            }