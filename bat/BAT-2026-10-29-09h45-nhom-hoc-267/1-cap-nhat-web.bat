@echo off
chcp 65001 >nul
echo === Cap nhat web: Nhom hoc #267 ===
cd /d "%~dp0"
echo [1/3] Giai nen goi-267.zip vao C:\Dienpham\App ...
tar -xf "goi-267.zip" -C "C:\Dienpham\App"
if errorlevel 1 (echo LOI giai nen & pause & exit /b 1)
echo [2/3] Xoa 2 tep cu khong con dung ...
del /q "C:\Dienpham\App\DetPro\components\nhom\NhomHdr.js" 2>nul
del /q "C:\Dienpham\App\DetPro\components\nhom\NhomHoiDap.js" 2>nul
echo [3/3] Day len GitHub - Vercel tu cap nhat ...
cd /d "%~dp0..\4-dua-len-web"
call 1-day-len-github.bat
