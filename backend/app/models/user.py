from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    has_access = Column(Boolean, default=False)
    role = Column(String, default="user")  # user, admin, super_admin
    password = Column(String, nullable=True)  # Пароль для всех пользователей
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())