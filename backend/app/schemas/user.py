from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserBase(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    has_access: bool
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserAccessUpdate(BaseModel):
    has_access: bool