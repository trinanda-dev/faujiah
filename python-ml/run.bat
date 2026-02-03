@echo off
setlocal

REM Ensure we run from the script directory
cd /d "%~dp0"

REM Create virtual environment if missing
if not exist venv\Scripts\activate.bat (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip to avoid dependency issues
python -m pip install --upgrade pip

REM Check if uvicorn is available; if not, install dependencies
python -c "import uvicorn" 2>nul
if errorlevel 1 (
    echo Installing Python dependencies from requirements.txt...
    pip install -r requirements.txt
) else (
    echo Dependencies already installed.
)

REM Run the server using python -m to avoid PATH issues
REM Use port 8002 to avoid conflict with Laravel dev server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002

endlocal
