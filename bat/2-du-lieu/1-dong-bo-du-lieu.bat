@echo off
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] Dong bo du lieu bai + logo tu SEO-PT-projectjs (chi doc, khong sua project cu)...
call node scripts\dong-bo-du-lieu.mjs --nguon "C:\Dienpham\App\SEO-PT-projectjs\client\public"
echo.
echo Xong. Thu tren may: bat\3-chay-thu\1-chay-thu.bat   -   Dua len web: bat\4-dua-len-web\1-day-len-github.bat
pause
