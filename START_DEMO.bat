@echo off
echo Starting Malaria AI Local Hub...

:: Start the Python ML Server in a new window
start cmd /k "python app.py"

:: Wait 3 seconds to let Python boot up
timeout /t 3 /nobreak > NUL

:: Start the Node.js Server in a new window
start cmd /k "node index.js"

:: Wait 2 seconds to let Node boot up
timeout /t 2 /nobreak > NUL

:: Open the frontend pages in your default browser
start patient.html
start asha.html
start dashboard.html

echo All systems running! You can now turn off Wi-Fi.