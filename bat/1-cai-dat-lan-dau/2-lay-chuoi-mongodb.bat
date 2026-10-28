@echo off
chcp 65001 >nul
rem #233: tep .bat nam trong bat\<viec>\ -> ve thu muc goc DetPro truoc khi chay
cd /d "%~dp0..\.."
echo [DetPro] Buoc 2/3 lan dau: chep chuoi ket noi MongoDB + khoa Google Drive tu project cu vao .env.local
echo   (khong in ra man hinh, khong len git)
call node scripts\lay-chuoi-mongodb.mjs --nguon "C:\Dienpham\App\SEO-PT-projectjs\server\ulti\mongodb.js"
echo.
echo Xong. Buoc tiep: bat\2-du-lieu\1-dong-bo-du-lieu.bat
pause
