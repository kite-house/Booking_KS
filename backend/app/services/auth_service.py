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
    
    async def create_user(self, employee_id: str) -> User:
        user = User(
            employee_id=employee_id,
            has_access=False,
            role="user"
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def check_admin_password_required(self, employee_id: str) -> dict:
        user = await self.get_user_by_employee_id(employee_id)
        
        if not user:
            user = await self.create_user(employee_id)
            return {
                "user": user,
                "requires_password": False,
                "is_admin": False,
                "message": "Запрос на доступ отправлен администратору",
                "has_access": False
            }
        
        is_admin = user.role in ["admin", "super_admin"]
        has_password = user.password is not None and user.password != ""
        
        if is_admin and has_password:
            return {
                "user": user,
                "requires_password": True,
                "is_admin": True,
                "message": "Введите пароль администратора",
                "has_access": True
            }
        elif is_admin and not has_password:
            return {
                "user": user,
                "requires_password": False,
                "is_admin": True,
                "message": "Ошибка: у администратора не установлен пароль",
                "has_access": False
            }
        elif user.has_access:
            return {
                "user": user,
                "requires_password": False,
                "is_admin": False,
                "message": "Добро пожаловать!",
                "has_access": True
            }
        else:
            return {
                "user": user,
                "requires_password": False,
                "is_admin": False,
                "message": "Ожидайте подтверждения доступа от администратора",
                "has_access": False
            }
    
    async def verify_admin_password(self, employee_id: str, password: str) -> dict:
        user = await self.get_user_by_employee_id(employee_id)
        
        if not user:
            return {
                "success": False,
                "message": "Пользователь не найден"
            }
        
        if user.role not in ["admin", "super_admin"]:
            return {
                "success": False,
                "message": "У пользователя нет прав администратора"
            }
        
        if not user.password:
            return {
                "success": False,
                "message": "У администратора не установлен пароль"
            }
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        if user.password == hashed_password:
            return {
                "success": True,
                "user": user,
                "message": "Пароль верный"
            }
        else:
            return {
                "success": False,
                "message": "Неверный пароль"
            }
    
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
    
    async def create_admin(self, employee_id: str, password: str) -> User:
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        user = User(
            employee_id=employee_id,
            has_access=True,
            role="admin",
            password=hashed_password
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def update_admin_password(self, employee_id: str, new_password: str) -> bool:
        user = await self.get_user_by_employee_id(employee_id)
        if not user or user.role not in ["admin", "super_admin"]:
            return False
        
        user.password = hashlib.sha256(new_password.encode()).hexdigest()
        await self.db.commit()
        return True