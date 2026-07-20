"""
Main FastAPI application for The Essence Journal System.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings, ensure_storage_directories
from app.middleware.error_handler import register_exception_handlers

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Journal & Publications Management System for SPSU",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# Register exception handlers
register_exception_handlers(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure storage directories exist on startup
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    ensure_storage_directories()
    print(f"✓ Storage directories initialized")
    print(f"✓ {settings.APP_NAME} v{settings.APP_VERSION} started")

# Mount storage directory for serving uploaded files
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint returning API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}

# TODO: Register routers as they are implemented
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.authors.router import router as authors_router
from app.reviewers.router import router as reviewers_router
from app.papers.router import router as papers_router
from app.reviews.router import router as reviews_router
from app.publications.router import router as publications_router
from app.audit.router import router as audit_router
from app.statistics.router import router as statistics_router
from app.certificates.router import router as certificates_router
from app.events.router import router as events_router
from app.content.router import router as content_router
from app.audit.notification_router import router as notification_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(authors_router)
app.include_router(reviewers_router)
app.include_router(papers_router)
app.include_router(reviews_router)
app.include_router(publications_router)
app.include_router(audit_router)
app.include_router(statistics_router)
app.include_router(certificates_router)
app.include_router(events_router)
app.include_router(content_router)
app.include_router(notification_router)

