from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
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
        
        # Получаем только активные бронирования
        bookings_result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.booking_date >= start_date,
                    Booking.booking_date < end_date,
                    Booking.status == "active"
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
                        Booking.booking_date < end_date,
                        Booking.status == "active"
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
                "booking_id": booking.id if booking else None,
                "booking_date": booking.booking_date if booking else None,
                "user_has_booking": user_has_booking,
                "selected_date": date.isoformat() if date else None,
                "can_cancel": booking and booking.user_id == user_id and booking.booking_date > today
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
        week_later = today + timedelta(days=7)
        
        if booking_date < today or booking_date >= week_later:
            raise ValueError("Бронирование доступно только на неделю вперед")
        
        start_date = booking_date
        end_date = booking_date + timedelta(days=1)
        
        # Проверяем только активные бронирования
        existing_booking = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.place_id == booking_data.place_id,
                    Booking.booking_date >= start_date,
                    Booking.booking_date < end_date,
                    Booking.status == "active"
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
                    Booking.booking_date < end_date,
                    Booking.status == "active"
                )
            )
        )
        if user_booking.scalar_one_or_none():
            raise ValueError("Вы уже забронировали место на эту дату")
        
        booking = Booking(
            user_id=user_id,
            place_id=booking_data.place_id,
            booking_date=booking_date,
            status="active"
        )
        
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        return booking
    
    async def cancel_booking_by_user(self, booking_id: int, user_id: int) -> dict:
        """Отмена бронирования пользователем"""
        result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.id == booking_id,
                    Booking.user_id == user_id,
                    Booking.status == "active"
                )
            )
        )
        booking = result.scalar_one_or_none()
        if not booking:
            return {"success": False, "message": "Бронирование не найдено"}
        
        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Нельзя отменить бронирование на сегодня
        if booking.booking_date == today:
            return {"success": False, "message": "Нельзя отменить бронирование на сегодня"}
        
        booking.status = "cancelled_by_user"
        booking.cancelled_at = now
        await self.db.commit()
        
        return {
            "success": True, 
            "message": "Бронирование отменено",
            "booking": booking
        }
    
    async def cancel_booking_by_user(self, booking_id: int, user_id: int) -> dict:
        """Отмена бронирования пользователем"""
        result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.id == booking_id,
                    Booking.user_id == user_id,
                    Booking.status == "active"
                )
            )
        )
        booking = result.scalar_one_or_none()
        if not booking:
            return {"success": False, "message": "Бронирование не найдено"}
        
        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Нельзя отменить бронирование на сегодня
        if booking.booking_date == today:
            return {"success": False, "message": "Нельзя отменить бронирование на сегодня"}
        
        # Нельзя отменить прошедшее бронирование
        if booking.booking_date < today:
            return {"success": False, "message": "Нельзя отменить прошедшее бронирование"}
        
        booking.status = "cancelled_by_user"
        booking.cancelled_at = now
        await self.db.commit()
        
        return {
            "success": True, 
            "message": "Бронирование отменено",
            "booking": booking
        }
    
    async def get_all_bookings_with_history(self) -> List[dict]:
        """Получение полной истории всех бронирований с действиями"""
        # Сначала архивируем прошедшие
        await self.archive_past_bookings()
        
        # Получаем все бронирования с данными о пользователях
        result = await self.db.execute(
            select(Booking, KSPlace, User)
            .join(KSPlace, Booking.place_id == KSPlace.id)
            .join(User, Booking.user_id == User.id)
            .order_by(Booking.created_at.desc())  # Сортируем по дате создания
        )
        rows = result.all()
        
        bookings_list = []
        for booking, place, user in rows:
            # Формируем запись с действием
            action = "Создано"
            action_color = "#78909c" 
            action_bg = "rgba(120, 144, 156, 0.15)"
            
            if booking.status == "cancelled_by_user":
                action = "Отменено пользователем"
                action_color = "#ff1744"
                action_bg = "rgba(255, 23, 68, 0.15)"
            elif booking.status == "cancelled_by_admin":
                action = "Отменено администратором"
                action_color = "#ff6d00"
                action_bg = "rgba(255, 109, 0, 0.15)"
            elif booking.status == "archived":
                action = "Выполнено"
                action_color = "#00c853"
                action_bg = "rgba(0, 200, 83, 0.15)"
            
            booking_dict = {
                "id": booking.id,
                "user_id": booking.user_id,
                "employee_id": user.employee_id,
                "place_id": booking.place_id,
                "place_number": place.place_number,
                "block": place.block.value if hasattr(place.block, 'value') else place.block,
                "booking_date": booking.booking_date,
                "created_at": booking.created_at,
                "status": booking.status,
                "cancelled_at": booking.cancelled_at,
                "action": action,
                "action_color": action_color,
                "action_bg": action_bg
            }
            
            # Если отменено - добавляем информацию о том, кто отменил
            if booking.cancelled_by:
                canceller_result = await self.db.execute(
                    select(User.employee_id).where(User.id == booking.cancelled_by)
                )
                canceller_employee_id = canceller_result.scalar_one_or_none()
                booking_dict["cancelled_by"] = booking.cancelled_by
                booking_dict["canceller_employee_id"] = canceller_employee_id
                booking_dict["action"] = f"Отменено администратором ({canceller_employee_id})"
            
            bookings_list.append(booking_dict)
        
        return bookings_list
    
    async def get_user_active_bookings(self, user_id: int) -> List[Booking]:
        """Получение активных бронирований пользователя"""
        result = await self.db.execute(
            select(Booking)
            .where(
                and_(
                    Booking.user_id == user_id,
                    Booking.status == "active"
                )
            )
            .order_by(Booking.booking_date.asc())
        )
        return result.scalars().all()
    
    async def get_user_bookings(self, user_id: int) -> List[Booking]:
        result = await self.db.execute(
            select(Booking)
            .where(Booking.user_id == user_id)
            .order_by(Booking.booking_date.desc())
        )
        return result.scalars().all()

    async def archive_past_bookings(self) -> int:
        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.booking_date < today,
                    Booking.status == "active"
                )
            )
        )
        past_bookings = result.scalars().all()
        
        count = 0
        for booking in past_bookings:
            booking.status = "archived"
            count += 1
        
        if count > 0:
            await self.db.commit()
            print(f"📦 Archived {count} past bookings")
        
        return count

    async def cancel_booking_by_admin(self, booking_id: int, admin_id: int) -> dict:
        """Отмена бронирования администратором"""
        # Находим бронирование
        result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.id == booking_id,
                    Booking.status == "active"
                )
            )
        )
        booking = result.scalar_one_or_none()
        if not booking:
            return {"success": False, "message": "Бронирование не найдено или уже отменено"}
        
        # Проверяем, что администратор существует
        admin_result = await self.db.execute(
            select(User).where(User.id == admin_id)
        )
        admin = admin_result.scalar_one_or_none()
        if not admin:
            return {"success": False, "message": "Администратор не найден"}
        
        # Отменяем бронирование
        booking.status = "cancelled_by_admin"
        booking.cancelled_by = admin_id
        booking.cancelled_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        
        return {
            "success": True,
            "message": "Бронирование отменено администратором",
            "booking": booking
        }