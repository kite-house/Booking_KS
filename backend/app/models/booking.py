from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("ks_places.id"), nullable=False)
    booking_date = Column(DateTime(timezone=True), nullable=False)  # Дата бронирования
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    place = relationship("KSPlace")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'booking_date', name='unique_user_booking_per_day'),
    )