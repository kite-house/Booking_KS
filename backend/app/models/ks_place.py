from sqlalchemy import Column, Integer, String, Enum
from app.core.database import Base
import enum

class PlaceBlock(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"

class KSPlace(Base):
    __tablename__ = "ks_places"
    
    id = Column(Integer, primary_key=True, index=True)
    place_number = Column(Integer, unique=True, nullable=False)  # 1-60
    block = Column(Enum(PlaceBlock), nullable=False)
    is_active = Column(Integer, default=True)