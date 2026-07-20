"""
Error handlers for The Essence Journal System.
Provides centralized exception handling for validation, authentication, and authorization errors.

Requirements: 13.1, 13.2, 13.7
"""
from datetime import datetime
from typing import Union
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from jose import JWTError


class AuthenticationError(Exception):
    """Custom exception for authentication failures."""
    
    def __init__(self, message: str = "Authentication failed", details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class AuthorizationError(Exception):
    """Custom exception for authorization failures."""
    
    def __init__(self, message: str = "Access denied", details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class BusinessRuleError(Exception):
    """Custom exception for business rule violations."""
    
    def __init__(self, message: str = "Business rule violation", details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class CertificateValidationError(Exception):
    """Custom exception for certificate validation errors."""
    
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")


async def validation_exception_handler(
    request: Request, 
    exc: Union[RequestValidationError, ValidationError]
) -> JSONResponse:
    """
    Handle validation errors from Pydantic models and FastAPI request validation.
    
    Returns detailed information about which fields failed validation and why.
    
    Requirements: 13.1, 13.2
    
    Args:
        request: The incoming HTTP request
        exc: The validation exception
        
    Returns:
        JSONResponse with 400 status code and validation error details
    """
    errors = []
    
    # Extract validation errors
    if isinstance(exc, RequestValidationError):
        for error in exc.errors():
            field_path = " -> ".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field_path,
                "message": error["msg"],
                "type": error["type"],
            })
    elif isinstance(exc, ValidationError):
        for error in exc.errors():
            field_path = " -> ".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field_path,
                "message": error["msg"],
                "type": error["type"],
            })
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input data",
                "details": {
                    "errors": errors,
                    "total_errors": len(errors),
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


async def authentication_exception_handler(
    request: Request, 
    exc: Union[AuthenticationError, JWTError]
) -> JSONResponse:
    """
    Handle authentication errors including invalid tokens and credentials.
    
    Requirements: 13.7
    
    Args:
        request: The incoming HTTP request
        exc: The authentication exception
        
    Returns:
        JSONResponse with 401 status code and authentication error details
    """
    if isinstance(exc, AuthenticationError):
        message = exc.message
        details = exc.details
    else:
        message = "Invalid or expired authentication token"
        details = {"reason": str(exc)}
    
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": {
                "code": "AUTHENTICATION_ERROR",
                "message": message,
                "details": details,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


async def authorization_exception_handler(
    request: Request, 
    exc: AuthorizationError
) -> JSONResponse:
    """
    Handle authorization errors when users lack required permissions.
    
    Requirements: 13.7
    
    Args:
        request: The incoming HTTP request
        exc: The authorization exception
        
    Returns:
        JSONResponse with 403 status code and authorization error details
    """
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "error": {
                "code": "AUTHORIZATION_ERROR",
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


async def business_rule_exception_handler(
    request: Request, 
    exc: BusinessRuleError
) -> JSONResponse:
    """
    Handle business rule violations (e.g., publishing non-accepted papers).
    
    Requirements: 13.1, 13.7
    
    Args:
        request: The incoming HTTP request
        exc: The business rule exception
        
    Returns:
        JSONResponse with 400 status code and business rule error details
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "BUSINESS_RULE_VIOLATION",
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


async def certificate_validation_exception_handler(
    request: Request,
    exc: CertificateValidationError
) -> JSONResponse:
    """
    Handle certificate validation errors with specific field details.
    
    Requirements: 11.1, 12.1, 12.2, 12.3, 12.4, 12.5
    
    Args:
        request: The incoming HTTP request
        exc: The certificate validation exception
        
    Returns:
        JSONResponse with 400 status code and validation error details
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Certificate validation failed",
                "details": {
                    "field": exc.field,
                    "message": exc.message,
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


async def integrity_error_handler(
    request: Request, 
    exc: IntegrityError
) -> JSONResponse:
    """
    Handle database integrity errors (foreign key violations, unique constraints).
    
    Requirements: 13.7
    
    Args:
        request: The incoming HTTP request
        exc: The integrity error
        
    Returns:
        JSONResponse with 409 status code for conflicts or 400 for other integrity errors
    """
    error_message = str(exc.orig) if hasattr(exc, 'orig') else str(exc)
    
    # Determine if it's a unique constraint violation (conflict)
    is_conflict = any(keyword in error_message.lower() for keyword in ["duplicate", "unique"])
    
    status_code = status.HTTP_409_CONFLICT if is_conflict else status.HTTP_400_BAD_REQUEST
    error_code = "DUPLICATE_ENTRY" if is_conflict else "INTEGRITY_ERROR"
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": error_code,
                "message": "Database integrity constraint violated",
                "details": {
                    "reason": "A record with this information already exists" if is_conflict 
                             else "Database constraint violation",
                    "technical_details": error_message,
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


async def database_exception_handler(
    request: Request, 
    exc: SQLAlchemyError
) -> JSONResponse:
    """
    Handle general database errors.
    
    Requirements: 13.7
    
    Args:
        request: The incoming HTTP request
        exc: The database exception
        
    Returns:
        JSONResponse with 500 status code and database error details
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database error occurred",
                "details": {
                    "reason": "The operation could not be completed due to a database error",
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


async def generic_exception_handler(
    request: Request, 
    exc: Exception
) -> JSONResponse:
    """
    Handle all other unexpected exceptions.
    
    Provides a generic error response while logging the full exception details.
    
    Requirements: 13.7
    
    Args:
        request: The incoming HTTP request
        exc: The exception
        
    Returns:
        JSONResponse with 500 status code and generic error message
    """
    # Log the full exception for debugging (in production, use proper logging)
    print(f"Unhandled exception: {type(exc).__name__}: {str(exc)}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {
                    "reason": "The server encountered an unexpected condition",
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        },
    )


def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI application.
    
    Args:
        app: The FastAPI application instance
    """
    # Validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(CertificateValidationError, certificate_validation_exception_handler)
    
    # Authentication errors
    app.add_exception_handler(AuthenticationError, authentication_exception_handler)
    app.add_exception_handler(JWTError, authentication_exception_handler)
    
    # Authorization errors
    app.add_exception_handler(AuthorizationError, authorization_exception_handler)
    
    # Business rule errors
    app.add_exception_handler(BusinessRuleError, business_rule_exception_handler)
    
    # Database errors
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    
    # Generic errors (catch-all)
    app.add_exception_handler(Exception, generic_exception_handler)
