"""
Configuration settings for The Essence Journal System.
Manages environment variables and application settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "The Essence - Journal & Publications Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:123456@localhost:3306/essence_journal"
    
    # Security
    SECRET_KEY: str = "3807c2e806071445820cb4a0c474fbde266657347794f9ee53d43d3d08358c0d"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Storage
    STORAGE_PATH: str = "./storage"
    MANUSCRIPTS_PATH: str = "./storage/manuscripts"
    REVIEWS_PATH: str = "./storage/reviews"
    PUBLISHED_PATH: str = "./storage/published"
    CERTIFICATES_PATH: str = "./storage/certificates"
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_MIME_TYPES: list = ["application/pdf"]
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()


# Ensure storage directories exist
def ensure_storage_directories():
    """Create storage directories if they don't exist."""
    directories = [
        settings.STORAGE_PATH,
        settings.MANUSCRIPTS_PATH,
        settings.REVIEWS_PATH,
        settings.PUBLISHED_PATH,
        settings.CERTIFICATES_PATH,
    ]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
