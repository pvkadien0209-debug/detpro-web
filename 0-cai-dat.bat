@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [DetPro Next.js] Cai thu vien (npm install)...
call npm install
echo.
echo Xong. Buoc tiep: 1-dong-bo-du-lieu.bat
pause
