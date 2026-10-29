@echo off
chcp 65001 >nul
echo === #301 Huy hieu nhom hoc (gom #285 #290 #291 #298 #300) ===
cd /d "%~dp0"
tar -xf "goi-301.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
cd /d "%~dp0..\4-dua-len-web"
call 1-day-len-github.bat
