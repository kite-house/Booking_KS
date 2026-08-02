from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Dict, Tuple
from functools import lru_cache
from pathlib import Path
import random


ROOT_DIR = Path(__file__).parent.parent.parent.parent
DOTENV = ROOT_DIR / '.env'

class Settings(BaseSettings):
    MODE: str

    DB_USER: str
    DB_PASS: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str

    REDIS_HOST: str
    REDIS_PORT: int 
    REDIS_PASSWORD: str
    REDIS_CACHE_TTL: int = 86400  # 24 часа

    APP_NAME: str = "URL-Shortener"
    VERSION: str = "1.0.0"

    API_BASE_URL: str = "http://127.0.0.1:8000"
    
    ALLOWED_ORIGINS: List[str] = ["*"]
    ALLOWED_METHODS: List[str] = ["*"]
    ALLOWED_HEADERS: List[str] = ["*"]

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = SettingsConfigDict(
        env_file= str(DOTENV),
        env_file_encoding='utf-8',
        extra='ignore' 
    )

    @property
    def DB_URL(self):
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    return settings

settings = get_settings()