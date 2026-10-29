@echo off
chcp 65001 >nul
echo === #277 Cap nhat web: sua loi build (YouTube #273) + doi nguon du lieu sang DetPro-QuanTri ===
cd /d "%~dp0"
tar -xf "goi-277.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
echo Da giai nen. Day len GitHub - Vercel build lai ...
cd /d "%~dp0..\4-dua-len-web"
call 1-day-len-github.bat
