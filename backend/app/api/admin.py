from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.services.admin_service import AdminService
from app.services.booking_service import BookingService
from app.models.booking import Booking
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/pending-users")
async def get_pending_users(
    db: AsyncSession = Depends(get_db)
):
    admin_service = AdminService(db)
    users = await admin_service.get_pending_users()
    return [UserResponse.model_validate(u) for u in users]

@router.get("/all-users")
async def get_all_users(
    db: AsyncSession = Depends(get_db)
):
    admin_service = AdminService(db)
    users = await admin_service.get_all_users()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/grant-access/{user_id}")
async def grant_access(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    admin_service = AdminService(db)
    user = await admin_service.grant_access(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return UserResponse.model_validate(user)

@router.post("/revoke-access/{user_id}")
async def revoke_access(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    admin_service = AdminService(db)
    user = await admin_service.revoke_access(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return UserResponse.model_validate(user)

@router.delete("/delete-user/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    admin_service = AdminService(db)
    success = await admin_service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"message": "Пользователь удален"}

@router.delete("/cancel-booking/{booking_id}")
async def cancel_booking(
    booking_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    await db.delete(booking)
    await db.commit()
    return {"message": "Бронирование отменено"}

@router.get("/all-bookings")
async def get_all_bookings(
    db: AsyncSession = Depends(get_db)
):
    booking_service = BookingService(db)
    bookings = await booking_service.get_all_bookings()
    return bookings