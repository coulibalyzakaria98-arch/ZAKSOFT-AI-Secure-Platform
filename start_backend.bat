@echo off
echo.
echo  ==========================================
echo   ZAKSOFT AI Secure Platform — Backend
echo  ==========================================
echo.
cd /d "%~dp0backend"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
