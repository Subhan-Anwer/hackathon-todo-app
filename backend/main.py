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
    """Health check endpoint."""
    return {"status": "healthy"}


# Mount API routers
from app.api.v1.tasks import router as tasks_router

app.include_router(tasks_router, prefix="/api/v1", tags=["tasks"])
