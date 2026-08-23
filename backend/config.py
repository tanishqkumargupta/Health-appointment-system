import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("JWT_SECRET", "default-flask-secret-key")
    
    # Database Configuration (PostgreSQL in production, SQLite locally fallback)
    db_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "default-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # CORS Configuration
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # External APIs
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    # Email Settings
    EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
    EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
