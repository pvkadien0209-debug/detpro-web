@echo off
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
rem #277: nguon moi = DetPro-QuanTri\DetPro\data (goc SEO-PT-projectjs da doi ten o #275)
cd /d "%~dp0..\.."
echo [DetPro] Dong bo du lieu bai tu C:\Dienpham\App\DetPro-QuanTri\DetPro\data (chi doc, khong sua ben do)...
call node scripts\dong-bo-du-lieu.mjs --nguon "C:\Dienpham\App\DetPro-QuanTri\DetPro\data"
echo.
echo Xong. Thu tren may: bat\3-chay-thu\1-chay-thu.bat   -   Dua len web: bat\4-dua-len-web\1-day-len-github.bat
pause
