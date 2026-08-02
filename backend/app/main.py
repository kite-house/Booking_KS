from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, places, bookings, admin
from app.core.database import engine
from app.models import user, ks_place, booking

app = FastAPI(title="KS Booking Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Только для разработки!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include routers
app.include_router(auth.router)
app.include_router(places.router)
app.include_router(bookings.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "KS Booking Service is running"}

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(user.Base.metadata.create_all)
        await conn.run_sync(ks_place.Base.metadata.create_all)
        await conn.run_sync(booking.Base.metadata.create_all)