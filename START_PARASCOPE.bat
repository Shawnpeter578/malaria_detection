@echo off
color 0B
echo ===================================================
echo   🚀 PARASCOPE SYSTEM INITIALIZER (HACKATHON V1)
echo ===================================================
echo.

echo [1/3] Checking Node.js Backend Dependencies...
call npm install --silent
echo ✅ Node dependencies verified.
echo.

echo [2/3] Checking Python Edge AI Dependencies...
call pip install -r requirements.txt --quiet
echo ✅ Python dependencies verified.
echo.

echo [3/3] IGNITING SERVERS...
echo.

:: Open a new terminal window for the Node Server
start "ParaScope Node Hub" cmd /k "color 0A && echo 🟢 STARTING NODE HUB (PORT 3000)... && npm run dev"

:: Open a new terminal window for the Python AI Server
start "ParaScope AI Engine" cmd /k "color 0D && echo 🟣 STARTING EDGE AI ENGINE (PORT 5000)... && python app.py"

echo ===================================================
echo ✅ ALL SYSTEMS ONLINE!
echo 1. Keep the two new terminal windows open.
echo 2. Double-click 'asha.html' or 'dashboard.html' to begin.
echo ===================================================
pause