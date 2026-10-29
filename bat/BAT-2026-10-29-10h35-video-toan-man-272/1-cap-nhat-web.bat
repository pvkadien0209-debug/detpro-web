@echo off
chcp 65001 >nul
echo === Cap nhat web #272: video xem toan man hinh tren dien thoai ===
cd /d "%~dp0"
tar -xf "goi-272.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
cd /d "%~dp0..\4-dua-len-web"
call 1-day-len-github.bat
