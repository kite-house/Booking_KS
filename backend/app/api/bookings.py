from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.booking_service import BookingService
from app.schemas.booking import BookingCreate, BookingResponse
from datetime import datetime

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

@router.post("/")
async def create_booking(
    booking_data: BookingCreate,
    user_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    if user_id is None and hasattr(booking_data, 'user_id'):
        user_id = booking_data.user_id
    
    if user_id is None:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    try:
        booking_service = BookingService(db)
        booking = await booking_service.create_booking(user_id, booking_data)
        return BookingResponse.model_validate(booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/{user_id}")
async def get_user_bookings(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    booking_service = BookingService(db)
    bookings = await booking_service.get_user_bookings(user_id)
    return [BookingResponse.model_validate(b) for b in bookings]

@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    booking_service = BookingService(db)
    success = await booking_service.cancel_booking(booking_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    return {"message": "Бронирование отменено"}