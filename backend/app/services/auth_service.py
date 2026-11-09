from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
import hashlib

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_by_employee_id(self, employee_id: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.employee_id == employee_id)
        )
        return result.scalar_one_or_none()
    
    async def register_user(self, employee_id: str, password: str) -> dict:
        """Регистрация нового пользователя"""
        # Проверяем, существует ли пользователь
        existing_user = await self.get_user_by_employee_id(employee_id)
        if existing_user:
            return {
                "success": False,
                "message": "Пользователь с таким ID уже существует",
                "user": existing_user
            }
        
        # Создаем нового пользователя
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        user = User(
            employee_id=employee_id,
            has_access=False,
            role="user",
            password=hashed_password
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return {
            "success": True,
            "message": "Пользователь зарегистрирован",
            "user": user
        }
    
    async def login_user(self, employee_id: str, password: str) -> dict:
        """Логин пользователя"""
        user = await self.get_user_by_employee_id(employee_id)
        
        if not user:
            return {
                "success": False,
                "message": "Пользователь не найден"
            }
        
        # Проверяем пароль
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        if user.password != hashed_password:
            return {
                "success": False,
                "message": "Неверный пароль"
            }
        
        if user.role in ["admin", "super_admin"]:
            return {
                "success": True,
                "user": user,
                "is_admin": True,
                "has_access": True,
                "message": "Добро пожаловать, администратор!"
            }
        elif user.has_access:
            return {
                "success": True,
                "user": user,
                "is_admin": False,
                "has_access": True,
                "message": "Добро пожаловать!"
            }
        else:
            return {
                "success": True,
                "user": user,
                "is_admin": False,
                "has_access": False,
                "message": "Ваш доступ ожидает подтверждения от администратора"
            }
    
    async def check_user_exists(self, employee_id: str) -> dict:
        """Проверка существования пользователя"""
        user = await self.get_user_by_employee_id(employee_id)
        return {
            "exists": user is not None,
            "user": user
        }
    
    async def authenticate_admin(self, employee_id: str, password: str) -> User | None:
        user = await self.get_user_by_employee_id(employee_id)
        if not user or user.role not in ["admin", "super_admin"]:
            return None
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        if user.password == hashed_password:
            return user
        
        return None