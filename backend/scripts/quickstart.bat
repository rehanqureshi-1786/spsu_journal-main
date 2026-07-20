@echo off
REM Quick start script for The Essence Journal System (Windows)

echo ==========================================
echo The Essence - Quick Start Setup
echo ==========================================

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo WARNING: Please edit .env with your database credentials!
)

REM Run migrations
echo Running database migrations...
alembic upgrade head

REM Initialize database
echo Initializing database with roles...
python scripts\init_db.py

echo.
echo ==========================================
echo Setup complete!
echo ==========================================
echo.
echo To start the server, run:
echo   uvicorn app.main:app --reload
echo.
pause
