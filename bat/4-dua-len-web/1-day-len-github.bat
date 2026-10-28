@echo off
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] Day code len https://github.com/pvkadien0209-debug/detpro-web (nhanh main) - Vercel tu build
if not exist ".git" (
  git init
  git remote add origin https://github.com/pvkadien0209-debug/detpro-web.git
)
echo.
echo Kiem tra .env.local KHONG nam trong danh sach duoi day:
git add -A
git status --short
echo.
set /p OK=Dung danh sach? Go y roi Enter de commit va push:
if /i not "%OK%"=="y" (
  echo Da huy, chua commit.
  pause
  goto :eof
)
set /p MSG=Ghi chu cho lan day nay (Enter = "Cap nhat web DetPro"):
if "%MSG%"=="" set MSG=Cap nhat web DetPro
git commit -m "%MSG%"
rem dat ten nhanh la main (lam sau commit de chay duoc ca voi Git cu)
git branch -M main
git push -u origin main
echo.
echo Xong. Vercel se tu build tu nhanh main (neu da noi project Vercel voi repo nay).
pause
