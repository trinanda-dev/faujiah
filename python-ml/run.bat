@echo off
REM Run FastAPI server on Windows

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Check if uvicorn is available
python -c "import uvicorn" 2>nul
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8001

