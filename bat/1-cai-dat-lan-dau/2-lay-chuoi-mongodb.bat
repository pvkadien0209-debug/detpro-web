@echo off
call "%~dp0..\_ghi-bam.bat" "1-cai-dat-lan-dau\2-lay-chuoi-mongodb"
chcp 65001 >nul
rem #286: khoa nay giu o MOT CHO C:\Dienpham\App\DetPro-QuanTri\bi-mat\khoa.env (truoc: doc mongodb.js cu trong AOLD, #277)
rem Ghi MONGODB_URI, DRIVE_API_KEY, QUANLI_MATKHAU vao .env.local cua web. Khoa khong hien ra man hinh.
set "BM=C:\Dienpham\App\DetPro-QuanTri\bi-mat"
if not exist "%BM%\khoa.env" (
  echo Chua co khoa.env. Bam truoc: C:\Dienpham\App\DetPro-QuanTri\DetPro\bat\BAT-2026-10-29-15h00-gom-khoa-285\1-gom-khoa-ve-day.bat
  pause
  exit /b 1
)
cd /d "%BM%"
node dong-bo-khoa.mjs phat --chi=web
echo.
echo Vercel: Settings - Environment Variables - dan cung gia tri (mo khoa.env bang Notepad).
pause
