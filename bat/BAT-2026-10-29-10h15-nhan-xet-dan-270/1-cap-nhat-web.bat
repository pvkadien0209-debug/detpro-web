@echo off
chcp 65001 >nul
echo === Cap nhat web #270 (gom #268 #269 #270) ===
cd /d "%~dp0"
tar -xf "goi-270.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
cd /d "%~dp0..\4-dua-len-web"
call 1-day-len-github.bat
