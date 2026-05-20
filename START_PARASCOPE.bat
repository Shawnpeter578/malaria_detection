@echo off
color 0B
echo ===================================================
echo   🚀 PARASCOPE SYSTEM INITIALIZER (HACKATHON V2)
echo ===================================================
echo.

echo [1/3] Checking Node.js Backend Dependencies...
call npm install --silent
echo ✅ Node dependencies verified.
echo.

echo [2/3] Building Secure Python Virtual Environment...
if not exist venv (
    echo Creating new isolated Python sandbox...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Python dependencies (this might take a minute)...
call pip install -r requirements.txt --quiet
echo ✅ Python dependencies verified.
echo.

echo [3/3] IGNITING SERVERS...
echo.

:: Node Server
start "ParaScope Node Hub" cmd /k "color 0A && echo 🟢 STARTING NODE HUB (PORT 3000)... && npm run dev"

:: Python Server (Forcing it to use the secure venv)
start "ParaScope AI Engine" cmd /k "color 0D && call venv\Scripts\activate && echo 🟣 STARTING EDGE AI ENGINE (PORT 5000)... && python app.py"

echo ===================================================
echo ✅ ALL SYSTEMS ONLINE!
echo 1. Keep the two new terminal windows open.
echo 2. Open 'asha.html' or 'dashboard.html' in your browser.
echo ===================================================
pause