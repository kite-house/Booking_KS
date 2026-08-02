from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.user import User

class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_pending_users(self) -> list[User]:
        result = await self.db.execute(
            select(User)
            .where(User.has_access == False)
            .order_by(User.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_all_users(self) -> list[User]:
        result = await self.db.execute(
            select(User)
            .order_by(User.created_at.desc())
        )
        return result.scalars().all()
    
    async def grant_access(self, user_id: int) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None
        
        user.has_access = True
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def revoke_access(self, user_id: int) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None
        
        user.has_access = False
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def delete_user(self, user_id: int) -> bool:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return False
        
        await self.db.delete(user)
        await self.db.commit()
        return True