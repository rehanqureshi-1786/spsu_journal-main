"""
File handling utilities for manuscript management.
Provides file validation, hashing, anonymization, and storage operations.
"""
import os
import hashlib
import uuid
import shutil
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings


def validate_file_type(file: UploadFile) -> bool:
    """
    Validate file MIME type.
    
    Args:
        file: The uploaded file
        
    Returns:
        True if file type is valid
        
    Raises:
        HTTPException: If file type is invalid
    """
    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only {', '.join(settings.ALLOWED_MIME_TYPES)} allowed."
        )
    return True


def validate_file_size(file: UploadFile) -> bool:
    """
    Validate file size.
    
    Args:
        file: The uploaded file
        
    Returns:
        True if file size is valid
        
    Raises:
        HTTPException: If file size exceeds limit
    """
    # Read file to check size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB"
        )
    return True


def calculate_file_hash(file: UploadFile) -> str:
    """
    Calculate SHA-256 hash of file content.
    
    Args:
        file: The uploaded file
        
    Returns:
        Hexadecimal hash string
    """
    sha256_hash = hashlib.sha256()
    
    # Read file in chunks to handle large files
    file.file.seek(0)
    for chunk in iter(lambda: file.file.read(4096), b""):
        sha256_hash.update(chunk)
    
    file.file.seek(0)  # Reset file pointer
    return sha256_hash.hexdigest()


def generate_anonymized_filename(paper_uuid: str, version: int = 1) -> str:
    """
    Generate anonymized filename for manuscript.
    Format: PAPER-{UUID}-{version:04d}.pdf
    
    Args:
        paper_uuid: The paper's UUID
        version: Version number (default: 1)
        
    Returns:
        Anonymized filename string
    """
    return f"PAPER-{paper_uuid}-{version:04d}.pdf"


def save_manuscript(file: UploadFile, filename: str) -> str:
    """
    Save manuscript file to storage.
    
    Args:
        file: The uploaded file
        filename: The filename to save as
        
    Returns:
        Full path to saved file
        
    Raises:
        HTTPException: If file save fails
    """
    try:
        # Ensure manuscripts directory exists
        os.makedirs(settings.MANUSCRIPTS_PATH, exist_ok=True)
        
        # Full path for the file
        file_path = os.path.join(settings.MANUSCRIPTS_PATH, filename)
        
        # Save file
        file.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )


def save_review_file(file: UploadFile, filename: str) -> str:
    """
    Save review file to storage.
    
    Args:
        file: The uploaded file
        filename: The filename to save as
        
    Returns:
        Full path to saved file
        
    Raises:
        HTTPException: If file save fails
    """
    try:
        # Ensure reviews directory exists
        os.makedirs(settings.REVIEWS_PATH, exist_ok=True)
        
        # Full path for the file
        file_path = os.path.join(settings.REVIEWS_PATH, filename)
        
        # Save file
        file.file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save review file: {str(e)}"
        )


def move_to_published(manuscript_filename: str, volume: int, issue: int) -> str:
    """
    Move manuscript from manuscripts directory to published directory.
    
    Args:
        manuscript_filename: Current filename in manuscripts directory
        volume: Volume number
        issue: Issue number
        
    Returns:
        New path in published directory
        
    Raises:
        HTTPException: If file move fails
    """
    try:
        # Create volume/issue directory structure
        published_dir = os.path.join(settings.PUBLISHED_PATH, str(volume), str(issue))
        os.makedirs(published_dir, exist_ok=True)
        
        # Source and destination paths
        source_path = os.path.join(settings.MANUSCRIPTS_PATH, manuscript_filename)
        dest_path = os.path.join(published_dir, manuscript_filename)
        
        # Move file
        if os.path.exists(source_path):
            shutil.move(source_path, dest_path)
        else:
            raise FileNotFoundError(f"Manuscript file not found: {manuscript_filename}")
        
        return dest_path
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to move file to published directory: {str(e)}"
        )


def get_file_path(filename: str, file_type: str = "manuscript") -> str:
    """
    Get full path for a file based on type.
    
    Args:
        filename: The filename
        file_type: Type of file ("manuscript", "review", "published")
        
    Returns:
        Full file path
    """
    if file_type == "manuscript":
        return os.path.join(settings.MANUSCRIPTS_PATH, filename)
    elif file_type == "review":
        return os.path.join(settings.REVIEWS_PATH, filename)
    elif file_type == "published":
        # For published files, filename should include volume/issue path
        return os.path.join(settings.PUBLISHED_PATH, filename)
    else:
        raise ValueError(f"Invalid file type: {file_type}")


def delete_file(filename: str, file_type: str = "manuscript") -> bool:
    """
    Delete a file from storage.
    
    Args:
        filename: The filename to delete
        file_type: Type of file ("manuscript", "review", "published")
        
    Returns:
        True if file was deleted, False if file didn't exist
    """
    try:
        file_path = get_file_path(filename, file_type)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False


def validate_and_process_upload(file: UploadFile) -> Tuple[str, str]:
    """
    Validate and process an uploaded file.
    
    Args:
        file: The uploaded file
        
    Returns:
        Tuple of (file_hash, original_filename)
        
    Raises:
        HTTPException: If validation fails
    """
    # Validate file type
    validate_file_type(file)
    
    # Validate file size
    validate_file_size(file)
    
    # Calculate file hash
    file_hash = calculate_file_hash(file)
    
    # Get original filename
    original_filename = file.filename or "unknown.pdf"
    
    return file_hash, original_filename
