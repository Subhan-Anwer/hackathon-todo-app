"""FastAPI application entry point."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Hackathon Todo API",
    description="Multi-user todo application API with JWT authentication",
    version="1.0.0",
)

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Root endpoint for health check."""
    return {
        "message": "Hackathon Todo API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint (UNPROTECTED).

    This endpoint does NOT require authentication and is used for:
    - Load balancer health checks
    - Monitoring and alerting systems
    - Container orchestration readiness probes
    - Uptime monitoring services

    Returns:
        dict: Service health status with timestamp

    Security Note:
        This endpoint intentionally bypasses authentication to allow
        external monitoring systems to verify service availability.
    """
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "service": "todo-api",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }


# Mount API routers
from app.api.v1.tasks import router as tasks_router

app.include_router(tasks_router, prefix="/api/v1", tags=["tasks"])
