from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BookingBase(BaseModel):
    place_id: int
    booking_date: datetime
    user_id: Optional[int] = None  # Добавим опционально

class BookingCreate(BookingBase):
    pass

class BookingResponse(BaseModel):
    id: int
    user_id: int
    place_id: int
    booking_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class PlaceStatusResponse(BaseModel):
    place_id: int
    place_number: int
    block: str
    is_booked: bool
    booked_by: Optional[int] = None
    booking_date: Optional[datetime] = None