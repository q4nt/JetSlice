@echo off
title JetSlice - Premium Delivery
echo.
echo  =============================================
echo   JetSlice - Premium Delivery Service
echo  =============================================
echo.

:: Install dependencies if needed
echo  [1/2] Checking dependencies...
python -m pip install -r "%~dp0requirements.txt" --quiet 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [!] pip install failed - trying with --user flag...
    python -m pip install -r "%~dp0requirements.txt" --quiet --user 2>nul
)
echo  [OK] Dependencies ready.
echo.

:: Auto-launch UI in default browser
echo  [3/3] Opening JetSlice Interface...
start http://localhost:8042/index.html

python "%~dp0server.py"
pause
