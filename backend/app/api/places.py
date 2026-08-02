from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.services.booking_service import BookingService
from app.models.booking import Booking
from app.models.user import User
from datetime import datetime, timezone

router = APIRouter(prefix="/api/places", tags=["places"])

@router.get("/status")
async def get_places_status(
    user_id: int = None,
    date: str = None,
    db: AsyncSession = Depends(get_db)
):
    booking_service = BookingService(db)
    
    selected_date = None
    if date:
        try:
            selected_date = datetime.fromisoformat(date)
            if selected_date.tzinfo is None:
                selected_date = selected_date.replace(tzinfo=timezone.utc)
            selected_date = selected_date.replace(hour=0, minute=0, second=0, microsecond=0)
        except ValueError:
            pass
    
    places = await booking_service.get_places_with_status(user_id, selected_date)
    
    # Добавляем employee_id для забронированных мест
    for place in places:
        if place.get('booked_by'):
            result = await db.execute(
                select(User.employee_id).where(User.id == place['booked_by'])
            )
            employee_id = result.scalar_one_or_none()
            place['booked_employee_id'] = employee_id or str(place['booked_by'])
    
    return {"places": places}