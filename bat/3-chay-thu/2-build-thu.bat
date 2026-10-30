@echo off
call "%~dp0..\_ghi-bam.bat" "3-chay-thu\2-build-thu"
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] Build giong Vercel roi chay ban build o http://localhost:3001
call npm run build
if errorlevel 1 (
  echo.
  echo Build LOI - xem dong do o tren.
  pause
  goto :eof
)
call npm run start
pause
