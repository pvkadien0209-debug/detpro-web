@echo off
chcp 65001 >nul
echo === Cap nhat web: nhan xet bai noi + Det tro thu #268 #269 ===
cd /d "%~dp0"
echo [1/2] Giai nen goi-269.zip vao C:\Dienpham\App ...
tar -xf "goi-269.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
echo [2/2] Day len GitHub - Vercel tu cap nhat ...
cd /d "%~dp0..\4-dua-len-web"
call 1-day-len-github.bat
