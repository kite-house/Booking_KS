from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
import re

class UserBase(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)

class UserCreate(UserBase):
    @validator('employee_id')
    def validate_employee_id(cls, v):
        if not re.match(r'^\d+$', v):
            raise ValueError('Employee ID должен содержать только цифры')
        return v

class AdminPasswordCheck(BaseModel):
    employee_id: str
    password: str

class AdminPasswordResponse(BaseModel):
    requires_password: bool
    is_admin: bool
    message: str

class UserResponse(UserBase):
    id: int
    has_access: bool
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserAccessUpdate(BaseModel):
    has_access: bool