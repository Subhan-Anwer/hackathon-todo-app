"""Database configuration and connection management for Neon PostgreSQL."""
import os
from sqlmodel import create_engine, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create engine with connection pooling optimized for Neon Serverless
# - pool_pre_ping: Verify connections before using them (handles serverless suspend/resume)
# - pool_recycle: Recycle connections to prevent stale connections
# - echo: Log SQL for debugging (disable in production)
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_size=5,
    max_overflow=10,
)


def get_session():
    """
    Dependency function to provide database sessions.

    Yields a database session and ensures it's closed after use.
    Use with FastAPI's Depends() for automatic session management.
    """
    with Session(engine) as session:
        yield session
