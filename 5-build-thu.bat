@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [DetPro Next.js] Build giong Vercel roi chay ban build o http://localhost:3001
call npm run build
if errorlevel 1 (
  echo.
  echo Build LOI - xem dong do o tren.
  pause
  goto :eof
)
call npm run start
