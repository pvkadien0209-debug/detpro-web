@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [DetPro Next.js] Day code len https://github.com/pvkadien0209-debug/detpro-web
if not exist ".git" (
  git init
  git branch -M main
  git remote add origin https://github.com/pvkadien0209-debug/detpro-web.git
)
echo.
echo Kiem tra .env.local KHONG nam trong danh sach duoi day:
git add -A
git status --short
echo.
set /p OK=Dung danh sach? Go y roi Enter de commit va push:
if /i not "%OK%"=="y" goto :eof
git commit -m "N1: khung Next.js DetPro + MongoDB/TTS (#187, #188)"
git push -u origin main
pause
