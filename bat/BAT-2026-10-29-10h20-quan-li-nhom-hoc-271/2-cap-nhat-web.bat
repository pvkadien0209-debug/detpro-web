@echo off
chcp 65001 >nul
echo === Cap nhat web #271 (gom #268 #269 #270 #271) ===
cd /d "%~dp0"
tar -xf "goi-271.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
cd /d "%~dp0..\4-dua-len-web"
call 1-day-len-github.bat
