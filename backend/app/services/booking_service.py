from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from app.models.booking import Booking
from app.models.ks_place import KSPlace, PlaceBlock
from app.models.user import User
from app.schemas.booking import BookingCreate

class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_places(self) -> List[KSPlace]:
        result = await self.db.execute(
            select(KSPlace).order_by(KSPlace.place_number)
        )
        return result.scalars().all()
    
    async def get_places_with_status(self, user_id: Optional[int] = None, date: Optional[datetime] = None) -> List[dict]:
        places = await self.get_all_places()
        
        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if date is None:
            date = today
        else:
            if date.tzinfo is None:
                date = date.replace(tzinfo=timezone.utc)
            date = date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        start_date = date
        end_date = date + timedelta(days=1)
        
        bookings_result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.booking_date >= start_date,
                    Booking.booking_date < end_date
                )
            )
        )
        bookings = bookings_result.scalars().all()
        
        booked_places = {b.place_id: b for b in bookings}
        
        user_has_booking = False
        if user_id:
            user_booking_result = await self.db.execute(
                select(Booking).where(
                    and_(
                        Booking.user_id == user_id,
                        Booking.booking_date >= start_date,
                        Booking.booking_date < end_date
                    )
                )
            )
            user_has_booking = user_booking_result.scalar_one_or_none() is not None
        
        result = []
        for place in places:
            booking = booked_places.get(place.id)
            is_booked = booking is not None
            
            result.append({
                "place_id": place.id,
                "place_number": place.place_number,
                "block": place.block.value if hasattr(place.block, 'value') else place.block,
                "is_booked": is_booked,
                "booked_by": booking.user_id if booking else None,
                "booking_id": booking.id if booking else None,  # <-- ДОБАВЛЯЕМ booking_id
                "booking_date": booking.booking_date if booking else None,
                "user_has_booking": user_has_booking,
                "selected_date": date.isoformat() if date else None
            })
        
        return result
    
    async def create_booking(self, user_id: int, booking_data: BookingCreate) -> Booking:
        place_result = await self.db.execute(
            select(KSPlace).where(KSPlace.id == booking_data.place_id)
        )
        place = place_result.scalar_one_or_none()
        if not place:
            raise ValueError("Место не найдено")
        
        booking_date = booking_data.booking_date
        if booking_date.tzinfo is None:
            booking_date = booking_date.replace(tzinfo=timezone.utc)
        booking_date = booking_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_later = today + timedelta(days=8)
        
        if booking_date < today or booking_date >= week_later:
            raise ValueError("Бронирование доступно только на неделю вперед")
        
        start_date = booking_date
        end_date = booking_date + timedelta(days=1)
        
        existing_booking = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.place_id == booking_data.place_id,
                    Booking.booking_date >= start_date,
                    Booking.booking_date < end_date
                )
            )
        )
        if existing_booking.scalar_one_or_none():
            raise ValueError("Это место уже забронировано на выбранную дату")
        
        user_booking = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.user_id == user_id,
                    Booking.booking_date >= start_date,
                    Booking.booking_date < end_date
                )
            )
        )
        if user_booking.scalar_one_or_none():
            raise ValueError("Вы уже забронировали место на эту дату")
        
        booking = Booking(
            user_id=user_id,
            place_id=booking_data.place_id,
            booking_date=booking_date
        )
        
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        return booking
    
    async def get_user_bookings(self, user_id: int) -> List[Booking]:
        result = await self.db.execute(
            select(Booking)
            .where(Booking.user_id == user_id)
            .order_by(Booking.booking_date.desc())
        )
        return result.scalars().all()
    
    async def get_all_bookings(self) -> List[dict]:
        result = await self.db.execute(
            select(Booking, KSPlace, User)
            .join(KSPlace, Booking.place_id == KSPlace.id)
            .join(User, Booking.user_id == User.id)
            .order_by(Booking.booking_date.desc())
        )
        rows = result.all()
        return [
            {
                "id": booking.id,
                "user_id": booking.user_id,
                "employee_id": user.employee_id,
                "place_id": booking.place_id,
                "place_number": place.place_number,
                "block": place.block.value if hasattr(place.block, 'value') else place.block,
                "booking_date": booking.booking_date,
                "created_at": booking.created_at
            }
            for booking, place, user in rows
        ]
    
    async def cancel_booking(self, booking_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.id == booking_id,
                    Booking.user_id == user_id
                )
            )
        )
        booking = result.scalar_one_or_none()
        if not booking:
            return False
        
        await self.db.delete(booking)
        await self.db.commit()
        return True